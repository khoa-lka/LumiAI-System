package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.entities.Feedback;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.repositories.FeedbackRepository;
import com.cinema.backend.repositories.OrderRepository;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin("*")
public class FeedbackController {

    @Autowired
    private FeedbackRepository repo;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/submit")
    public Map<String, Object> submit(@RequestBody FeedbackRequest req) {

        Optional<Order1> orderOpt = orderRepository.findById(req.getOrderId());

        if (orderOpt.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Không tìm thấy đơn hàng!"
            );
        }

        Order1 order = orderOpt.get();

        if (order.getCustomer() == null ||
                !order.getCustomer().getAccountId().equals(req.getAccountStaffId())) {
            return Map.of(
                    "success", false,
                    "message", "Bạn không có quyền feedback đơn hàng này!"
            );
        }

        boolean hasUsedTicket =
                "Đã sử dụng".equalsIgnoreCase(req.getTicketStatus());

        if (!hasUsedTicket) {
            return Map.of(
                    "success", false,
                    "message", "Chỉ vé đã sử dụng mới được gửi feedback!"
            );
        }

        Feedback fb = new Feedback();
        fb.setTitle(req.getTitle());
        fb.setContent(req.getContent());
        fb.setRatingStars(req.getRatingStars());
        fb.setMovieId(req.getMovieId());
        fb.setAccountStaffId(req.getAccountStaffId());
        fb.setCreatedAt(LocalDateTime.now());

        repo.save(fb);

        return Map.of(
                "success", true,
                "message", "Gửi feedback thành công!"
        );
    }

    @GetMapping("/movie/{movieId}")
    public List<Map<String, Object>> getByMovie(@PathVariable Integer movieId) {

        List<Object[]> rows = repo.getFeedbackWithUser(movieId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] r : rows) {
            Map<String, Object> item = new HashMap<>();

            item.put("feedbackId", r[0]);
            item.put("title", r[1]);
            item.put("content", r[2]);
            item.put("ratingStars", r[3]);
            item.put("movieId", r[4]);
            item.put("accountStaffId", r[5]);
            item.put("createdAt", r[6]);
            item.put("accountName", r[7]);

            result.add(item);
        }

        return result;
    }

    public static class FeedbackRequest {

        private String title;
        private String content;
        private Integer ratingStars;
        private Integer movieId;
        private Integer accountStaffId;
        private Integer orderId;
        private String ticketStatus;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public Integer getRatingStars() {
            return ratingStars;
        }

        public void setRatingStars(Integer ratingStars) {
            this.ratingStars = ratingStars;
        }

        public Integer getMovieId() {
            return movieId;
        }

        public void setMovieId(Integer movieId) {
            this.movieId = movieId;
        }

        public Integer getAccountStaffId() {
            return accountStaffId;
        }

        public void setAccountStaffId(Integer accountStaffId) {
            this.accountStaffId = accountStaffId;
        }

        public Integer getOrderId() {
            return orderId;
        }

        public void setOrderId(Integer orderId) {
            this.orderId = orderId;
        }

        public String getTicketStatus() {
            return ticketStatus;
        }

        public void setTicketStatus(String ticketStatus) {
            this.ticketStatus = ticketStatus;
        }
    }
}