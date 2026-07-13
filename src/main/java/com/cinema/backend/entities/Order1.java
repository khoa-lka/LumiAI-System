package com.cinema.backend.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import jakarta.persistence.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order1 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "order_code")
    private String orderCode;

    @Column(name = "gross_amount")
    private BigDecimal grossAmount;

    @Column(name = "final_amount")
    private BigDecimal finalAmount;

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus;

    @ManyToOne
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @ManyToOne
    @JoinColumn(name = "account_cus_id")
    private Account customer;

    @ManyToOne
    @JoinColumn(name = "account_staff_id")
    private Account staff;

    @ManyToOne
    @JoinColumn(name = "showtime_id")
    private Showtime showtime;
}