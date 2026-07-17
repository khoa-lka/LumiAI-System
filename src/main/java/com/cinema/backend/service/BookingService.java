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
    private com.cinema.backend.controllers.PaymentController paymentController;

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
        
        // 🔒 UC-07: Chặn đặt trùng ghế — kiểm tra ghế đã bán chưa
        java.util.List<String> soldSeats =
                seatRepository.findSoldSeatCodesByShowtime(request.getShowtimeId());
        for (String seatCode : request.getSeats()) {
            boolean taken = soldSeats.stream()
                    .anyMatch(s -> s != null && s.trim().equalsIgnoreCase(seatCode.trim()));
            if (taken) {
                throw new RuntimeException(
                        "Ghế " + seatCode + " đã có người đặt, vui lòng chọn ghế khác!");
            }
        }
        
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
        // 🔒 FIX BẢO MẬT: Tự tính finalAmount trên Server
        // ==========================================================
        BigDecimal totalDiscount = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        Optional<Voucher> voucherOpt = Optional.empty();

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            voucherOpt = voucherRepository.findByVoucherCode(request.getVoucherCode());
        } else {
            voucherOpt = voucherRepository.findAll().stream()
                    .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()) 
                              && "AUTO".equalsIgnoreCase(v.getApplyType()))
                    .findFirst();
        }

        if (voucherOpt.isPresent()) {
            Voucher v = voucherOpt.get();
            
            boolean isActive = "ACTIVE".equalsIgnoreCase(v.getStatus());
            boolean isNotExpired = (v.getExpiredDate() == null || v.getExpiredDate().isAfter(LocalDateTime.now()));
            boolean hasUsage = v.getUsageLimit() > 0;
            boolean meetMinOrder = (v.getMinimumOrder() == null || grossAmount.compareTo(BigDecimal.valueOf(v.getMinimumOrder())) >= 0);

            if (isActive && isNotExpired && hasUsage && meetMinOrder) {
                appliedVoucher = v;
                
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

            try {
                ticket = ticketRepository.save(ticket);
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                throw new RuntimeException(
                        "Ghế " + seatCode + " vừa có người khác đặt mất, vui lòng chọn lại!");
            }
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
        
        // ==========================================================
        // 🔒 TỐI ƯU BẢO MẬT: Tạo OrderDetail và trừ tồn kho F&B (Atomic Update)
        // ==========================================================
        if (request.getFnb() != null && !request.getFnb().isEmpty()) {
            for (CheckoutFoodItem item : request.getFnb()) {
                FoodBeverage food = foodRepository
                        .findById(item.getFoodItemId())
                        .orElseThrow(() -> new RuntimeException("Food not found"));

                // Chốt chặn quyết định: Trực tiếp thực hiện Atomic Update xuống DB
int updatedRows = foodRepository.decrementStockQuantity(item.getFoodItemId().longValue(), item.getQuantity());                
                // Nếu updatedRows trả về 0 nghĩa là điều kiện số lượng lớn hơn hoặc bằng lượng mua đã bị sai 
                // tại thời điểm câu lệnh Update thực thi (do luồng khác nhanh tay hơn trừ trước)
                if (updatedRows == 0) {
                    throw new RuntimeException(
                            "Món " + food.getItemName() + " không đủ số lượng tồn kho hoặc đã hết hàng!");
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
                fnbSummaryList.add(food.getItemName() + " x" + item.getQuantity());
            }
        }

        fnbSummary = fnbSummaryList.isEmpty()
                ? "Không có"
                : String.join(", ", fnbSummaryList);

        // ==========================================================
        // 🔒 TỐI ƯU BẢO MẬT: Cập nhật lượt dùng Voucher & Xử lý đồng thời
        // ==========================================================
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            boolean isVoucherUsed = voucherService.useVoucher(request.getVoucherCode());
            
            // Nếu hàm trả về false (vừa hết lượt ngay khoảnh khắc bấm đặt hàng)
            // Lập tức ném Exception để Spring kích hoạt Transaction Rollback toàn bộ tiến trình trên
            if (!isVoucherUsed) {
                throw new RuntimeException("Mã giảm giá vừa hết lượt sử dụng, vui lòng kiểm tra lại đơn hàng!");
            }
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

            String logoPath = "img/las_logo.png";
            String posterPath = "";

            if (showtime.getMovie() != null && showtime.getMovie().getMainposterUrl() != null) {
                posterPath = showtime.getMovie().getMainposterUrl();
            }

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

        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }

        while (imagePath.startsWith("/")) {
            imagePath = imagePath.substring(1);
        }

        return publicUrl + "/" + imagePath;
    }
}