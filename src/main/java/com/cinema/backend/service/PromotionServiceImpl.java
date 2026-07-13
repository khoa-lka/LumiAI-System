package com.cinema.backend.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.cinema.backend.entities.Promotion;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.PromotionRepository;
import com.cinema.backend.repositories.VoucherRepository;

@Service
public class PromotionServiceImpl implements PromotionService {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private VoucherRepository voucherRepository;
    
    // 🌟 THÊM MỚI: Bộ quét ngầm tự động chạy vào lúc 00:00:00 mỗi đêm
    // Thần chú Cron: Giây(0) Phút(0) Giờ(0) Ngày(*) Tháng(*) Thứ(?)
    @Scheduled(cron = "0 0 0 * * ?")
    public void scanAndDisableExpiredPromotions() {
        LocalDate today = LocalDate.now();
        int updatedCount = promotionRepository.autoUpdateExpiredPromotions(today);
        System.out.println("⏰ [LumiAI System] Đã tự động quét và chuyển trạng thái ẩn " 
                            + updatedCount + " chương trình ưu đãi hết hạn ngày " + today);
    }

    // 1. Dùng cho Tab Quản lý của Manager: Lấy tất cả không bộ lọc
    @Override
    public List<Promotion> getAllPromotionsForManager() {
        return promotionRepository.findAll();
    }

    // 2. Dùng cho Trang chủ của Customer: Chỉ lấy sự kiện ACTIVE và còn thời hạn
    @Override
    public List<Promotion> getActivePromotionsForCustomer() {
        return promotionRepository.findActivePromotions(LocalDate.now());
    }

    // 3. Xử lý tạo mới Sự kiện kèm mối kết nối liên kết sang Voucher
    @Override
    public Promotion createPromotion(Promotion promotion, Integer voucherId) {
        if (voucherId != null) {
            Voucher voucher = voucherRepository.findById(voucherId)
                    .orElseThrow(() -> new RuntimeException("Voucher liên kết không tồn tại với ID: " + voucherId));
            promotion.setVoucher(voucher); // Gắn thực thể voucher vào khóa ngoại
        }
        if (promotion.getStatus() == null) {
            promotion.setStatus("ACTIVE");
        }
        return promotionRepository.save(promotion);
    }

    // 4. Xử lý cập nhật thông tin bài đăng Sự kiện
    @Override
    public Promotion updatePromotion(Long id, Promotion promotionDetails, Integer voucherId) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sự kiện không tồn tại với id: " + id));
        
        promotion.setTitle(promotionDetails.getTitle());
        promotion.setImageUrl(promotionDetails.getImageUrl());
        promotion.setContent(promotionDetails.getContent());
        promotion.setStartDate(promotionDetails.getStartDate());
        promotion.setEndDate(promotionDetails.getEndDate());
        promotion.setStatus(promotionDetails.getStatus());

        // Cập nhật lại mối liên kết mã Voucher nếu Manager thay đổi trên Dropdown
        if (voucherId != null) {
            Voucher voucher = voucherRepository.findById(voucherId)
                    .orElseThrow(() -> new RuntimeException("Voucher thay đổi không tồn tại với ID: " + voucherId));
            promotion.setVoucher(voucher);
        } else {
            promotion.setVoucher(null); // Gỡ voucher nếu Manager chọn sự kiện thuần túy không kèm mã
        }

        return promotionRepository.save(promotion);
    }

    // 5. Gỡ bỏ sự kiện truyền thông
    @Override
    public void deletePromotion(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sự kiện không tồn tại với id: " + id));
        promotionRepository.delete(promotion);
    }
}