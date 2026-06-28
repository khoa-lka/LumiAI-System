package com.cinema.backend.controllers;

import com.cinema.backend.entities.Seat;
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

    // 🚀 ĐÓN ĐÚNG API: /api/seats/matrix?showtimeId=...
    @GetMapping("/matrix")
    public List<Map<String, Object>> getSeatsMatrix(@RequestParam("showtimeId") Integer showtimeId) {
        List<Map<String, Object>> seatMatrixResult = new ArrayList<>();
        
        // 1. Giả lập hoặc lấy danh sách ghế đã bán từ DB thông qua hàm Repository
        List<String> soldSeats = new ArrayList<>();
        try {
            soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
        } catch (Exception e) {
            // Nếu bảng Ticket chưa có hoặc dính Foreign Key trống, ta bọc lót danh sách rỗng để không crash
            System.out.println("⚠️ Hệ thống chưa nạp bảng Ticket bán vé thực tế, chạy luồng trống!");
        }

        // 2. Tạo danh sách 100 ghế mẫu (A1 -> J10) gửi trả về khớp định dạng Front-end mong đợi
        String[] rows = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        for (String r : rows) {
            for (int c = 1; c <= 10; c++) {
                String seatCode = r + c;
                Map<String, Object> seatMap = new HashMap<>();
                seatMap.put("seatId", seatCode);
                
                // Check xem mã ghế hiện tại có nằm trong danh sách đã bán (sold) không
                if (soldSeats.contains(seatCode)) {
                    seatMap.put("status", "sold");
                } else {
                    seatMap.put("status", "available");
                }
                
                seatMatrixResult.add(seatMap);
            }
        }

        return seatMatrixResult;
    }
}