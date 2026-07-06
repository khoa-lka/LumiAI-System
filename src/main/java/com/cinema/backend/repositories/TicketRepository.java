package com.cinema.backend.repositories;

import com.cinema.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    // Tìm kiếm nhanh danh sách vé dựa theo suất chiếu để sau này phục vụ thống kê
    List<Ticket> findByShowtimeId(Integer showtimeId);
}