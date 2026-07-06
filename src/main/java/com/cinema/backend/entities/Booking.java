package com.cinema.backend.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="booking")
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="booking_id")
    private Integer bookingId;

    @Column(name="account_id")
    private Integer accountId;

    @Column(name="movie_name")
    private String movieName;

    @Column(name="showtime_id")
    private Integer showtimeId;

    @Column(name="booking_date")
    private LocalDateTime bookingDate;

    @Column(name="total_money")
    private BigDecimal totalMoney;

    @Column(name="payment_method")
    private String paymentMethod;

    @Column(name="payment_status")
    private String paymentStatus;
}