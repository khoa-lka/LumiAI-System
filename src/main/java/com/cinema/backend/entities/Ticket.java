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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id")
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    // Giữ lại quan hệ order_id (đã có ở bản hientai gốc) để không phá vỡ
    // TicketRepository.findTicketsByOrderOrTicketCode (native query JOIN order1
    // ON t.order_id = o.order_id). Nếu bỏ field này, các vé tạo mới sau khi merge
    // sẽ có order_id = NULL trong DB và tính năng tra cứu vé theo mã đơn ở POS
    // (staff.js) sẽ ngừng hoạt động với đơn hàng mới.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order1 order;
}