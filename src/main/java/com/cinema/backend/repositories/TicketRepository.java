package com.cinema.backend.repositories;

import com.cinema.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    // Tìm kiếm nhanh danh sách vé dựa theo suất chiếu để sau này phục vụ thống kê
    List<Ticket> findByShowtimeId(Integer showtimeId);

    // Dùng cho Máy POS (Staff): lấy danh sách mã ghế đã bán của 1 suất chiếu
    @Query(value = "SELECT CONCAT(s.seat_row, s.seat_number) " +
                   "FROM ticket t JOIN seat s ON t.seat_id = s.seat_id " +
                   "WHERE t.showtime_id = :showtimeId AND t.ticket_status = 'SOLD'",
           nativeQuery = true)
    List<String> findBookedSeatsByShowtime(@Param("showtimeId") Integer showtimeId);

    // Dùng cho Máy POS (Staff), tab "In vé": tra cứu vé theo mã đơn hàng
    // (order_code, VD "ORD-...") HOẶC mã vé (ticket_code, VD "TIX-...") — tìm
    // được mọi đơn đã lưu trong DB, không chỉ đơn vừa bán gần nhất trên máy đó.
    // Trả 1 dòng / ghế, phía Java gộp lại thành 1 đơn hàng kèm danh sách ghế.
    @Query(value = "SELECT o.order_code AS orderCode, t.ticket_code AS ticketCode, " +
                   "m.title AS movieTitle, " +
                   "CONVERT(VARCHAR(10), s.start_time, 120) AS showDate, " +
                   "CONVERT(VARCHAR(5), s.start_time, 108) AS showTime, " +
                   "CONCAT(seat.seat_row, seat.seat_number) AS seatCode, " +
                   "o.final_amount AS totalPaid " +
                   "FROM ticket t " +
                   "JOIN order1 o ON t.order_id = o.order_id " +
                   "JOIN showtime s ON o.showtime_id = s.showtime_id " +
                   "JOIN movie m ON s.movie_id = m.movie_id " +
                   "JOIN seat seat ON t.seat_id = seat.seat_id " +
                   "WHERE o.order_code = :code OR t.ticket_code = :code " +
                   "ORDER BY seat.seat_row, seat.seat_number",
           nativeQuery = true)
    List<Map<String, Object>> findTicketsByOrderOrTicketCode(@Param("code") String code);
}