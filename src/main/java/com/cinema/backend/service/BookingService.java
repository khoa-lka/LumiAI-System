package com.cinema.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.backend.entities.Account;

import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.PaymentTransaction;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.PaymentTransactionRepository;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.TicketRepository;
import com.cinema.backend.repositories.VoucherRepository;
import com.cinema.backend.entities.CheckoutFoodItem;
import com.cinema.backend.entities.FoodBeverage;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import com.cinema.backend.dto.CheckoutResponseDTO;

@Service
public class BookingService {
    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private VoucherService voucherService;
    
    @Autowired
    private FoodBeverageRepository foodRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.public-url}")
    private String publicUrl;

    
@Transactional
public CheckoutResponseDTO checkout(CheckoutRequest request) {
System.out.println("===== BOOKING SERVICE =====");
System.out.println(request);
List<String> savedTicketCodes = new ArrayList<>();
List<String> fnbSummaryList = new ArrayList<>();
String fnbSummary = "Không có";
    if (request.getShowtimeId() == null) {
        throw new RuntimeException("ShowtimeId is null from client");
    }

    // Lấy khách hàng
    Account customer = accountRepository.findById(request.getAccountId())
            .orElseThrow(() -> new RuntimeException("Customer not found"));

    // Lấy suất chiếu
    Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
            .orElseThrow(() -> new RuntimeException("Showtime not found"));

    // =========================
    // Tạo Order
    // =========================

    BigDecimal grossAmount = BigDecimal.ZERO;
    String firstTicketCode = "";
    List<String> bookedSeats = new ArrayList<>();

// Tổng tiền vé
grossAmount = grossAmount.add(
        showtime.getTicketPrice().multiply(
                BigDecimal.valueOf(request.getSeats().size())
        )
);

if (request.getFnb() != null) {

    for (CheckoutFoodItem item : request.getFnb()) {

        FoodBeverage food = foodRepository
                .findById(item.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food not found"));

        grossAmount = grossAmount.add(
                food.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                )
        );
    }
}



    Order1 order = new Order1();

    order.setOrderCode("ORDER-" + System.currentTimeMillis());
    order.setCreatedDate(LocalDateTime.now());

    order.setGrossAmount(grossAmount);

    // ==========================================================
    // 🔒 FIX BẢO MẬT: Tự tính finalAmount trên Server, KHÔNG tin
    // số tiền request.getTotalMoney() do Front-end gửi lên nữa —
    // nếu không, ai sửa request bằng DevTools/Postman cũng có thể
    // tự đặt giá vé tùy ý (VD: 1.000đ) mà hệ thống vẫn lưu đơn.
    // ==========================================================
    BigDecimal totalDiscount = BigDecimal.ZERO;
    Voucher appliedVoucher = null;

    // 1. Kiểm tra mã Voucher (Áp dụng cho cả luồng nhập tay MANUAL và tự động AUTO quét ngầm)
    Optional<Voucher> voucherOpt = Optional.empty();

    if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
        // Luồng 1: Nếu client gửi mã cụ thể (nhập tay hoặc FE tự quét điền)
        voucherOpt = voucherRepository.findByVoucherCode(request.getVoucherCode());
    } else {
        // Luồng 2: ĐÃ ĐỒNG BỘ: Tự động quét DB tìm Voucher mang cờ 'AUTO' đang hoạt động
        voucherOpt = voucherRepository.findAll().stream()
                .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()) 
                          && "AUTO".equalsIgnoreCase(v.getApplyType())) // 🎯 Khớp chuẩn xác thuộc tính applyType của nhóm em!
                .findFirst();
    }

    // Nếu tìm thấy voucher thỏa mãn (từ luồng 1 hoặc luồng 2), tiến hành tính toán giảm giá
    if (voucherOpt.isPresent()) {
        Voucher v = voucherOpt.get();
        
        // Các chốt chặn kiểm tra: trạng thái hoạt động, lượt dùng, hạn dùng và hạn mức đơn hàng tối thiểu
        boolean isActive = "ACTIVE".equalsIgnoreCase(v.getStatus());
        boolean isNotExpired = (v.getExpiredDate() == null || v.getExpiredDate().isAfter(LocalDateTime.now()));
        boolean hasUsage = v.getUsageLimit() > 0;
        boolean meetMinOrder = (v.getMinimumOrder() == null || grossAmount.compareTo(BigDecimal.valueOf(v.getMinimumOrder())) >= 0);

        if (isActive && isNotExpired && hasUsage && meetMinOrder) {
            appliedVoucher = v;
            
            // Gán lại mã vào order để ghi nhận hóa đơn dùng voucher hệ thống tự áp dụng
            if (request.getVoucherCode() == null || request.getVoucherCode().isBlank()) {
                request.setVoucherCode(v.getVoucherCode());
            }
            
            if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                BigDecimal calculatedDiscount = grossAmount.multiply(BigDecimal.valueOf(v.getDiscountValue())).divide(BigDecimal.valueOf(100));
                if (v.getMaxDiscount() != null && v.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
                    if (calculatedDiscount.compareTo(v.getMaxDiscount()) > 0) {
                        calculatedDiscount = v.getMaxDiscount();
                    }
                }
                totalDiscount = calculatedDiscount;
            } else {
                totalDiscount = BigDecimal.valueOf(v.getDiscountValue());
            }
        }
    }

    BigDecimal finalAmount = grossAmount.subtract(totalDiscount);
    if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
        finalAmount = BigDecimal.ZERO;
    }
    order.setFinalAmount(finalAmount);

    order.setOrderStatus("COMPLETED");
    order.setPaymentMethod(request.getPaymentMethod());
    order.setPaymentStatus("SUCCESS");

    order.setCustomer(customer);
    order.setShowtime(showtime);

    if (appliedVoucher != null) {
        order.setVoucher(appliedVoucher);
    }
