package com.cinema.backend.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class QrWebhookDTO {

    private String qrRef;

    private String description;

    private BigDecimal amount;

    private String status;
}