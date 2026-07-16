package com.cinema.backend.dto;

import com.cinema.backend.entities.Order1;
import java.util.List;

// BO SUNG: DTO goi ket qua checkout luong dat ve online (SeatController) - kem theo
// danh sach ma ve vua tao va tom tat F&B da mua, de Front-end hien thi man hinh
// xac nhan sau khi thanh toan xong (khong can goi lai API rieng de lay lai thong tin).
public class CheckoutResponseDTO {
    private Order1 order;
    private List<String> ticketCodes;
    private String fnbSummary;

    public CheckoutResponseDTO(Order1 order, List<String> ticketCodes, String fnbSummary) {
        this.order = order;
        this.ticketCodes = ticketCodes;
        this.fnbSummary = fnbSummary;
    }

    public Order1 getOrder() {
        return order;
    }

    public List<String> getTicketCodes() {
        return ticketCodes;
    }

    public String getFnbSummary() {
        return fnbSummary;
    }
}
