package com.cinema.backend.controllers;

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

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutOrder(@RequestBody com.cinema.backend.dto.CheckoutRequest request) {
        try {
            long timestamp = System.currentTimeMillis();

            // 1. TẠO HÓA ĐƠN (Bảng order1)
            Order1 order = new Order1();
            String orderCode = "ORD-" + timestamp;
            order.setOrderCode(orderCode);

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
}