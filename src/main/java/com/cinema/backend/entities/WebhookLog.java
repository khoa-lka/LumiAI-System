package com.cinema.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_logs")
@Getter
@Setter
public class WebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "webhook_log_id")
    private Long id;

    @Column(name = "time_created", nullable = false)
    private LocalDateTime time;

    @Column(name = "endpoint", nullable = false)
    private String endpoint;

    @Column(name = "http_code", nullable = false)
    private Integer code;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "response_ms", nullable = false)
    private Long responseMs;

    @Column(name = "size_kb", nullable = false)
    private BigDecimal sizeKb;

    @Column(name = "payload", columnDefinition = "NVARCHAR(MAX)")
    private String payload;
}