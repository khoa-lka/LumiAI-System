package com.cinema.backend.controllers;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.cinema.backend.entities.Promotion;
import com.cinema.backend.repositories.PromotionRepository;

@RestController
@RequestMapping("/api/promos")
@CrossOrigin(origins = "*")
public class PromotionController {
    
    @Autowired
    private PromotionRepository promotionRepository;

    // 🌟 API CHO CUSTOMER: Chỉ lấy các sự kiện đang ACTIVE và trong thời hạn hiển thị ngoài trang chủ (home.js)
    @GetMapping
    public List<Promotion> getAllActivePromotions() {
        return promotionRepository.findActivePromotions(LocalDate.now());
    }

    // 🚀 API CHO MANAGER 1: Lấy toàn bộ danh sách ưu đãi (Kể cả INACTIVE) để quản lý
    @GetMapping("/manager/all")
    public ResponseEntity<?> getAllPromotionsForManager() {
        return ResponseEntity.ok(promotionRepository.findAll());
    }

    // 🚀 API CHO MANAGER 2: Thêm mới Sự kiện ưu đãi
    @PostMapping("/manager/add")
    public ResponseEntity<?> createPromotion(@RequestBody Promotion promotion) {
        try {
            if (promotion.getStatus() == null) {
                promotion.setStatus("ACTIVE"); // Mặc định khi tạo mới là hoạt động
            }
            Promotion newPromo = promotionRepository.save(promotion);
            return ResponseEntity.ok(newPromo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo sự kiện: " + e.getMessage());
        }
    }

    // 🚀 API CHO MANAGER 3: Cập nhật Sự kiện (Đổi nội dung hoặc bật/tắt Đang - Ngừng)
    @PutMapping("/manager/update/{id}")
    public ResponseEntity<?> updatePromotion(@PathVariable Long id, @RequestBody Promotion promoDetails) {
        return promotionRepository.findById(id).map(promo -> {
            promo.setTitle(promoDetails.getTitle());
            promo.setStartDate(promoDetails.getStartDate());
            promo.setEndDate(promoDetails.getEndDate());
            promo.setImageUrl(promoDetails.getImageUrl());
            promo.setContent(promoDetails.getContent());
            promo.setPromoCode(promoDetails.getPromoCode());
            promo.setStatus(promoDetails.getStatus()); // Lưu trạng thái ACTIVE/INACTIVE mới
            return ResponseEntity.ok(promotionRepository.save(promo));
        }).orElse(ResponseEntity.notFound().build());
    }
}