package com.cinema.backend.repositories;

import com.cinema.backend.entities.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Integer> {

    @Query("SELECT s FROM Showtime s WHERE s.movie.movieId = :movieId " +
           "AND s.startTime >= :startOfDay AND s.startTime <= :endOfDay " +
           "ORDER BY s.startTime ASC")
    List<Showtime> findShowtimesByMovieAndDate(
        @Param("movieId") Long movieId,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );

    // Dùng riêng cho Máy POS (Staff): trả kèm tên phòng chiếu (native query),
    // đặt tên khác với findShowtimesByMovieAndDate ở trên để không đụng hàng
    // với luồng đặt vé online đang dùng method đó.
    @Query(value = "SELECT s.showtime_id AS \"showtimeId\", s.start_time AS \"startTime\", r.room_name AS \"roomName\", s.ticket_price AS \"ticketPrice\" " +
                   "FROM showtime s JOIN room r ON s.room_id = r.room_id " +
                   "WHERE s.movie_id = :movieId AND CAST(s.start_time AS DATE) = CAST(:showDate AS DATE) " +
                   "ORDER BY s.start_time ASC",
           nativeQuery = true)
    List<Map<String, Object>> findPosShowtimesByMovieAndDate(
            @Param("movieId") Integer movieId,
            @Param("showDate") String showDate);

    // 🌟 THÊM MỚI: Dùng cho Customer — chỉ lấy suất chiếu mang trạng thái ACTIVE và còn hạn
    @Query("SELECT s FROM Showtime s WHERE s.movie.movieId = :movieId " +
           "AND s.startTime >= :startOfDay AND s.startTime <= :endOfDay " +
           "AND s.status = 'ACTIVE' " +
           "ORDER BY s.startTime ASC")
    List<Showtime> findActiveShowtimesForCustomer(
        @Param("movieId") Long movieId,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );
    @Query("SELECT COUNT(s) FROM Showtime s WHERE s.roomId = :roomId " +
           "AND s.startTime < :newEndTime " +
           "AND s.endTime > :newStartTime")
    int countOverlappingShowtimes(
            @Param("roomId") Integer roomId, 
            @Param("newStartTime") LocalDateTime newStartTime, 
            @Param("newEndTime") LocalDateTime newEndTime);
}