package com.cinema.backend.repositories;

import com.cinema.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

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
}