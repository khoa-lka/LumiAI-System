package com.cinema.backend.controllers;

import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.TicketRepository; // Cần tạo repo này
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

    // 🚀 API: Lấy ma trận ghế
    @GetMapping("/matrix")
    public List<Map<String, Object>> getSeatsMatrix(@RequestParam("showtimeId") Integer showtimeId) {
        List<Map<String, Object>> seatMatrixResult = new ArrayList<>();
        List<String> soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);

        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        for (String r : rows) {
            for (int c = 1; c <= 10; c++) {
                String seatCode = r + c;
                Map<String, Object> seatMap = new HashMap<>();
                seatMap.put("seatId", seatCode);
                seatMap.put("status", soldSeats.contains(seatCode) ? "sold" : "available");
                seatMatrixResult.add(seatMap);
            }
        }
        return seatMatrixResult;
    }

   @PostMapping("/checkout")
public Map<String, Object> checkout(@RequestBody Map<String, Object> checkoutData) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("message", "Thanh toán thành công!");
    response.put("ticketId", "LAS-" + System.currentTimeMillis());
    return response;
}
   
}