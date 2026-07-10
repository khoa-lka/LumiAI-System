package com.cinema.backend.controllers;

import com.cinema.backend.entities.AuditDashboardDTO; 
import com.cinema.backend.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin("*") // Chặn lỗi CORS khi gọi API từ Front-End khác cổng
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping("/report")
    public ResponseEntity<?> getReportData(@RequestParam String date) {
        try {
            AuditDashboardDTO report = auditService.getDashboardAuditReport(date);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi hệ thống khi tải báo cáo: " + e.getMessage());
        }
    }
}