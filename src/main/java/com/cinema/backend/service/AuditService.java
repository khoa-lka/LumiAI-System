package com.cinema.backend.service;

import com.cinema.backend.entities.AuditDashboardDTO;

public interface AuditService {
    AuditDashboardDTO getDashboardAuditReport(String date);
}