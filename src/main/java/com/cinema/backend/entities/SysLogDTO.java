package com.cinema.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime; // Import đúng thư viện này

@Entity
@Table(name = "syslogs")
@Getter
@Setter
public class SysLogDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id") // Khớp với log_id trong bảng
    private Long id;

    @Column(name = "time_created") // Khớp với tên cột trong bảng
    private LocalDateTime time; // Đổi từ String sang LocalDateTime

    @Column(name = "action_name")
    private String action;

    @Column(name = "user_name")
    private String user;

    @Column(name = "status")
    private String status;
    @Column(name = "level_name")
    private String level;

    @Column(name = "ip_address")
    private String ip;

    @Column(name = "detail")
    private String detail;
}