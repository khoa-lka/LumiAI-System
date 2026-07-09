package com.cinema.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.cinema.backend.dto.FoodItemDTO;
import com.cinema.backend.entities.FoodBeverage;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Voucher;
import com.google.auto.value.AutoValue.Builder;

import lombok.AllArgsConstructor;
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

    // Trạng thái vé
    private String ticketStatus;

    private LocalDateTime createdDate;

    private Showtime showtime;

    private Voucher voucher;

    private List<String> seats;

    private List<FoodItemDTO> fnb;

    
}

