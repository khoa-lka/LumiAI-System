package com.cinema.backend.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.cinema.backend.entities.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    
    // 1. Dùng cho Voucher nhập tay (MANUAL): Tìm theo mã code
    Optional<Voucher> findByVoucherCode(String voucherCode);
    
    // 2. Dùng cho Voucher tự động (AUTO): Tìm các chương trình giảm giá tự động đang kích hoạt
    @Query("SELECT v FROM Voucher v WHERE v.applyType = 'AUTO' AND v.status = 'ACTIVE'")
    List<Voucher> findActiveAutoVouchers();
}