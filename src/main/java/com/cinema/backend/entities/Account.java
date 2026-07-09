package com.cinema.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "Account")
@Getter
@Setter
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "fullname", nullable = false)
    private String fullname;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone", nullable = false, unique = true)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash; 

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_date", nullable = false)
    private LocalDateTime updatedDate;

    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "status")
    private String status; // Giá trị: "Active", "Banned"

    @JsonIgnore
    @OneToMany(mappedBy = "customer")
    private List<Order1> customerOrders;

    @OneToMany(mappedBy = "staff")
    private List<Order1> staffOrders;

    @Column(name = "status")
    private String status; // Giá trị: "Active", "Banned"
}
