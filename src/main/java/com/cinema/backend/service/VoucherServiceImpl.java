package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;

import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    // 🌟 RÀNG BUỘC MỚI: Chỉ voucher ở trạng thái ACTIVE mới được sử dụng
    // (nếu voucher cũ chưa từng được set status, coi như hợp lệ để không phá dữ liệu cũ)
    if (voucher.getStatus() != null && !"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
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
            if ("DAY_OF_WEEK".equals(voucher.getConditionType()) && voucher.getConditionValue() != null) {
                int targetDay = Integer.parseInt(voucher.getConditionValue()); // Ví dụ: "3" cho thứ 4
                int currentDay = now.getDayOfWeek().getValue(); // Thứ 2 = 1, Thứ 3 = 2, Thứ 4 = 3...

                if (currentDay == targetDay) {
                    return voucher;
                }
            } else if ("LAST_DAY_OF_MONTH".equals(voucher.getConditionType())) {
                int today = now.getDayOfMonth();
                int lastDayOfThisMonth = now.toLocalDate().lengthOfMonth();

                if (today == lastDayOfThisMonth) {
                    return voucher;
                }
            }
        }
        return null;
    }


// ...

@Override
@Transactional // Bắt buộc phải có khi chạy @Modifying query
public boolean useVoucher(String code){
    System.out.println("useVoucher chạy");

    // Vẫn gọi checkVoucher để tái kiểm tra ngày hết hạn, status ACTIVE...[cite: 2]
    Voucher voucher = checkVoucher(code);

    if(voucher == null){
        System.out.println("voucher null hoặc không đủ điều kiện");
        return false;
    }

    // XÓA ĐOẠN SET LẠI USAGE LIMIT VÀ SAVE:
    // voucher.setUsageLimit(voucher.getUsageLimit()-1);
    // voucherRepository.save(voucher);

    // THAY BẰNG: Trừ trực tiếp dưới Database một cách an toàn
    int updatedRows = voucherRepository.decrementVoucherUsage(code);

    if (updatedRows == 0) {
        // Trường hợp cả 2 request cùng lọt qua hàm checkVoucher() thành công, 
        // request nào chạy update DB sau sẽ nhận về updatedRows = 0 vì limit đã chạm 0.
        System.out.println("Voucher vừa bị người khác sử dụng hết lượt cuối cùng.");
        return false;
    }

    System.out.println("Đã trừ lượt sử dụng voucher thành công.");
    return true;
}
    @Override
    public java.util.List<Voucher> getAllVouchers() {
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
        voucher.setUpdatedBy(voucherDetails.getUpdatedBy());

        // 🌟 Đồng bộ cập nhật các trường mới cấu hình thuật toán từ Form
        voucher.setStatus(voucherDetails.getStatus());
        voucher.setApplyType(voucherDetails.getApplyType());
        voucher.setConditionType(voucherDetails.getConditionType());
        voucher.setConditionValue(voucherDetails.getConditionValue());
        
        return voucherRepository.save(voucher);
    }

    @Override
    public void deleteVoucher(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại with id: " + id));
        voucherRepository.delete(voucher);
    }
}
