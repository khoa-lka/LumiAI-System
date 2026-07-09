package com.cinema.backend.service;

import com.cinema.backend.entities.DashboardTotalDTO;
import com.cinema.backend.repositories.DashboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private DashboardRepository dashboardRepository;

    @Override
    public DashboardTotalDTO getOverviewDashboardData() {
        DashboardTotalDTO dto = new DashboardTotalDTO();

        // 1. Nạp cụm 4 chỉ số nhanh (Thẻ Card)
        dto.setTodayRevenue(dashboardRepository.getTodayRevenue());
        dto.setTodayTicketsSold(dashboardRepository.getTodayTicketsSold());
        dto.setActiveMoviesCount(dashboardRepository.getActiveMoviesCount());
        dto.setLowStockFnbCount(0); // Luồng mock dữ liệu tồn kho an toàn, Front-End tự xử lý bù hàng sau

        // 2. Mock dữ liệu 6 tháng gần nhất cho biểu đồ xu hướng (Doanh thu & Số vé)
        // (Do cơ chế database của em đang chạy mốc thời gian thực, tụi mình mồi sẵn data mẫu cấu trúc Node để FE vẽ trục X/Y)
        List<DashboardTotalDTO.ChartDataNode> trendData = new ArrayList<>();
        List<DashboardTotalDTO.ChartDataNode> monthlyTickets = new ArrayList<>();
        String[] months = {"Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7"};
        int[] fakeTickets = {840, 950, 1100, 1050, 1240, 1300};
        double[] fakeRevenues = {75.0, 85.0, 98.0, 92.0, 125.0, 140.0}; // Đơn vị Triệu VND

        for (int i = 0; i < months.length; i++) {
            DashboardTotalDTO.ChartDataNode rNode = new DashboardTotalDTO.ChartDataNode();
            rNode.setLabel(months[i]);
            rNode.setValue(BigDecimal.valueOf(fakeRevenues[i] * 1000000));
            trendData.add(rNode);

            DashboardTotalDTO.ChartDataNode tNode = new DashboardTotalDTO.ChartDataNode();
            tNode.setLabel(months[i]);
            tNode.setValue(BigDecimal.valueOf(fakeTickets[i]));
            monthlyTickets.add(tNode);
        }
        dto.setTrendRevenueData(trendData);
        dto.setTicketsMonthlyData(monthlyTickets);

        // 3. Nạp cơ cấu phân bố thể loại phim từ DB
        List<Map<String, Object>> rawGenres = dashboardRepository.getGenreDistribution();
        List<DashboardTotalDTO.GenreWeightNode> genreNodes = new ArrayList<>();
        for (Map<String, Object> map : rawGenres) {
            DashboardTotalDTO.GenreWeightNode node = new DashboardTotalDTO.GenreWeightNode();
            node.setGenreName(map.get("genreName") != null ? map.get("genreName").toString() : "Khác");
            node.setCount(map.get("count") != null ? Long.parseLong(map.get("count").toString()) : 0L);
            genreNodes.add(node);
        }
        dto.setGenreData(genreNodes);

        // 4. Nạp danh sách Top phim tuần này từ DB
        List<Map<String, Object>> rawTopMovies = dashboardRepository.getTopMoviesOfWeek();
        List<DashboardTotalDTO.TopMovieNode> topMovieNodes = new ArrayList<>();
        for (Map<String, Object> map : rawTopMovies) {
            DashboardTotalDTO.TopMovieNode node = new DashboardTotalDTO.TopMovieNode();
            node.setMovieId(Integer.parseInt(map.get("movieId").toString()));
            node.setTitle(map.get("title").toString());
            node.setTicketsCount(Long.parseLong(map.get("ticketsCount").toString()));
            node.setRating(map.get("rating") != null ? Double.parseDouble(map.get("rating").toString()) : 0.0);
            topMovieNodes.add(node);
        }
        dto.setTopMovies(topMovieNodes);

        // 5. Nạp danh sách 5 giao dịch gần đây nhất từ DB
        List<Map<String, Object>> rawOrders = dashboardRepository.getRecentTransactions();
        List<DashboardTotalDTO.RecentOrderNode> recentOrderNodes = new ArrayList<>();
        for (Map<String, Object> map : rawOrders) {
            DashboardTotalDTO.RecentOrderNode node = new DashboardTotalDTO.RecentOrderNode();
            node.setOrderCode(map.get("orderCode").toString());
            node.setCustomerName(map.get("customerName") != null ? map.get("customerName").toString() : "Khách vãng lai");
            node.setPaymentMethod(map.get("paymentMethod") != null ? map.get("paymentMethod").toString() : "CASH");
            node.setFinalAmount((BigDecimal) map.get("finalAmount"));
            node.setOrderStatus(map.get("orderStatus").toString());
            node.setCreatedTime(map.get("createdTime").toString());
            recentOrderNodes.add(node);
        }
        dto.setRecentOrders(recentOrderNodes);

        return dto;
    }
}