System.out.println("SAVE ORDER SAFELY WITH FINAL AMOUNT: " + finalAmount);
    order = orderRepository.save(order);
System.out.println("ORDER ID = " + order.getOrderId());
    // =========================
    // Tạo Ticket + OrderDetail
    // =========================
    for (String seatCode : request.getSeats()) {

        String row = seatCode.substring(0, 1);
        Integer number = Integer.parseInt(seatCode.substring(1));

        Seat seat = seatRepository
                .findByRoomIdAndSeatRowAndSeatNumber(
                        showtime.getRoomId(),
                        row,
                        number)
                .orElseThrow(() -> new RuntimeException("Seat not found: " + seatCode));

        Ticket ticket = new Ticket();

        ticket.setOrder(order);
        ticket.setSeat(seat);
        ticket.setShowtime(showtime);

        ticket.setTicketStatus("SOLD");

        String code = "TICKET-" + System.currentTimeMillis() + "-" + seatCode;

        ticket.setTicketCode(code);
        ticket.setQrCode(code);

        if (firstTicketCode.isBlank()) {
        firstTicketCode = code;
        }   

        ticket = ticketRepository.save(ticket);
        savedTicketCodes.add(code);

        OrderDetail detail = new OrderDetail();

        detail.setOrder(order);
        detail.setTicket(ticket);

        detail.setQuantity(1);

        detail.setSubtotal(showtime.getTicketPrice());

        orderDetailRepository.save(detail);
        bookedSeats.add(seatCode);
    }
