package com.cinema.backend.repositories;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import com.cinema.backend.entities.Promotion;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    
    // 1. Dùng cho Manager: Tìm kiếm danh sách sự kiện theo trạng thái (ACTIVE/INACTIVE)
    List<Promotion> findByStatus(String status);

    // 2. Dùng cho Customer (Trang chủ): Chỉ lấy Promotion đang ACTIVE, trong thời hạn 
    // và nạp sẵn thực thể Voucher đi kèm (tránh lỗi LazyInitializationException ngoài Front-End)
    @Query("SELECT DISTINCT p FROM Promotion p LEFT JOIN FETCH p.voucher " +
           "WHERE p.status = 'ACTIVE' AND :currentDate BETWEEN p.startDate AND p.endDate")
    List<Promotion> findActivePromotions(@Param("currentDate") LocalDate currentDate);
    // 🌟 THÊM MỚI: Câu lệnh update ngầm ép các sự kiện hết hạn về trạng thái dừng hoạt động
    @Modifying
    @Transactional
    @Query("UPDATE Promotion p SET p.status = 'INACTIVE' WHERE p.endDate < :currentDate AND p.status = 'ACTIVE'")
    int autoUpdateExpiredPromotions(@Param("currentDate") LocalDate currentDate);
}