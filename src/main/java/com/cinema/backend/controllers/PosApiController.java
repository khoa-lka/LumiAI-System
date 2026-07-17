package com.cinema.backend.controllers;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.Set;


import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import com.cinema.backend.entities.Feedback;
import com.cinema.backend.entities.FoodBeverage;
import com.cinema.backend.entities.Movie;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.PaymentTransaction;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.entities.Voucher;

import com.cinema.backend.repositories.FeedbackRepository;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.MovieRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.PaymentTransactionRepository;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.TicketRepository;
import com.cinema.backend.repositories.VoucherRepository;

// ==========================================================================
// 🖥️ API DÀNH RIÊNG CHO MÁY POS CỦA STAFF (bán vé/bắp nước tại quầy)
// Toàn bộ endpoint nằm dưới /api/pos, độc lập với luồng đặt vé online hiện
// có (BookingController/SeatController) để không đụng tới code cũ.
// ==========================================================================
@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*") // Tránh lỗi bảo mật CORS
public class PosApiController {

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private FoodBeverageRepository foodBeverageRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    // Gọi Service VNPAY
    @Autowired
    private com.cinema.backend.Payment.VNPayService vnPayService;

    @GetMapping("/movies")
    public ResponseEntity<List<Movie>> getActiveMovies() {
        List<Movie> movies = movieRepository.findByStatus("now_showing");
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackRepository.findAll()); // Lấy toàn bộ feedback từ DB
    }

    @PostMapping("/feedback")
    public ResponseEntity<String> submitFeedback(@RequestBody Feedback feedback) {
        try {
            // Tự động gán thời gian hiện tại nếu Entity chưa có
            if (feedback.getCreatedAt() == null) {
                feedback.setCreatedAt(java.time.LocalDateTime.now());
            }
            feedbackRepository.save(feedback);
            return ResponseEntity.ok("Gửi phản hồi thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/food")
    public ResponseEntity<List<FoodBeverage>> getAllFood() {
        return ResponseEntity.ok(foodBeverageRepository.findAll());
    }

    @GetMapping("/showtimes/{showtimeId}/booked-seats")
    public ResponseEntity<List<String>> getBookedSeats(@PathVariable Integer showtimeId) {
        List<String> bookedSeats = ticketRepository.findBookedSeatsByShowtime(showtimeId);
        return ResponseEntity.ok(bookedSeats);
    }

    @GetMapping("/showtimes/{showtimeId}/seats")
    public ResponseEntity<List<Seat>> getSeatMap(@PathVariable Integer showtimeId) {
        List<Seat> seats = seatRepository.findSeatsByShowtimeId(showtimeId);
        return ResponseEntity.ok(seats);
    }

    @GetMapping("/movies/{movieId}/showtimes")
    public ResponseEntity<List<Map<String, Object>>> getShowtimes(
            @PathVariable Integer movieId,
            @RequestParam("date") String date) {

        // Dùng method riêng cho POS (native query, trả kèm tên phòng) để
        // không đụng tới findShowtimesByMovieAndDate(Long, LocalDateTime, LocalDateTime)
        // đang được luồng online (BookingController) sử dụng.
        List<Map<String, Object>> showtimes = showtimeRepository.findPosShowtimesByMovieAndDate(movieId, date);
        return ResponseEntity.ok(showtimes);
    }
private BigDecimal toVnd(Object value, String fieldName) {
    if (value == null) {
        throw new IllegalArgumentException(fieldName + " không được để trống");
    }

    try {
        BigDecimal amount = new BigDecimal(String.valueOf(value));

        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(fieldName + " không được âm");
        }

        // VND không sử dụng số lẻ.
        return amount.setScale(0, RoundingMode.HALF_UP);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException(fieldName + " không hợp lệ");
    }
}
   @Transactional(rollbackFor = Exception.class)
@PostMapping("/checkout")
public ResponseEntity<?> checkoutOrder(
        @RequestBody com.cinema.backend.dto.CheckoutRequest request) {

    try {
        long timestamp = System.currentTimeMillis();

        // 1. Lấy suất chiếu thật từ database
        Showtime showtime = showtimeRepository
                .findById(request.getShowtimeId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy suất chiếu"));

        if (request.getSeats() == null || request.getSeats().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một ghế");
        }

        // 2. Kiểm tra ghế và chuẩn bị danh sách ghế hợp lệ
        List<Seat> allSeats =
                seatRepository.findSeatsByShowtimeId(request.getShowtimeId());

        List<String> bookedSeatList =
                ticketRepository.findBookedSeatsByShowtime(request.getShowtimeId());

        Set<String> bookedSeats = new HashSet<>();
        for (String seatCode : bookedSeatList) {
            if (seatCode != null) {
                bookedSeats.add(seatCode.trim().toUpperCase());
            }
        }

        Set<String> duplicatedSeats = new HashSet<>();
        List<Seat> selectedSeatEntities = new ArrayList<>();

        for (String seatCode : request.getSeats()) {
            if (seatCode == null || seatCode.trim().isEmpty()) {
                throw new IllegalArgumentException("Mã ghế không hợp lệ");
            }

            String normalizedSeatCode = seatCode.trim().toUpperCase();

            if (!duplicatedSeats.add(normalizedSeatCode)) {
                throw new IllegalArgumentException(
                        "Ghế " + normalizedSeatCode + " đang bị gửi trùng");
            }

            if (bookedSeats.contains(normalizedSeatCode)) {
                throw new IllegalArgumentException(
                        "Ghế " + normalizedSeatCode + " đã được bán");
            }

            Seat seat = allSeats.stream()
                    .filter(s -> {
                        String code =
                                String.valueOf(s.getSeatRow())
                                        + String.valueOf(s.getSeatNumber());

                        return code.equalsIgnoreCase(normalizedSeatCode);
                    })
                    .findFirst()
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Không tìm thấy ghế " + normalizedSeatCode));

            selectedSeatEntities.add(seat);
        }

        // 3. Backend tự tính tiền vé bằng giá trong Showtime
        BigDecimal ticketPrice =
                toVnd(showtime.getTicketPrice(), "Giá vé");

        BigDecimal ticketTotal = ticketPrice.multiply(
                BigDecimal.valueOf(selectedSeatEntities.size()));

        BigDecimal grossAmount = ticketTotal;

        // Lưu FoodBeverage thật đã lấy từ database
        Map<Integer, FoodBeverage> verifiedFoods = new HashMap<>();

        // 4. Backend tự tính giá bắp nước từ database
        if (request.getFoodItems() != null) {
            for (com.cinema.backend.dto.CheckoutRequest.FoodItemRequest food
                    : request.getFoodItems()) {

                if (food.getQuantity() <= 0) {
                    throw new IllegalArgumentException(
                            "Số lượng món ăn phải lớn hơn 0");
                }

                FoodBeverage foodFromDatabase = foodBeverageRepository
                        .findById(food.getFoodItemId())
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Không tìm thấy món ăn ID: "
                                                + food.getFoodItemId()));

                BigDecimal foodPrice =
                        toVnd(foodFromDatabase.getPrice(), "Giá món ăn");

                BigDecimal foodSubtotal = foodPrice.multiply(
                        BigDecimal.valueOf(food.getQuantity()));

                grossAmount = grossAmount.add(foodSubtotal);

                verifiedFoods.put(
                        food.getFoodItemId(),
                        foodFromDatabase);
            }
        }

        // 5. Lấy voucher thật và tính giảm giá tại backend
        Voucher appliedVoucher = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getVoucherId() != null) {
            appliedVoucher = voucherRepository
                    .findById(request.getVoucherId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Voucher không tồn tại"));

            BigDecimal discountValue = toVnd(
                    appliedVoucher.getDiscountValue(),
                    "Giá trị voucher");

            String discountType =
                    String.valueOf(appliedVoucher.getDiscountType());

            if ("PERCENT".equalsIgnoreCase(discountType)) {
                discountAmount = grossAmount
                        .multiply(discountValue)
                        .divide(
                                BigDecimal.valueOf(100),
                                0,
                                RoundingMode.HALF_UP);

                Object maxDiscountValue =
                        appliedVoucher.getMaxDiscount();

                if (maxDiscountValue != null) {
                    BigDecimal maxDiscount = toVnd(
                            maxDiscountValue,
                            "Giảm giá tối đa");

                    discountAmount =
                            discountAmount.min(maxDiscount);
                }
            } else {
                discountAmount = discountValue;
            }

            // Không cho giảm nhiều hơn tổng hóa đơn
            discountAmount = discountAmount.min(grossAmount);
        }

        BigDecimal finalAmount =
                grossAmount.subtract(discountAmount);

        // 6. Đối chiếu tổng tiền máy POS gửi với kết quả backend
       

        // Chỉ bắt đầu ghi database sau khi đã kiểm tra xong
        Order1 order = new Order1();
        String orderCode = "ORD-" + timestamp;

        order.setOrderCode(orderCode);
        order.setGrossAmount(grossAmount);
        order.setFinalAmount(finalAmount);
        order.setOrderStatus("COMPLETELY");
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus("SUCCESS");
        order.setShowtime(showtime);

        com.cinema.backend.entities.Account staffObj =
                new com.cinema.backend.entities.Account();

        staffObj.setAccountId(request.getStaffId());
        order.setStaff(staffObj);

        if (appliedVoucher != null) {
            order.setVoucher(appliedVoucher);
        }

        order = orderRepository.save(order);

        // 7. Ghi giao dịch bằng số tiền backend đã tính
        PaymentTransaction paymentTransaction =
                new PaymentTransaction();

        paymentTransaction.setTransactionCode("TXN_" + timestamp);
        paymentTransaction.setAmount(finalAmount);
        paymentTransaction.setPaymentStatus("SUCCESS");
        paymentTransaction.setOrder(order);

        paymentTransactionRepository.save(paymentTransaction);

        // 8. Tạo vé
        for (Seat seat : selectedSeatEntities) {
            Ticket ticket = new Ticket();

            ticket.setTicketCode(
                    "TIX-" + timestamp + "-" + seat.getSeatId());

            ticket.setQrCode("QR_" + ticket.getTicketCode());
            ticket.setTicketStatus("SOLD");
            ticket.setShowtime(showtime);
            ticket.setSeat(seat);
            ticket.setOrder(order);

            ticket = ticketRepository.save(ticket);

            OrderDetail ticketDetail = new OrderDetail();
            ticketDetail.setOrder(order);
            ticketDetail.setTicket(ticket);
            ticketDetail.setQuantity(1);

            // Nếu OrderDetail cần subtotal cho vé
            ticketDetail.setSubtotal(ticketPrice);

            orderDetailRepository.save(ticketDetail);
        }

        // 9. Lưu bắp nước bằng giá database
        if (request.getFoodItems() != null) {
            for (com.cinema.backend.dto.CheckoutRequest.FoodItemRequest food
                    : request.getFoodItems()) {

                FoodBeverage foodFromDatabase =
                        verifiedFoods.get(food.getFoodItemId());

                BigDecimal foodPrice =
                        toVnd(foodFromDatabase.getPrice(), "Giá món ăn");

                BigDecimal foodSubtotal = foodPrice.multiply(
                        BigDecimal.valueOf(food.getQuantity()));

                OrderDetail foodDetail = new OrderDetail();
                foodDetail.setOrder(order);
                foodDetail.setFoodItem(foodFromDatabase);
                foodDetail.setQuantity(food.getQuantity());

                // Không còn sử dụng food.getSubtotal() từ máy khách
                foodDetail.setSubtotal(foodSubtotal);

                orderDetailRepository.save(foodDetail);
            }
        }

        return ResponseEntity.ok(orderCode);

} catch (Exception e) {
    TransactionAspectSupport
            .currentTransactionStatus()
            .setRollbackOnly();

    return ResponseEntity
            .badRequest()
            .body(e.getMessage());
}
}

    // Dùng cho Máy POS (Staff), tab "In vé": tra cứu đơn hàng/vé thật trong DB
    // theo mã đơn (order_code, VD "ORD-...") hoặc mã vé (ticket_code, VD "TIX-...").
    // BO SUNG: staff.js đã gọi sẵn /api/pos/orders/search nhưng backend chưa có
    // endpoint này — trước đây tab này chỉ so khớp với đơn vừa bán gần nhất lưu trong
    // localStorage của trình duyệt đó (không tra được đơn cũ / đơn từ máy khác).
    @GetMapping("/orders/search")
    public ResponseEntity<?> searchOrder(@RequestParam String code) {
        String trimmedCode = code == null ? "" : code.trim();
        if (trimmedCode.isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập mã vé hoặc mã đơn hàng.");
        }

        List<Map<String, Object>> rows = ticketRepository.findTicketsByOrderOrTicketCode(trimmedCode);
        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body("Không tìm thấy vé/đơn hàng với mã: " + trimmedCode);
        }

        Map<String, Object> first = rows.get(0);
        List<String> seats = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object seatCode = row.get("seatCode");
            if (seatCode != null) seats.add(String.valueOf(seatCode));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("orderCode", first.get("orderCode"));
        result.put("ticketCode", first.get("ticketCode"));
        result.put("movie", first.get("movieTitle"));
        result.put("date", first.get("showDate"));
        result.put("showtime", first.get("showTime"));
        result.put("seats", seats);
        result.put("totalPaid", first.get("totalPaid"));
        return ResponseEntity.ok(result);
    }

    // API Kiểm tra và áp dụng mã giảm giá
    @GetMapping("/vouchers/validate")
    public ResponseEntity<?> validateVoucher(@RequestParam String code) {
        Optional<Voucher> voucherOpt = voucherRepository.findByVoucherCode(code);

        if (voucherOpt.isPresent()) {
            return ResponseEntity.ok(voucherOpt.get());
        }

        return ResponseEntity.badRequest().body("Mã giảm giá không tồn tại hoặc đã hết hạn.");
    }

    // ==========================================================
    // API 1: TẠO LINK THANH TOÁN VNPAY (Để JS vẽ thành mã QR)
    // ==========================================================
    @GetMapping("/vnpay/create-url")
    public ResponseEntity<String> createVNPayUrl(
            @RequestParam int amount,
            HttpServletRequest request) {

        String url = vnPayService.createPaymentUrl(amount, "Thanh toan ve phim LumiAI", request);
        return ResponseEntity.ok(url);
    }

    // ==========================================================
    // API 2: NHẬN KẾT QUẢ TỪ VNPAY TRẢ VỀ (vnp_ReturnUrl)
    // Trang này được mở ở TAB MỚI (do staff.js dùng window.open() thay vì
    // redirect nguyên tab POS). Vì vậy sau khi có kết quả, trang tự động
    // postMessage() về window.opener (chính là tab máy POS đang chờ) để
    // POS tự nhảy tiếp bước hoàn tất đơn — không cần nhân viên tự bấm gì
    // ngoài việc tab này tự đóng lại.
    // ==========================================================
    @GetMapping(value = "/vnpay-return", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> vnpayReturn(HttpServletRequest request) {
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    fields.put(fieldName, fieldValue);
                }
            }

            String vnp_SecureHash = request.getParameter("vnp_SecureHash");
            if (fields.containsKey("vnp_SecureHashType")) fields.remove("vnp_SecureHashType");
            if (fields.containsKey("vnp_SecureHash")) fields.remove("vnp_SecureHash");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            String signValue = com.cinema.backend.Payment.VnPayConfig.hmacSHA512(com.cinema.backend.Payment.VnPayConfig.vnp_SecretKey, hashData.toString());

            if (signValue.equals(vnp_SecureHash)) {
                if ("00".equals(request.getParameter("vnp_ResponseCode"))) {
                    return ResponseEntity.ok(buildVnpayResultPage(true,
                            "GIAO DỊCH THÀNH CÔNG!",
                            "Bạn đã thanh toán thành công. Đang quay lại máy POS..."));
                } else {
                    return ResponseEntity.badRequest().body(buildVnpayResultPage(false,
                            "GIAO DỊCH THẤT BẠI",
                            "Giao dịch đã bị hủy hoặc không thành công."));
                }
            } else {
                return ResponseEntity.badRequest().body(buildVnpayResultPage(false,
                        "LỖI BẢO MẬT",
                        "Chữ ký không hợp lệ."));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(buildVnpayResultPage(false,
                    "LỖI HỆ THỐNG",
                    "Đã có lỗi xảy ra: " + e.getMessage()));
        }
    }

    // Trang kết quả VNPAY dùng chung cho tab con: báo kết quả về tab POS (window.opener)
    // qua postMessage rồi tự đóng tab. Nếu không có window.opener (ví dụ người dùng mở
    // trực tiếp URL này) thì chỉ hiển thị kết quả, không làm gì thêm.
    private String buildVnpayResultPage(boolean success, String title, String message) {
        String color = success ? "#22c55e" : "#f87171";
        return "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\">"
                + "<title>Kết quả thanh toán VNPAY</title>"
                + "<style>body{font-family:Arial,sans-serif;background:#0e0e11;color:#fff;"
                + "display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}"
                + ".box{padding:32px}h1{color:" + color + ";margin:0 0 10px}p{color:#9a9aa3;font-size:14px}</style>"
                + "</head><body><div class=\"box\"><h1>" + title + "</h1><p>" + message + "</p></div>"
                + "<script>"
                + "try{if(window.opener&&!window.opener.closed){"
                + "window.opener.postMessage({type:'VNPAY_POS_RESULT',success:" + success + "},'*');"
                + "window.opener.focus();}}catch(e){}"
                + "setTimeout(function(){window.close();},1200);"
                + "</script>"
                + "</body></html>";
    }
}