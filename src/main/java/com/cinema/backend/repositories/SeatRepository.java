package com.cinema.backend.repositories;

import com.cinema.backend.entities.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    // Lấy toàn bộ danh sách ghế cứng cấu hình thuộc về 1 phòng chiếu cụ thể
    List<Seat> findByRoomId(Integer roomId);

    // 🚀 ĐỒNG BỘ HOÀN HẢO: Lấy danh sách mã ghế đã bán theo trạng thái vé chuẩn
    @Query(value = "SELECT CONCAT(s.seat_row, s.seat_number) FROM seat s " +
                   "JOIN ticket t ON s.seat_id = t.seat_id " +
                   "WHERE t.showtime_id = :showtimeId AND UPPER(t.ticket_status) IN ('SOLD', 'BOOKED', 'SUCCESS')", 
           nativeQuery = true)
    List<String> findSoldSeatCodesByShowtime(@Param("showtimeId") Integer showtimeId);

    // 🚀 BẢO VỆ CHỐNG SẬP: Chuyển sang Native Query dùng SQL thuần để khớp 100% database gốc
    @Query(value = "SELECT s.* FROM seat s " +
                   "WHERE s.room_id = (SELECT st.room_id FROM showtime st WHERE st.showtime_id = :showtimeId) " +
                   "ORDER BY s.row_index, s.col_index", 
           nativeQuery = true)
    List<Seat> findSeatsByShowtimeId(@Param("showtimeId") Integer showtimeId);

    // 🎯 GIỮ LẠI: Hàm tìm ghế phục vụ cho luồng checkout thanh toán của Khoa
    Optional<Seat> findByRoomIdAndSeatRowAndSeatNumber(
        Integer roomId,
        String seatRow,
        Integer seatNumber
    );
}