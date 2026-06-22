package com.cinema.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "syslogs") // Bảng này sẽ được tạo trong SQL Server
@Getter
@Setter
public class SysLogDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Tự động tăng ID
    private Long id;

    @Column(name = "time_created") // Tên cột trong SQL
    private String time;

    @Column(name = "action_name")
    private String action;

    @Column(name = "user_name")
    private String user;

    @Column(name = "status")
    private String status;
}
