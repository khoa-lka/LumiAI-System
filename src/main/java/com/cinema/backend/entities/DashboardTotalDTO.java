package com.cinema.backend.entities;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardTotalDTO {
    // 1. Cụm 4 chỉ số hiển thị nhanh ở md-metrics
    private BigDecimal todayRevenue;
    private Long todayTicketsSold;
    private Integer activeMoviesCount;
    private Integer lowStockFnbCount;

    // 2. Dữ liệu biểu đồ xu hướng (6 tháng hoặc theo mốc)
    private List<ChartDataNode> trendRevenueData;
    private List<ChartDataNode> ticketsMonthlyData;

    // 3. Dữ liệu tỷ trọng thể loại phim
    private List<GenreWeightNode> genreData;

    // 4. Danh sách Top phim tuần này
    private List<TopMovieNode> topMovies;

    // 5. Danh sách 5 giao dịch gần đây nhất ở đáy trang
    private List<RecentOrderNode> recentOrders;

    // --- CÁC CLASS CON CHỨA DỮ LIỆU CHI TIẾT ---
    @Data
    public static class ChartDataNode {
        private String label;
        private BigDecimal value;
    }

    @Data
    public static class GenreWeightNode {
        private String genreName;
        private Long count;
    }

    @Data
    public static class TopMovieNode {
        private Integer movieId;
        private String title;
        private Long ticketsCount;
        private Double rating;
    }

    @Data
    public static class RecentOrderNode {
        private String orderCode;
        private String customerName;
        private String paymentMethod;
        private BigDecimal finalAmount;
        private String orderStatus;
        private String createdTime;
    }
}