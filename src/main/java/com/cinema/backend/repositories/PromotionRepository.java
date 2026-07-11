package com.cinema.backend.repositories;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinema.backend.entities.Promotion;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    // JpaRepository cung cấp sẵn các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()...

    // 1. Dùng cho Manager: Lấy danh sách lọc theo trạng thái (ACTIVE/INACTIVE)
    List<Promotion> findByStatus(String status);

    // 2. Dùng cho Customer (Trang chủ): Chỉ lấy các sự kiện ACTIVE và đang trong thời gian diễn ra
    @Query("SELECT p FROM Promotion p WHERE p.status = 'ACTIVE' " +
           "AND :currentDate BETWEEN p.startDate AND p.endDate")
    List<Promotion> findActivePromotions(@Param("currentDate") LocalDate currentDate);
}
