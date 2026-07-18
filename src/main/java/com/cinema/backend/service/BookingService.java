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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

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

    @Autowired
    private BookingPriceService bookingPriceService;

    @Autowired
    private CheckoutHashService checkoutHashService;

    @Value("${app.public-url}")
    private String publicUrl;
    
@Transactional
public CheckoutResponseDTO checkout(
        CheckoutRequest request
) {
    System.out.println("===== BOOKING SERVICE =====");
    System.out.println(request);

    List<String> savedTicketCodes =
            new ArrayList<>();

    List<String> fnbSummaryList =
            new ArrayList<>();

    List<String> bookedSeats =
            new ArrayList<>();

    String fnbSummary = "Không có";
    String firstTicketCode = "";

    // =====================================================
    // 1. KIỂM TRA REQUEST
    // =====================================================
    if (request == null) {
        throw new RuntimeException(
                "Dữ liệu checkout không tồn tại"
        );
    }

    if (request.getAccountId() == null) {
        throw new RuntimeException(
                "Thiếu accountId"
        );
    }

    if (request.getShowtimeId() == null) {
        throw new RuntimeException(
                "Thiếu showtimeId"
        );
    }

    if (request.getSeats() == null ||
            request.getSeats().isEmpty()) {

        throw new RuntimeException(
                "Danh sách ghế không được để trống"
        );
    }

// =====================================================
// 2. KIỂM TRA PHƯƠNG THỨC THANH TOÁN
// =====================================================
String paymentMethod =
        request.getPaymentMethod() == null
                ? ""
                : request.getPaymentMethod()
                        .trim()
                        .toUpperCase();

String expectedProvider;

if ("QR".equals(paymentMethod) ||
        "PAYOS".equals(paymentMethod)) {

    expectedProvider = "PAYOS";

} else if (
        "VNPAY".equals(paymentMethod) ||
        "VNPAY_QR".equals(paymentMethod) ||
        "VNPAY_ATM".equals(paymentMethod)
) {
    expectedProvider = "VNPAY";

} else {
    throw new RuntimeException(
            "Phương thức thanh toán không hợp lệ"
    );
}

// =====================================================
// 3. BACKEND TỰ TÍNH SỐ TIỀN
// =====================================================
BigDecimal serverFinalAmount =
        bookingPriceService
                .calculateFinalAmount(
                        request
                );

// =====================================================
// 4. KIỂM TRA MÃ GIAO DỊCH
// =====================================================
String paymentReference =
        request.getPaymentReference();

if (paymentReference == null ||
        paymentReference.isBlank()) {

    throw new RuntimeException(
            "Thiếu mã giao dịch thanh toán"
    );
}

paymentReference =
        paymentReference.trim();

// =====================================================
// 5. LẤY VÀ KHÓA GIAO DỊCH
// =====================================================
PaymentTransaction payment =
        paymentTransactionRepository
                .findByTransactionCodeForUpdate(
                        paymentReference
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy giao dịch thanh toán"
                        )
                );

// =====================================================
// 6. KIỂM TRA PROVIDER
// =====================================================
if (payment.getProvider() == null ||
        !expectedProvider.equalsIgnoreCase(
                payment.getProvider()
        )) {

    throw new RuntimeException(
            "Mã giao dịch không thuộc phương thức đã chọn"
    );
}

// =====================================================
// 7. KIỂM TRA TRẠNG THÁI THANH TOÁN
// =====================================================
if (!"SUCCESS".equalsIgnoreCase(
        payment.getPaymentStatus()
)) {
    throw new RuntimeException(
            "Giao dịch chưa được xác nhận thanh toán"
    );
}

// =====================================================
// 8. CHỐNG DÙNG LẠI GIAO DỊCH
// =====================================================
if (Boolean.TRUE.equals(
        payment.getConsumed()
) || payment.getOrder() != null) {

    throw new RuntimeException(
            "Giao dịch đã được sử dụng"
    );
}

// =====================================================
// 9. KIỂM TRA TÀI KHOẢN
// =====================================================
if (payment.getAccount() == null ||
        payment.getAccount()
                .getAccountId() == null ||
        !payment.getAccount()
                .getAccountId()
                .equals(
                        request.getAccountId()
                )) {

    throw new RuntimeException(
            "Giao dịch không thuộc tài khoản này"
    );
}

// =====================================================
// 10. KIỂM TRA SỐ TIỀN
// =====================================================
if (payment.getAmount() == null ||
        payment.getAmount()
                .compareTo(
                        serverFinalAmount
                ) != 0) {

    throw new RuntimeException(
            "Số tiền giao dịch không khớp đơn hàng"
    );
}

// =====================================================
// 11. KIỂM TRA GHẾ, F&B VÀ VOUCHER
// =====================================================
String currentCheckoutHash =
        checkoutHashService.createHash(
                request,
                serverFinalAmount
        );

if (payment.getCheckoutHash() == null ||
        payment.getCheckoutHash()
                .isBlank()) {

    throw new RuntimeException(
            "Giao dịch chưa có checkout hash"
    );
}

boolean sameCheckoutData =
        MessageDigest.isEqual(
                currentCheckoutHash
                        .getBytes(
                                StandardCharsets.UTF_8
                        ),
                payment.getCheckoutHash()
                        .getBytes(
                                StandardCharsets.UTF_8
                        )
        );

