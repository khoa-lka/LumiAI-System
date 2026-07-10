package com.cinema.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.Banner;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    // JpaRepository cung cấp sẵn các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()...
    // Bạn có thể thêm các phương thức tùy chỉnh nếu cần, ví dụ:
    // List<Banner> findByMovieId(Long movieId);
    List<Banner> findByActiveTrueOrderByPositionOrderAsc();
}