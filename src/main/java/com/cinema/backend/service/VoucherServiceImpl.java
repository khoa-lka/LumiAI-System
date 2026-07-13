package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.VoucherRepository;
import org.springframework.stereotype.Service;

@Service
public class VoucherServiceImpl implements VoucherService {

    @Autowired
    private VoucherRepository voucherRepository;

    // 🌟 THÊM MỚI: Bộ quét ngầm tự động chạy vào lúc 00:00:00 mỗi đêm
    @Scheduled(cron = "0 0 0 * * ?")
    public void scanAndDisableExpiredVouchers() {
        LocalDateTime now = LocalDateTime.now();
        int updatedCount = voucherRepository.autoUpdateExpiredVouchers(now);
        System.out.println("⏰ [LumiAI System] Đã tự động quét và chuyển trạng thái ẩn " 
                            + updatedCount + " mã Voucher hết hiệu lực lúc: " + now);
    }

    @Override
    public Voucher checkVoucher(String code) {
        Optional<Voucher> optionalVoucher = voucherRepository.findByVoucherCode(code);

        if (optionalVoucher.isEmpty()) {
            return null;
        }

        Voucher voucher = optionalVoucher.get();

        // 🌟 RÀNG BUỘC 1: Chỉ voucher ở trạng thái ACTIVE mới được sử dụng
        if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
            return null;
        }

        if (voucher.getUsageLimit() <= 0) {
            return null;
        }

        if (voucher.getExpiredDate() != null && voucher.getExpiredDate().isBefore(LocalDateTime.now())) {
            return null;
        }

        return voucher;
    }

    // 🌟 HÀM MỚI BỔ SUNG: Xử lý quét các khuyến mãi tự động chạy ngầm hệ thống
    @Override
    public Voucher checkAutoVoucher(Double grossAmount) {
        List<Voucher> autoVouchers = voucherRepository.findActiveAutoVouchers();
        LocalDateTime now = LocalDateTime.now();

        for (Voucher voucher : autoVouchers) {
            if (voucher.getExpiredDate() != null && voucher.getExpiredDate().isBefore(now)) {
                continue;
            }

            if (voucher.getUsageLimit() <= 0) {
                continue;
            }

            if (voucher.getMinimumOrder() != null && grossAmount < voucher.getMinimumOrder()) {
                continue;
            }

            // --- KIỂM TRA ĐIỀU KIỆN THỜI GIAN ĐỘNG ---
            // 1. Nhánh điều kiện Thứ trong tuần
            if ("DAY_OF_WEEK".equals(voucher.getConditionType()) && voucher.getConditionValue() != null) {
                int targetDay = Integer.parseInt(voucher.getConditionValue()); // Ví dụ: "3" cho thứ 4
                int currentDay = now.getDayOfWeek().getValue(); // Thứ 2 = 1, Thứ 3 = 2, Thứ 4 = 3...
                
                if (currentDay == targetDay) {
                    return voucher;
                }
            }

            // 2. Nhánh điều kiện Ngày cuối tháng
            else if ("LAST_DAY_OF_MONTH".equals(voucher.getConditionType())) {
                int today = now.getDayOfMonth();
                int lastDayOfThisMonth = now.toLocalDate().lengthOfMonth();
                
                if (today == lastDayOfThisMonth) {
                    return voucher;
                }
            }
        }
        return null;
    }

    @Override
    public boolean useVoucher(String code) {
        System.out.println("useVoucher chạy");
        Voucher voucher = checkVoucher(code);

        if (voucher == null) {
            System.out.println("voucher null");
            return false;
        }

        System.out.println("Before = " + voucher.getUsageLimit());
        voucher.setUsageLimit(voucher.getUsageLimit() - 1);
        voucherRepository.save(voucher);
        System.out.println("After = " + voucher.getUsageLimit());

        return true;
    }

    @Override
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    @Override
    public Voucher createVoucher(Voucher voucher) {
        // Thiết lập giá trị mặc định nếu Manager không truyền lên từ UI
        if (voucher.getStatus() == null) voucher.setStatus("ACTIVE");
        if (voucher.getApplyType() == null) voucher.setApplyType("MANUAL");
        return voucherRepository.save(voucher);
    }

    @Override
    public Voucher updateVoucher(Integer id, Voucher voucherDetails) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại với id: " + id));
        
        voucher.setVoucherCode(voucherDetails.getVoucherCode());
        voucher.setDiscountValue(voucherDetails.getDiscountValue());
        voucher.setDiscountType(voucherDetails.getDiscountType());
        voucher.setMaxDiscount(voucherDetails.getMaxDiscount());
        voucher.setMinimumOrder(voucherDetails.getMinimumOrder());
        voucher.setUsageLimit(voucherDetails.getUsageLimit());
        voucher.setExpiredDate(voucherDetails.getExpiredDate());
        
        // 🌟 Đồng bộ cập nhật các trường mới cấu hình thuật toán từ Form
        voucher.setStatus(voucherDetails.getStatus());
        voucher.setApplyType(voucherDetails.getApplyType());
        voucher.setConditionType(voucherDetails.getConditionType());
        voucher.setConditionValue(voucherDetails.getConditionValue());
        
        voucher.setUpdatedBy(voucherDetails.getUpdatedBy());
        
        return voucherRepository.save(voucher);
    }

    @Override
    public void deleteVoucher(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại với id: " + id));
        voucherRepository.delete(voucher);
    }
}