if (!sameCheckoutData) {
    throw new RuntimeException(
            "Thông tin ghế, F&B hoặc voucher đã bị thay đổi"
    );
}

    // =====================================================
    // 12. LẤY TÀI KHOẢN VÀ SUẤT CHIẾU
    // =====================================================
    Account customer = accountRepository
            .findById(request.getAccountId())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Không tìm thấy khách hàng"
                    )
            );

    Showtime showtime = showtimeRepository
            .findById(request.getShowtimeId())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Không tìm thấy suất chiếu"
                    )
            );

    // =====================================================
    // 13. TÍNH GROSS AMOUNT
    // =====================================================
    BigDecimal grossAmount =
            showtime.getTicketPrice().multiply(
                    BigDecimal.valueOf(
                            request.getSeats().size()
                    )
            );

    if (request.getFnb() != null) {
        for (CheckoutFoodItem item : request.getFnb()) {

            if (item == null ||
                    item.getFoodItemId() == null ||
                    item.getQuantity() == null ||
                    item.getQuantity() <= 0) {

                continue;
            }

            FoodBeverage food = foodRepository
                    .findById(item.getFoodItemId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy món ăn"
                            )
                    );

            grossAmount = grossAmount.add(
                    food.getPrice().multiply(
                            BigDecimal.valueOf(
                                    item.getQuantity()
                            )
                    )
            );
        }
    }

    Order1 order = new Order1();

order.setOrderCode(
        "ORDER-" + System.currentTimeMillis()
);

order.setCreatedDate(
        LocalDateTime.now()
);

order.setGrossAmount(
        grossAmount
);

order.setFinalAmount(
        serverFinalAmount
);

order.setOrderStatus(
        "COMPLETED"
);

order.setPaymentMethod(
        expectedProvider
);

order.setPaymentStatus(
        "SUCCESS"
);

order.setCustomer(customer);

    if (request.getVoucherCode() != null &&
            !request.getVoucherCode().isBlank()) {

        Voucher voucher = voucherRepository
                .findByVoucherCode(request.getVoucherCode())
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        order.setVoucher(voucher);
    }
System.out.println("SAVE ORDER");
    order = orderRepository.save(order);
System.out.println("ORDER ID = " + order.getOrderId());
    // =========================
    // Tạo Ticket + OrderDetail
    // =========================
    for (String seatCode : request.getSeats()) {

    String row = seatCode.substring(0, 1);

    Integer number =
            Integer.parseInt(
                    seatCode.substring(1)
            );

    Seat seat = seatRepository
            .findByRoomIdAndSeatRowAndSeatNumber(
                    showtime.getRoomId(),
                    row,
                    number
            )
            .orElseThrow(() ->
                    new RuntimeException(
                            "Seat not found: " +
                            seatCode
                    )
            );

    Ticket ticket = new Ticket();

    ticket.setTicketStatus("SOLD");

    String code =
            "TICKET-" +
            System.currentTimeMillis() +
            "-" +
            seatCode;

    ticket.setTicketCode(code);
    ticket.setQrCode(code);

    // Hai dòng đang bị thiếu
    ticket.setShowtime(showtime);
    ticket.setSeat(seat);

    if (firstTicketCode.isBlank()) {
        firstTicketCode = code;
    }

    Ticket savedTicket =
            ticketRepository.save(ticket);
    savedTicketCodes.add(code);

    OrderDetail detail =
            new OrderDetail();

    detail.setOrder(order);
    detail.setTicket(savedTicket);
    detail.setFoodItem(null);
    detail.setQuantity(1);
    detail.setSubtotal(
            showtime.getTicketPrice()
    );

    orderDetailRepository.save(detail);

    bookedSeats.add(seatCode);
}
System.out.println("SAVE TICKET OK");
// =========================
// Tạo OrderDetail cho F&B
// =========================
if (request.getFnb() != null &&
        !request.getFnb().isEmpty()) {

    for (CheckoutFoodItem item : request.getFnb()) {

        if (item == null ||
                item.getFoodItemId() == null ||
                item.getQuantity() == null ||
                item.getQuantity() <= 0) {

            continue;
        }

        FoodBeverage food = foodRepository
                .findById(item.getFoodItemId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Food not found"
                        )
                );

        if (food.getStockQuantity() <
                item.getQuantity()) {

            throw new RuntimeException(
                    food.getItemName()
                            + " không đủ số lượng trong kho"
            );
        }

        OrderDetail detail =
                new OrderDetail();

        detail.setOrder(order);
        detail.setFoodItem(food);
        detail.setQuantity(item.getQuantity());

        detail.setSubtotal(
                food.getPrice().multiply(
                        BigDecimal.valueOf(
                                item.getQuantity()
                        )
                )
        );

        orderDetailRepository.save(detail);

        food.setStockQuantity(
                food.getStockQuantity()
                        - item.getQuantity()
        );

        foodRepository.save(food);

        fnbSummaryList.add(
                food.getItemName()
                        + " x"
                        + item.getQuantity()
        );
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
    
payment.setOrder(order);
payment.setConsumed(true);
payment.setConsumedAt(LocalDateTime.now());

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
    String qrData = order.getOrderCode();
   String html = emailService.buildTicketEmailHtml(
        customerName,
        order.getOrderCode(),
        movieName,
        showtimeText,
        seatsText,
        fnbSummary,
        totalAmount,
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

