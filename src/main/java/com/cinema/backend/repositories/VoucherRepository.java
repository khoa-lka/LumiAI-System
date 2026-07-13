package com.cinema.backend.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import com.cinema.backend.entities.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    
    // 1. Dùng cho luồng Khách nhập tay / Hệ thống kiểm tra: Tìm theo chuỗi mã Code
    Optional<Voucher> findByVoucherCode(String voucherCode);
    
    // 2. Bọc lót tính năng Auto: Quét nhanh các cấu hình giảm giá tự động đang ACTIVE hệ thống
    @Query("SELECT v FROM Voucher v WHERE v.applyType = 'AUTO' AND v.status = 'ACTIVE'")
    List<Voucher> findActiveAutoVouchers();

    // 🌟 THÊM MỚI: Câu lệnh tự động vô hiệu hóa Voucher quá hạn
    @Modifying
    @Transactional
    @Query("UPDATE Voucher v SET v.status = 'INACTIVE' WHERE v.expiredDate < :now AND v.status = 'ACTIVE'")
    int autoUpdateExpiredVouchers(@Param("now") LocalDateTime now);
}