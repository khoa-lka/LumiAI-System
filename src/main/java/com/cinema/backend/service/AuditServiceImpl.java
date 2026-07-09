package com.cinema.backend.service;

import com.cinema.backend.entities.AuditDashboardDTO;
import com.cinema.backend.repositories.AuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    @Autowired
    private AuditRepository auditRepository;

    @Override
    public AuditDashboardDTO getDashboardAuditReport(String date) {
        AuditDashboardDTO dto = new AuditDashboardDTO();
        
        // 1. Gọi Repo lấy các chỉ số tiền và số lượng
        BigDecimal ticketRev = auditRepository.getTicketRevenueByDate(date);
        BigDecimal fnbRev = auditRepository.getFnbRevenueByDate(date);
        Integer fnbQty = auditRepository.getFnbQuantityCountByDate(date);
        
        dto.setTicketRevenue(ticketRev);
        dto.setFnbRevenue(fnbRev);
        dto.setFnbQuantity(fnbQty != null ? fnbQty : 0);
        
        // 2. Tính toán tỷ lệ lấp đầy ghế (%)
        Long soldTickets = auditRepository.getSoldTicketsCountByDate(date);
        Long totalSeats = auditRepository.getTotalAvailableSeatsByDate(date);
        if (totalSeats != null && totalSeats > 0) {
            double rate = (double) soldTickets / totalSeats * 100;
            dto.setOccupancyRate(Math.round(rate * 10.0) / 10.0); // Làm tròn 1 chữ số thập phân
        } else {
            dto.setOccupancyRate(0.0);
        }
        
        // 3. Xử lý logic bảng đối soát chi tiết dòng tiền trong ngày
        BigDecimal onlineRev = auditRepository.getOnlineRevenueByDate(date);
        
        List<AuditDashboardDTO.ReconciliationRow> rows = new ArrayList<>();
        AuditDashboardDTO.ReconciliationRow row = new AuditDashboardDTO.ReconciliationRow();
        row.setLabelDate(date);
        row.setPosAmount(fnbRev);       // Đại diện nguồn thu tại quầy
        row.setOnlineAmount(onlineRev); // Nguồn thu trực tuyến (Momo/VNPAY)
        
        // Chênh lệch = Quầy - Trực tuyến
        BigDecimal deviation = fnbRev.subtract(onlineRev);
        row.setDeviation(deviation);
        
        if (deviation.compareTo(BigDecimal.ZERO) == 0) {
            row.setStatus("Khớp hoàn toàn");
        } else {
            row.setStatus("Lỗi Chênh lệch");
        }
        
        rows.add(row);
        dto.setAuditRows(rows);
        
        return dto;
    }
}