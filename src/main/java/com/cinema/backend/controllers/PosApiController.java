package com.cinema.backend.controllers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
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
import org.springframework.http.HttpStatus;

import com.cinema.backend.entities.WebhookLog;
import com.cinema.backend.repositories.WebhookLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal; // Import thêm BigDecimal
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
    @Autowired
private WebhookLogRepository webhookLogRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;
@GetMapping("/webhooks")
    public ResponseEntity<List<WebhookLog>> getAllWebhooks() {
        // Sử dụng hàm bạn vừa tạo để trả về danh sách Webhook mới nhất lên đầu
        return ResponseEntity.ok(webhookLogRepository.findAllByOrderByIdDesc());
    }
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

    @Transactional
    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutOrder(@RequestBody com.cinema.backend.dto.CheckoutRequest request) {
        try {
            long timestamp = System.currentTimeMillis();

            // 1. TẠO HÓA ĐƠN (Bảng order1)
            Order1 order = new Order1();
            String orderCode = "ORD-" + timestamp;
            order.setOrderCode(orderCode);
            order.setCreatedDate(java.time.LocalDateTime.now());
            order.setFinalAmount(java.math.BigDecimal.valueOf(request.getTotalAmount()));
            order.setGrossAmount(java.math.BigDecimal.valueOf(request.getTotalAmount()));

            order.setOrderStatus("COMPLETELY");
            order.setPaymentMethod(request.getPaymentMethod());
            order.setPaymentStatus("SUCCESS");

            com.cinema.backend.entities.Account staffObj = new com.cinema.backend.entities.Account();
            staffObj.setAccountId(request.getStaffId());
            order.setStaff(staffObj);

            if (request.getVoucherId() != null) {
                com.cinema.backend.entities.Voucher voucherObj = new com.cinema.backend.entities.Voucher();
                voucherObj.setVoucherId(request.getVoucherId());
                order.setVoucher(voucherObj);
            }

            order = orderRepository.save(order);

            // 2. GHI NHẬN GIAO DỊCH (Bảng paymenttransaction)
            PaymentTransaction pt = new PaymentTransaction();
            pt.setTransactionCode("TXN_" + timestamp);
            pt.setAmount(java.math.BigDecimal.valueOf(request.getTotalAmount()));
            pt.setPaymentStatus("SUCCESS");
            pt.setOrder(order);
            paymentTransactionRepository.save(pt);

Showtime showtime = showtimeRepository
                    .findById(request.getShowtimeId())
                    .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy suất chiếu")
                    );

            // 3. TẠO VÉ & CHI TIẾT ĐƠN HÀNG
            List<Seat> allSeats = seatRepository.findSeatsByShowtimeId(request.getShowtimeId());
            for (String seatCode : request.getSeats()) {
                Seat seat = allSeats.stream()
                        .filter(s -> (s.getSeatRow() + s.getSeatNumber()).equals(seatCode))
                        .findFirst().orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy ghế " + seatCode));

                Ticket ticket = new Ticket();
                ticket.setTicketCode("TIX-" + timestamp + "-" + seat.getSeatId());
                ticket.setQrCode("QR_" + ticket.getTicketCode());
                ticket.setTicketStatus("SOLD");
 

                ticket.setShowtime(showtime);
                ticket.setSeat(seat);
                ticket = ticketRepository.save(ticket);

                OrderDetail ticketDetail = new OrderDetail();
                ticketDetail.setOrder(order);
                ticketDetail.setTicket(ticket);
                ticketDetail.setQuantity(1);
                orderDetailRepository.save(ticketDetail);
            }

            // 4. LƯU BẮP NƯỚC (Bảng orderdetail)
            if (request.getFoodItems() != null) {
                for (com.cinema.backend.dto.CheckoutRequest.FoodItemRequest food : request.getFoodItems()) {
                    OrderDetail foodDetail = new OrderDetail();
                    foodDetail.setOrder(order);

                    FoodBeverage fbObj = new FoodBeverage();
                    fbObj.setFoodItemId(food.getFoodItemId());
                    foodDetail.setFoodItem(fbObj);

                    foodDetail.setQuantity(food.getQuantity());
                    foodDetail.setSubtotal(java.math.BigDecimal.valueOf(food.getSubtotal()));
                    orderDetailRepository.save(foodDetail);
                }
            }

            return ResponseEntity.ok(orderCode);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
    // ==========================================================
    @GetMapping("/vnpay-return")
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
                    return ResponseEntity.ok("<h1>GIAO DỊCH THÀNH CÔNG!</h1><p>Bạn đã thanh toán thành công, vui lòng nhận vé tại quầy.</p>");
                } else {
                    return ResponseEntity.badRequest().body("<h1>GIAO DỊCH THẤT BẠI</h1><p>Giao dịch đã bị hủy hoặc không thành công.</p>");
                }
            } else {
                return ResponseEntity.badRequest().body("<h1>LỖI BẢO MẬT</h1><p>Chữ ký không hợp lệ.</p>");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
    private void saveWebhookLog(String endpoint, int code, String status, long responseMs, Object payloadObj) {
    try {
        WebhookLog log = new WebhookLog();
        log.setEndpoint(endpoint);
        log.setCode(code);
        log.setStatus(status);
        log.setResponseMs(responseMs);
        log.setTime(java.time.LocalDateTime.now());

        // Chuyển Object thành chuỗi JSON
        String payload = objectMapper.writeValueAsString(payloadObj);
        log.setPayload(payload);
        
        // Tính dung lượng KB của Payload và chuyển sang BigDecimal
        double sizeInKb = payload.getBytes(StandardCharsets.UTF_8).length / 1024.0;
        log.setSizeKb(BigDecimal.valueOf(sizeInKb));

        webhookLogRepository.save(log);
    } catch (Exception e) {
        System.err.println("Lỗi lưu Webhook: " + e.getMessage());
    }
}

    @GetMapping("/orders/search")
public ResponseEntity<?> searchOrderByCode(
        @RequestParam("code") String code
) {
    if (code == null ||
            code.isBlank()) {

        return ResponseEntity
                .badRequest()
                .body(
                        "Vui lòng nhập mã đơn hàng."
                );
    }

    String normalizedCode =
            code.trim();

    String sql = """
            SELECT
                o.order_code AS "orderCode",

                STRING_AGG(
                    CAST(
                        t.ticket_code
                        AS TEXT
                    ),
                    ', '
                ) AS "ticketCode",

                MAX(m.title) AS "movie",

                MAX(r.room_name) AS "roomName",

                TO_CHAR(
                    MAX(st.start_time),
                    'HH24:MI'
                ) AS "showtime",

                TO_CHAR(
                    MAX(st.start_time),
                    'YYYY-MM-DD'
                ) AS "date",

                STRING_AGG(
                    CAST(
                        CONCAT(
                            s.seat_row,
                            s.seat_number
                        )
                        AS TEXT
                    ),
                    ', '
                ) AS "seatsCsv",

                MAX(o.final_amount)
                    AS "totalMoney",

                MAX(o.payment_method)
                    AS "paymentMethod",

                MAX(o.payment_status)
                    AS "paymentStatus"

            FROM order1 o

            LEFT JOIN orderdetail od
                ON od.order_id =
                   o.order_id

            LEFT JOIN ticket t
                ON t.ticket_id =
                   od.ticket_id

            LEFT JOIN seat s
                ON s.seat_id =
                   t.seat_id

            LEFT JOIN showtime st
                ON st.showtime_id =
                   t.showtime_id

            LEFT JOIN movie m
                ON m.movie_id =
                   st.movie_id

            LEFT JOIN room r
                ON r.room_id =
                   st.room_id

            WHERE UPPER(
                LTRIM(
                    RTRIM(o.order_code)
                )
            ) = UPPER(
                LTRIM(
                    RTRIM(?)
                )
            )

            GROUP BY
                o.order_code
            """;

    List<Map<String, Object>> rows =
            jdbcTemplate.queryForList(
                    sql,
                    normalizedCode
            );

    if (rows.isEmpty()) {
        return ResponseEntity
                .status(
                        HttpStatus.NOT_FOUND
                )
                .body(
                        "Không tìm thấy đơn hàng: "
                                + normalizedCode
                );
    }

    Map<String, Object> row =
            rows.get(0);

    String seatsCsv =
            row.get("seatsCsv") == null
                    ? ""
                    : row.get("seatsCsv")
                            .toString();

    List<String> seats =
            new ArrayList<>();

    if (!seatsCsv.isBlank()) {
        for (String seat :
                seatsCsv.split(",")) {

            String normalizedSeat =
                    seat.trim();

            if (!normalizedSeat.isBlank()) {
                seats.add(
                        normalizedSeat
                );
            }
        }
    }

    Map<String, Object> result =
            new LinkedHashMap<>();

    result.put(
            "orderCode",
            row.get("orderCode")
    );

    result.put(
            "ticketCode",
            row.get("ticketCode")
    );

    result.put(
            "movie",
            row.get("movie")
    );

    result.put(
            "roomName",
            row.get("roomName")
    );

    result.put(
            "showtime",
            row.get("showtime")
    );

    result.put(
            "date",
            row.get("date")
    );

    result.put(
            "seats",
            seats
    );

    result.put(
            "totalMoney",
            row.get("totalMoney")
    );

    result.put(
            "paymentMethod",
            row.get("paymentMethod")
    );

    result.put(
            "paymentStatus",
            row.get("paymentStatus")
    );

    return ResponseEntity.ok(
            result
    );
}
}