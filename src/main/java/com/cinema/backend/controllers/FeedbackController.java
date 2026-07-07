package com.cinema.backend.controllers;

import com.cinema.backend.entities.Feedback;
import com.cinema.backend.repositories.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin("*") // Cho phép Frontend (HTML/JS) gọi API mà không bị chặn lỗi CORS
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    // 🚀 API 1: Lưu đánh giá mới vào Database (Javascript gọi POST vào đây)
    @PostMapping("/submit")
    public Map<String, Object> submitFeedback(@RequestBody Feedback feedback) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Lưu dữ liệu vào SQL Server
            feedbackRepository.save(feedback);
            response.put("success", true);
            response.put("message", "Cảm ơn bạn đã đánh giá!");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
        }
        return response;
    }

    // 🚀 API 2: Lấy toàn bộ danh sách đánh giá từ Database lên (Javascript gọi GET vào đây)
    @GetMapping("/all")
    public List<Feedback> getAllFeedback() {
        // Tự động quét bảng feedback trong SQL và trả về danh sách JSON
        return feedbackRepository.findAll();
    }
}