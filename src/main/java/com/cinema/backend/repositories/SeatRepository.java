package com.cinema.backend.repositories;

import com.cinema.backend.entities.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    // Lấy toàn bộ danh sách ghế cứng cấu hình thuộc về 1 phòng chiếu cụ thể
    List<Seat> findByRoomId(Integer roomId);

    // Lấy danh sách mã ghế đã được đặt (sold/BOOKED) của một suất chiếu конкрет từ bảng vé (Ticket) hoặc hóa đơn chi tiết của các bạn
    // Thầy viết sẵn câu Native Query bọc lót theo logic chung: Ghế nào nằm trong các vé thành công của showtime này thì coi như "sold"
    @Query(value = "SELECT s.seat_row + CAST(s.seat_number AS VARCHAR) FROM seat s " +
                   "JOIN ticket t ON s.seat_id = t.seat_id " +
                   "WHERE t.showtime_id = :showtimeId AND UPPER(t.ticket_status) IN ('SOLD', 'BOOKED', 'SUCCESS')", 
           nativeQuery = true)
    List<String> findSoldSeatCodesByShowtime(@Param("showtimeId") Integer showtimeId);

    // 🚀 ĐÃ SỬA LỖI HẾT BỊ SẬP: Chuyển sang Native Query dùng SQL thuần để khớp 100% database gốc
    @Query(value = "SELECT s.* FROM seat s " +
                   "WHERE s.room_id = (SELECT st.room_id FROM showtime st WHERE st.showtime_id = :showtimeId) " +
                   "ORDER BY s.row_index, s.col_index", 
           nativeQuery = true)
    List<Seat> findSeatsByShowtimeId(@Param("showtimeId") Integer showtimeId);
}
