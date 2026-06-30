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

    // Lấy toàn bộ danh sách ghế cứng cấu hình thuộc về 1 phòng chiếu конкрет
    List<Seat> findByRoomId(Integer roomId);

    // Lấy danh sách mã ghế đã được đặt (sold/BOOKED) của một suất chiếu конкрет từ bảng vé (Ticket) hoặc hóa đơn chi tiết của các bạn
    // Thầy viết sẵn câu Native Query bọc lót theo logic chung: Ghế nào nằm trong các vé thành công của showtime này thì coi như "sold"
@Query(value = "SELECT CONCAT(s.seat_row, s.seat_number) " +
               "FROM seat s " +
               "JOIN ticket t ON s.seat_id = t.seat_id " +
               "WHERE t.showtime_id = :showtimeId",
       nativeQuery = true)
List<String> findSoldSeatCodesByShowtime(@Param("showtimeId") Integer showtimeId);


    Optional<Seat> findByRoomIdAndSeatRowAndSeatNumber(
        Integer roomId,
        String seatRow,
        Integer seatNumber
);
}