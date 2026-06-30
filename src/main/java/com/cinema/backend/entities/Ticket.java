package com.cinema.backend.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Data;
@Entity
@Table(name = "ticket")
@Data
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "qr_code", length = 8000)
    private String qrCode;

    @Column(name = "ticket_code", unique = true)
    private String ticketCode;

    @Column(name = "ticket_status")
    private String ticketStatus;

    @Column(name = "showtime_id")
    private Integer showtimeId;

    @Column(name = "seat_id")
    private Integer seatId;

    @Column(name = "account_id")
private Integer accountId;

@Column(name = "movie_title")
private String movieTitle;

@Column(name = "show_date")
private LocalDate showDate;

@Column(name = "show_time")
private LocalTime showTime;

@Column(name = "customer_email")
private String customerEmail;

@Column(name = "total_price")
private BigDecimal totalPrice;

@Column(name = "payment_method")
private String paymentMethod;

@Column(name = "payment_status")
private String paymentStatus;

@Column(name = "created_at")
private LocalDateTime createdAt;
}