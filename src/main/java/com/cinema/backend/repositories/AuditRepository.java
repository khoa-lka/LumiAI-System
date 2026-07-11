package com.cinema.backend.repositories;

import com.cinema.backend.entities.Order1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface AuditRepository extends JpaRepository<Order1, Integer> {

    // 1. Tính tổng doanh thu từ vé xem phim (Hóa đơn có dính suất chiếu showtime_id)
    @Query(value = "SELECT COALESCE(SUM(final_amount), 0) FROM order1 " +
                   "WHERE CAST(created_date AS DATE) = CAST(:date AS DATE) " +
                   "AND order_status = 'COMPLETELY' AND showtime_id IS NOT NULL", nativeQuery = true)
    BigDecimal getTicketRevenueByDate(@Param("date") String date);

    // 2. Tính số lượng vé thực tế đã bán ra trong ngày để tính tỷ lệ lấp đầy
    @Query(value = "SELECT COUNT(t.ticket_id) FROM ticket t " +
                   "JOIN order1 o ON t.order_id = o.order_id " +
                   "WHERE CAST(o.created_date AS DATE) = CAST(:date AS DATE) " +
                   "AND t.ticket_status IN ('SOLD', 'BOOKED', 'SUCCESS')", nativeQuery = true)
    Long getSoldTicketsCountByDate(@Param("date") String date);

    // 3. Tính tổng số ghế có sẵn của các suất chiếu đang chạy trong ngày
    @Query(value = "SELECT COALESCE(SUM(r.total_seats), 0) FROM showtime s " +
                   "JOIN room r ON s.room_id = r.room_id " +
                   "WHERE CAST(s.start_time AS DATE) = CAST(:date AS DATE)", nativeQuery = true)
    Long getTotalAvailableSeatsByDate(@Param("date") String date);

    // 4. Tính tổng doanh thu F&B độc lập (Các hóa đơn mua bắp nước thuần túy, không có showtime_id)
    @Query(value = "SELECT COALESCE(SUM(final_amount), 0) FROM order1 " +
                   "WHERE CAST(created_date AS DATE) = CAST(:date AS DATE) " +
                   "AND order_status = 'COMPLETELY' AND showtime_id IS NULL", nativeQuery = true)
    BigDecimal getFnbRevenueByDate(@Param("date") String date);

    // 5. Đếm tổng số lượng sản phẩm F&B đã bán ra từ chi tiết hóa đơn (orderdetail)
    @Query(value = "SELECT COALESCE(SUM(od.quantity), 0) FROM orderdetail od " +
                   "JOIN order1 o ON od.order_id = o.order_id " +
                   "WHERE CAST(o.created_date AS DATE) = CAST(:date AS DATE) " +
                   "AND o.order_status = 'COMPLETELY' AND od.food_item_id IS NOT NULL", nativeQuery = true)
    Integer getFnbQuantityCountByDate(@Param("date") String date);

    // 6. Tính tổng doanh thu trực tuyến (Cổng TTTT như Momo/VNPAY - không phải TIENMAT/CASH)
    @Query(value = "SELECT COALESCE(SUM(final_amount), 0) FROM order1 " +
                   "WHERE CAST(created_date AS DATE) = CAST(:date AS DATE) " +
                   "AND order_status = 'COMPLETELY' AND payment_method NOT IN ('CASH', 'TIENMAT')", nativeQuery = true)
    BigDecimal getOnlineRevenueByDate(@Param("date") String date);
}