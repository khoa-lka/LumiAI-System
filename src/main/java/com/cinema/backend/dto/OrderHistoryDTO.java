package com.cinema.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Voucher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderHistoryDTO {

    private Integer orderId;
    private String orderCode;

    private BigDecimal grossAmount;
    private BigDecimal finalAmount;

    private String orderStatus;
    private String paymentStatus;

    private String ticketStatus;

    private LocalDateTime createdDate;

    private ShowtimeHistoryDTO showtime;
    private Voucher voucher;

    private List<String> seats;
    private List<FoodItemDTO> fnb;
}