System.out.println("SAVE TICKET OK");
// =========================
// Tạo OrderDetail cho F&B
// =========================
if (request.getFnb() != null && !request.getFnb().isEmpty()) {

    for (CheckoutFoodItem item : request.getFnb()) {

        FoodBeverage food = foodRepository
                .findById(item.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food not found"));

        // Kiểm tra tồn kho
        if (food.getStockQuantity() < item.getQuantity()) {
            throw new RuntimeException(
                    food.getItemName() + " không đủ số lượng trong kho");
        }

        // Tạo OrderDetail cho món ăn
        OrderDetail detail = new OrderDetail();

        detail.setOrder(order);

        detail.setFoodItem(food);

        detail.setQuantity(item.getQuantity());

        detail.setSubtotal(
                food.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                )
        );

        orderDetailRepository.save(detail);

        // Trừ tồn kho
        food.setStockQuantity(
                food.getStockQuantity() - item.getQuantity());

        foodRepository.save(food);

        fnbSummaryList.add(food.getItemName() + " x" + item.getQuantity());
    }
}

fnbSummary = fnbSummaryList.isEmpty()
        ? "Không có"
        : String.join(", ", fnbSummaryList);

    // =========================
    // Cập nhật Voucher
    // =========================
    if (request.getVoucherCode() != null &&
            !request.getVoucherCode().isBlank()) {

        voucherService.useVoucher(request.getVoucherCode());
    }

    // =========================
    // Tạo PaymentTransaction
    // =========================
    PaymentTransaction payment = new PaymentTransaction();

    payment.setTransactionCode("PAY-" + System.currentTimeMillis());

    payment.setAmount(order.getFinalAmount());

    payment.setPaymentStatus("SUCCESS");

    payment.setOrder(order);
System.out.println("SAVE PAYMENT");
    paymentTransactionRepository.save(payment);
try {
    String customerName = customer.getFullname();

    String email = request.getEmail();
    if (email == null || email.isBlank()) {
        email = customer.getEmail();
    }

    String movieName = showtime.getMovie() != null
            ? showtime.getMovie().getTitle()
            : request.getMovieName();

    String showtimeText = showtime.getStartTime() != null
            ? showtime.getStartTime().toString()
            : "Không xác định";

    String seatsText = String.join(", ", request.getSeats());

String totalAmount = order.getFinalAmount() != null
        ? String.format("%,.0f", order.getFinalAmount())
        : "0";

    String ticketCode = firstTicketCode != null && !firstTicketCode.isBlank()
            ? firstTicketCode
            : order.getOrderCode();

    // Logo là ảnh tĩnh trong project
    String logoPath = "img/las_logo.png";

    // Poster lấy từ DB movie.mainposter_url
    String posterPath = "";

    if (showtime.getMovie() != null && showtime.getMovie().getMainposterUrl() != null) {
        posterPath = showtime.getMovie().getMainposterUrl();
    }

    // QR code chứa thông tin vé
    String qrData = "LAS-CINEMA|ORDER=" + order.getOrderCode() + "|TICKET=" + ticketCode;

    String html = emailService.buildTicketEmailHtml(
            customerName,
            order.getOrderCode(),
            movieName,
            showtimeText,
            seatsText,
            totalAmount,
            ticketCode,
            fnbSummary,
            qrData
    );

    emailService.sendTicketHtmlEmailWithImages(
            email,
            "LAS Cinema - Vé xem phim " + order.getOrderCode(),
            html,
            logoPath,
            posterPath
    );

    System.out.println("ĐÃ GỬI EMAIL HTML VÉ TỚI: " + email);
    System.out.println("LOGO PATH = " + logoPath);
    System.out.println("POSTER PATH = " + posterPath);

} catch (Exception e) {
    e.printStackTrace();
    System.out.println("GỬI EMAIL HTML VÉ THẤT BẠI: " + e.getMessage());
}

System.out.println("DONE");
return new CheckoutResponseDTO(order, savedTicketCodes, fnbSummary);
}

private String toPublicImageUrl(String imagePath) {
    if (imagePath == null || imagePath.isBlank()) {
        return "";
    }

    imagePath = imagePath.trim();

    // Nếu đã là URL online rồi thì giữ nguyên
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    // Xóa dấu / đầu nếu có
    while (imagePath.startsWith("/")) {
        imagePath = imagePath.substring(1);
    }

    // Ghép với public URL
    return publicUrl + "/" + imagePath;
}
}
