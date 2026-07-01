package com.cinema.backend.controllers;
import com.cinema.backend.repositories.ShowtimeRepository; // Thêm dòng này
import com.cinema.backend.repositories.TicketRepository;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")

public class SeatController {

     @Autowired
    private SeatRepository seatRepository;

 

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private TicketRepository ticketRepository;

  

    

    // 🚀 API: Lấy ma trận ghế
    @GetMapping("/matrix")
public List<Map<String, Object>> getSeatsMatrix(@RequestParam Integer showtimeId) {

    Showtime showtime = showtimeRepository.findById(showtimeId)
            .orElseThrow(() -> new RuntimeException("Showtime không tồn tại"));

    Integer roomId = showtime.getRoomId();

    List<Seat> seats = seatRepository.findByRoomId(roomId);

List<String> soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
System.out.println("SOLD SEATS = " + soldSeats);

    List<Map<String, Object>> result = new ArrayList<>();

    for (Seat seat : seats) {

        String seatCode = seat.getSeatRow() + seat.getSeatNumber();
        System.out.println("CHECK SEAT = " + seatCode);

        Map<String, Object> item = new HashMap<>();

        item.put("seatId", seatCode);
        item.put("seatRow", seat.getSeatRow());
        item.put("seatNumber", seat.getSeatNumber());
        item.put("seatType", seat.getSeatType());
        item.put("rowIndex", seat.getRowIndex());
        item.put("colIndex", seat.getColIndex());

        if (soldSeats.contains(seatCode)) {
            item.put("status", "sold");
        } else {
            item.put("status", "available");
        }

        result.add(item);
    }

    return result;
}

    @PostMapping("/checkout")
public Map<String, Object> checkout(@RequestBody Map<String, Object> payload) {

    Map<String, Object> response = new HashMap<>();

    try {
          System.out.println("CHECKOUT PAYLOAD = " + payload);
        String movie = (String) payload.get("movie");
        Integer showtimeId = Integer.valueOf(payload.get("showtime").toString());
        String email = (String) payload.get("email");
        List<String> seats = (List<String>) payload.get("seats");

        List<Ticket> savedTickets = new ArrayList<>();

        for (String seatCode : seats) {

            // 1. convert seatCode (A1) -> seat entity
            Showtime showtime =
        showtimeRepository.findById(showtimeId).orElseThrow();

           String row = seatCode.substring(0, 1);
Integer number = Integer.parseInt(seatCode.substring(1));

System.out.println("========== CHECK SEAT ==========");
System.out.println("Showtime ID = " + showtimeId);
System.out.println("Room ID = " + showtime.getRoomId());
System.out.println("Seat Code = " + seatCode);
System.out.println("Row = " + row);
System.out.println("Number = " + number);

Optional<Seat> testSeat = seatRepository.findByRoomIdAndSeatRowAndSeatNumber(
        showtime.getRoomId(),
        row,
        number);

System.out.println("Found = " + testSeat.isPresent());

Seat seat = testSeat.orElseThrow(() ->
        new RuntimeException("Seat not found: " + seatCode));

            // 2. check nếu ghế đã bán
            List<String> soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
            if (soldSeats.contains(seatCode)) {
                throw new RuntimeException("Seat already booked: " + seatCode);
            }

            // 3. tạo ticket
            Ticket ticket = new Ticket();
ticket.setShowtimeId(showtimeId);
ticket.setSeatId(seat.getSeatId());
ticket.setTicketStatus("SOLD");

String ticketCode = "TICKET-" + System.currentTimeMillis() + "-" + seatCode;

ticket.setTicketCode(ticketCode);
ticket.setQrCode(ticketCode);   // <-- THÊM DÒNG NÀY

savedTickets.add(ticketRepository.save(ticket));
        }

        response.put("success", true);
        response.put("ticketId", savedTickets.get(0).getTicketCode());
        response.put("totalTickets", savedTickets.size());
        response.put("message", "Checkout success");

        return response;

    } catch (Exception e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return response;
    }
}
}