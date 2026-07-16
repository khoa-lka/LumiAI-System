package com.cinema.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.cinema.backend.dto.FoodItemDTO;
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

    // Trạng thái vé
    private String ticketStatus;

    private LocalDateTime createdDate;

    // BO SUNG: đổi từ Showtime (Hibernate Entity) sang ShowtimeHistoryDTO — tránh trả
    // thẳng entity ra JSON (rủi ro lazy-loading proxy / vòng lặp serialization).
    // Đồng thời sửa luôn import "com.google.auto.value.AutoValue.Builder" bị nhầm ở
    // bản trước (không liên quan gì tới Lombok, có thể gây lỗi biên dịch nếu thư viện
    // AutoValue không có trong classpath) thành đúng "lombok.Builder".
    private ShowtimeHistoryDTO showtime;

    private Voucher voucher;

    private List<String> seats;

    private List<FoodItemDTO> fnb;

}
