package com.cinema.backend.controllers;

import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.TicketRepository;
import org.springframework.transaction.annotation.Transactional;
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
    private TicketRepository ticketRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    // 🚀 ĐỒNG BỘ HOÀN HẢO: Chỉ bốc đúng danh sách ghế của phòng chiếu thuộc suất chiếu đó
    @GetMapping("/matrix")
    public List<Map<String, Object>> getSeatsMatrix(@RequestParam("showtimeId") Integer showtimeId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        try {
            Showtime showtime = showtimeRepository.findById(showtimeId)
                    .orElseThrow(() -> new RuntimeException("Showtime không tồn tại"));

            Integer roomId = showtime.getRoomId();
            List<Seat> seats = seatRepository.findByRoomId(roomId);

            // 1. Lấy danh sách mã ghế đã bán của suất chiếu này từ DB
            List<String> soldSeats = new ArrayList<>();
            try {
                soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
            } catch (Exception e) {
                System.out.println("⚠️ Chưa có vé được bán cho suất chiếu này, chạy danh sách trống!");
            }

            // 2. Map dữ liệu trả về cho Front-End (Đảm bảo có đầy đủ seatId và camelCase chuẩn)
            for (Seat seat : seats) {
                String seatCode = (seat.getSeatRow() + seat.getSeatNumber()).trim().toUpperCase();
                Map<String, Object> item = new HashMap<>();

                item.put("seatId", seatCode); // 🎯 Khóa giữ lại để Front-end so khớp không bị lỗi undefined
                item.put("seatRow", seat.getSeatRow());
                item.put("seatNumber", seat.getSeatNumber());
                item.put("seatType", seat.getSeatType());
                item.put("rowIndex", seat.getRowIndex());
                item.put("colIndex", seat.getColIndex());
                item.put("roomId", seat.getRoomId());

                if (soldSeats != null && soldSeats.contains(seatCode)) {
                    item.put("status", "sold");
                } else {
                    item.put("status", "available");
                }

                result.add(item);
            }
        } catch (Exception e) {
            System.out.println("🚨 Lỗi bốc dữ liệu ma trận ghế từ DB: " + e.getMessage());
        }

        return result;
    }

    // 🚀 LUỒNG CHECKOUT: Đặt vé và lưu thông tin Ticket vào database mẫu của nhóm
    @PostMapping("/checkout")
    @Transactional
    public Map<String, Object> checkout(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("CHECKOUT PAYLOAD = " + payload);

            Integer showtimeId = Integer.valueOf(payload.get("showtime").toString());
            List<String> seats = (List<String>) payload.get("seats");

            if (seats == null || seats.isEmpty()) {
                throw new RuntimeException("Seats is empty");
            }

            Showtime showtime = showtimeRepository.findById(showtimeId)
                    .orElseThrow(() -> new RuntimeException("Showtime không tồn tại"));

            List<String> soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
            List<Ticket> savedTickets = new ArrayList<>();

            for (String seatCode : seats) {
                String row = seatCode.substring(0, 1);
                Integer number = Integer.parseInt(seatCode.substring(1));

                Optional<Seat> seatOpt = seatRepository.findByRoomIdAndSeatRowAndSeatNumber(
                        showtime.getRoomId(), row, number
                );

                Seat seat = seatOpt.orElseThrow(() -> new RuntimeException("Seat not found: " + seatCode));

                if (soldSeats.contains(seatCode)) {
                    throw new RuntimeException("Seat already booked: " + seatCode);
                }

                Ticket ticket = new Ticket();
                ticket.setShowtimeId(showtimeId);
                ticket.setSeatId(seat.getSeatId());
                ticket.setTicketStatus("SOLD");

                String ticketCode = "TICKET-" + System.currentTimeMillis() + "-" + seatCode;
                ticket.setTicketCode(ticketCode);
                ticket.setQrCode(ticketCode);

                savedTickets.add(ticketRepository.save(ticket));
            }

            // Trả về response thành công khớp với đoạn đuôi file của em
            response.put("success", true);
            response.put("ticketId", savedTickets.get(0).getTicketCode());
            response.put("totalTickets", savedTickets.size());
            return response;

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return response;
        }
    }
}