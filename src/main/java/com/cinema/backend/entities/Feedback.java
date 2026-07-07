package com.cinema.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="feedback") // Tên bảng trong SQL Server
@Data
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="feedback_id")
    private Integer feedbackId;

    private String title;
    private String content;

    @Column(name="rating_stars")
    private Integer ratingStars;

    @Column(name="order_id")
    private Integer orderId;

    @Column(name="account_staff_id")
    private Integer accountStaffId;
}