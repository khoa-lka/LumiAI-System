package com.cinema.backend.entities;

import jakarta.persistence.*;
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
}