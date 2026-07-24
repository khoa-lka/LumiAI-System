package com.cinema.backend.repositories;

import com.cinema.backend.entities.Order1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Repository
public interface DashboardRepository extends JpaRepository<Order1, Integer> {

    // 1. Tính doanh thu hôm nay từ order1 thành công (Chấp nhận cả COMPLETELY và COMPLETED)
    @Query(value = "SELECT COALESCE(SUM(final_amount), 0) FROM order1 " +
                   "WHERE CAST(created_date AS DATE) = CURRENT_DATE " +
                   "AND order_status IN ('COMPLETELY', 'COMPLETED')", nativeQuery = true)
    BigDecimal getTodayRevenue();

    // 2. Đếm số vé bán ra hôm nay từ các đơn hàng thành công
    @Query(value = "SELECT COUNT(t.ticket_id) FROM ticket t " +
                   "JOIN order1 o ON t.order_id = o.order_id " +
                   "WHERE CAST(o.created_date AS DATE) = CURRENT_DATE " +
                   "AND o.order_status IN ('COMPLETELY', 'COMPLETED')", nativeQuery = true)
    Long getTodayTicketsSold();

    // 3. Đếm số phim đang ở trạng thái hoạt động 'now_showing'
    @Query(value = "SELECT COUNT(movie_id) FROM movie WHERE status = 'now_showing'", nativeQuery = true)
    Integer getActiveMoviesCount();

    // 4. Lấy top 5 phim có lượng vé đặt nhiều nhất (Sửa kết nối bảng o.showtime_id để khớp luồng đơn hàng)
    @Query(value = "SELECT m.movie_id as \"movieId\", m.title as title, COUNT(t.ticket_id) as \"ticketsCount\", m.rating as rating " +
                   "FROM ticket t " +
                   "JOIN order1 o ON t.order_id = o.order_id " +
                   "JOIN showtime s ON COALESCE(o.showtime_id, t.showtime_id) = s.showtime_id " +
                   "JOIN movie m ON s.movie_id = m.movie_id " +
                   "WHERE o.order_status IN ('COMPLETELY', 'COMPLETED') " +
                   "GROUP BY m.movie_id, m.title, m.rating ORDER BY \"ticketsCount\" DESC LIMIT 5", nativeQuery = true)
    List<Map<String, Object>> getTopMoviesOfWeek();

    // 5. Lấy cơ cấu tỷ trọng thể loại phim dựa trên số lượng vé bán ra
    @Query(value = "SELECT m.genre as \"genreName\", COUNT(t.ticket_id) as count FROM ticket t " +
                   "JOIN order1 o ON t.order_id = o.order_id " +
                   "JOIN showtime s ON COALESCE(o.showtime_id, t.showtime_id) = s.showtime_id " +
                   "JOIN movie m ON s.movie_id = m.movie_id " +
                   "WHERE o.order_status IN ('COMPLETELY', 'COMPLETED') " +
                   "GROUP BY m.genre", nativeQuery = true)
    List<Map<String, Object>> getGenreDistribution();

    // 6. Lấy 5 giao dịch gần đây nhất để hiển thị ở md-transactions
  @Query(value =
        "SELECT " +
        "o.order_code AS \"orderCode\", " +
        "COALESCE(a.fullname, 'Khách vãng lai') AS \"customerName\", " +
        "COALESCE(o.payment_method, 'CASH') AS \"paymentMethod\", " +
        "COALESCE(o.final_amount, 0) AS \"finalAmount\", " +
        "COALESCE(o.order_status, 'UNKNOWN') AS \"orderStatus\", " +
        "COALESCE(TO_CHAR(o.created_date, 'YYYY-MM-DD HH24:MI'), " +
        "'Không xác định') AS \"createdTime\" " +
        "FROM order1 o " +
        "LEFT JOIN Account a ON o.account_cus_id = a.account_id " +
        "ORDER BY o.order_id DESC LIMIT 5",
        nativeQuery = true)
List<Map<String, Object>> getRecentTransactions();
}