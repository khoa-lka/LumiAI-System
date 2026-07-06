package com.cinema.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.backend.entities.Booking;
import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.BookingRepository;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.TicketRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
     @Autowired
    BookingRepository bookingRepository;

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    SeatRepository seatRepository;

    @Autowired
    ShowtimeRepository showtimeRepository;

    @Autowired
    VoucherService voucherService;

@Transactional
public Booking checkout(CheckoutRequest request) {

    if (request.getShowtimeId() == null) {
    throw new RuntimeException("showtimeId is null from client");
}

    // 1. tạo booking
    Booking booking = new Booking();
    booking.setAccountId(request.getAccountId());
    booking.setMovieName(request.getMovieName()); // ⚠ phải đồng bộ FE
    booking.setShowtimeId(request.getShowtimeId());
    booking.setBookingDate(LocalDateTime.now());
    booking.setTotalMoney(request.getTotalMoney());
    booking.setPaymentMethod(request.getPaymentMethod());
    booking.setPaymentStatus("SUCCESS");

    booking = bookingRepository.save(booking);

    // 2. tạo tickets
    for (String seatCode : request.getSeats()) {

        String row = seatCode.substring(0, 1);
        Integer number = Integer.parseInt(seatCode.substring(1));

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        Seat seat = seatRepository
    .findByRoomIdAndSeatRowAndSeatNumber(
        showtime.getRoomId(),
        row,
        number
    )
    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatCode));

        Ticket ticket = new Ticket();
        ticket.setBookingId(booking.getBookingId());
        ticket.setSeatId(seat.getSeatId());
        ticket.setShowtimeId(request.getShowtimeId());
        ticket.setTicketStatus("SOLD");

        String code = "TICKET-" + System.currentTimeMillis() + "-" + seatCode;
        ticket.setTicketCode(code);
        ticket.setQrCode(code);

        ticketRepository.save(ticket);
    }

    if(request.getVoucherCode()!=null &&
   !request.getVoucherCode().isBlank()){

    System.out.println("Voucher nhận được = " + request.getVoucherCode());

if(request.getVoucherCode()!=null &&
   !request.getVoucherCode().isBlank()){

    voucherService.useVoucher(request.getVoucherCode());
}
    voucherService.useVoucher(request.getVoucherCode());
}

    return booking;
}
}

