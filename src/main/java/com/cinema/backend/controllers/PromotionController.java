package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.entities.Promotion;
import com.cinema.backend.service.PromotionService;

@RestController
@RequestMapping("/api/promos")
@CrossOrigin(origins = "*")
public class PromotionController {
    @Autowired
    private PromotionService promotionService;

    // 🌟 ĐÃ SỬA: API cho Customer — chỉ lấy các sự kiện ACTIVE và còn hạn hiển thị ở trang chủ
    // (Giữ nguyên đường dẫn gốc /api/promos để không phá FE hiện có đang gọi endpoint này)
    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionService.getActivePromotionsForCustomer();
    }

    // 🚀 API 1 CHO MANAGER: Lấy toàn bộ danh sách sự kiện (kể cả sự kiện đã tắt)
    @GetMapping("/manager/all")
    public ResponseEntity<?> getAllPromotionsForManager() {
        return ResponseEntity.ok(promotionService.getAllPromotionsForManager());
    }

    // 🚀 API 2 CHO MANAGER: Thêm mới sự kiện và liên kết ID Voucher được chọn
    @PostMapping("/manager/add")
    public ResponseEntity<?> createPromotion(
            @RequestBody Promotion promotion,
            @RequestParam(value = "voucherId", required = false) Integer voucherId) {
        try {
            Promotion newPromo = promotionService.createPromotion(promotion, voucherId);
            return ResponseEntity.ok(newPromo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo sự kiện: " + e.getMessage());
        }
    }

    // 🚀 API 3 CHO MANAGER: Chỉnh sửa nội dung sự kiện hoặc đổi liên kết Voucher
    @PutMapping("/manager/update/{id}")
    public ResponseEntity<?> updatePromotion(
            @PathVariable Long id,
            @RequestBody Promotion promoDetails,
            @RequestParam(value = "voucherId", required = false) Integer voucherId) {
        try {
            Promotion updatedPromo = promotionService.updatePromotion(id, promoDetails, voucherId);
            return ResponseEntity.ok(updatedPromo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật sự kiện: " + e.getMessage());
        }
    }

    // 🚀 API 4 CHO MANAGER: Xóa bỏ sự kiện truyền thông
    @DeleteMapping("/manager/delete/{id}")
    public ResponseEntity<?> deletePromotion(@PathVariable Long id) {
        try {
            promotionService.deletePromotion(id);
            return ResponseEntity.ok("Xóa sự kiện thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa sự kiện: " + e.getMessage());
        }
    }
}
