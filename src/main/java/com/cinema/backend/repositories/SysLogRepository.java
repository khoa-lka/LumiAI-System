package com.cinema.backend.repositories;

import com.cinema.backend.entities.SysLogDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SysLogRepository extends JpaRepository<SysLogDTO, Long> {
    // JpaRepository sẽ tự động cung cấp hàm findAll() để lấy toàn bộ log ra
}