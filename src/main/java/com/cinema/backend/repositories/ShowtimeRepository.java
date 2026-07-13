package com.cinema.backend.repositories;

import com.cinema.backend.entities.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Integer> {

    // 1. Dùng cho Manager: Lấy tất cả mọi suất chiếu (kể cả HIDDEN/INACTIVE) để xếp lịch[cite: 16]
    @Query("SELECT s FROM Showtime s WHERE s.movie.movieId = :movieId " +
           "AND s.startTime >= :startOfDay AND s.startTime <= :endOfDay " +
           "ORDER BY s.startTime ASC")
    List<Showtime> findShowtimesByMovieAndDate(
        @Param("movieId") Long movieId,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );

    // 🌟 2. DÙNG CHO CUSTOMER: Chỉ lấy suất chiếu mang trạng thái ACTIVE và còn hạn
    @Query("SELECT s FROM Showtime s WHERE s.movie.movieId = :movieId " +
           "AND s.startTime >= :startOfDay AND s.startTime <= :endOfDay " +
           "AND s.status = 'ACTIVE' " +
           "ORDER BY s.startTime ASC")
    List<Showtime> findActiveShowtimesForCustomer(
        @Param("movieId") Long movieId,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );
}