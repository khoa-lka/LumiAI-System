package com.cinema.backend.entities;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AuditDashboardDTO {
    private BigDecimal ticketRevenue;   // Doanh thu vé
    private Double occupancyRate;       // Tỷ lệ lấp đầy (%)
    private Integer fnbQuantity;        // Số lượng F&B đã bán
    private BigDecimal fnbRevenue;      // Doanh thu F&B quầy
    private List<ReconciliationRow> auditRows; // Danh sách hàng đối soát chi tiết

    @Data
    public static class ReconciliationRow {
        private String labelDate;
        private BigDecimal posAmount;
        private BigDecimal onlineAmount;
        private BigDecimal deviation;
        private String status;
    }
}