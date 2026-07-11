package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.VoucherRepository;
import org.springframework.stereotype.Service;

@Service
public class VoucherServiceImpl implements VoucherService {

    @Autowired
    private VoucherRepository voucherRepository;

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

    // 🌟 HÀM MỚI BỔ SUNG: Logic xử lý tự động quét khuyến mãi hệ thống
    @Override
    public Voucher checkAutoVoucher(Double grossAmount) {
        // Lấy tất cả voucher cấu hình tự động áp dụng (apply_type = 'AUTO' và status = 'ACTIVE')
        List<Voucher> autoVouchers = voucherRepository.findActiveAutoVouchers();
        LocalDateTime now = LocalDateTime.now();

        for (Voucher voucher : autoVouchers) {
            // Kiểm tra hạn sử dụng nếu có cấu hình
            if (voucher.getExpiredDate() != null && voucher.getExpiredDate().isBefore(now)) {
                continue;
            }

            // Kiểm tra số lượng lượt dùng còn lại
            if (voucher.getUsageLimit() <= 0) {
                continue;
            }

            // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
            if (voucher.getMinimumOrder() != null && grossAmount < voucher.getMinimumOrder()) {
                continue;
            }

            // --- KIỂM TRA ĐIỀU KIỆN THỜI GIAN ---
            
            // 1. Nhánh điều kiện Thứ 4 vui vẻ
            if ("DAY_OF_WEEK".equals(voucher.getConditionType())) {
                int targetDay = Integer.parseInt(voucher.getConditionValue()); // Ví dụ lưu: "3"
                int currentDay = now.getDayOfWeek().getValue(); // Thứ 2 = 1, Thứ 3 = 2, Thứ 4 = 3...
                
                if (currentDay == targetDay) {
                    return voucher; // Trả về ngay voucher hợp lệ đầu tiên tìm thấy
                }
            }

            // 2. Nhánh điều kiện Ngày cuối tháng rực rỡ
            else if ("LAST_DAY_OF_MONTH".equals(voucher.getConditionType())) {
                int today = now.getDayOfMonth();
                int lastDayOfThisMonth = now.toLocalDate().lengthOfMonth(); // Tự tính ngày cuối cùng của tháng đó
                
                if (today == lastDayOfThisMonth) {
                    return voucher;
                }
            }
        }
        return null; // Không có chương trình tự động nào khớp hôm nay
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
        // Thiết lập các giá trị mặc định khi tạo mới nếu Manager không truyền lên
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
        
        // 🌟 Cập nhật các trường mới phục vụ quản lý
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