package com.cinema.backend.entities;

import jakarta.persistence.*; // Đảm bảo dùng jakarta nếu bạn dùng Spring Boot 3+
import lombok.Data;
import java.time.LocalDateTime;
@Entity
@Table(name="feedback")
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
    @Column(name="movie_id")
    private Integer movieId;
    @Column(name="account_staff_id")
    private Integer accountStaffId;
    @Column(name = "created_at")
private LocalDateTime createdAt;

}