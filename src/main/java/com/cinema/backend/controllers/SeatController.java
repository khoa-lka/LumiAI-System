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

    // 🚀 ĐỒNG BỘ HOÀN HẢO: Chỉ bốc đúng danh sách ghế của phòng chiếu thuộc suất chiếu đó
    @GetMapping("/matrix")
    public List<Map<String, Object>> getSeatsMatrix(@RequestParam("showtimeId") Integer showtimeId) {
        List<Map<String, Object>> seatMatrixResult = new ArrayList<>();
        
        // 1. Lấy danh sách mã ghế đã bán của suất chiếu này từ DB
        List<String> soldSeats = new ArrayList<>();
        try {
            soldSeats = seatRepository.findSoldSeatCodesByShowtime(showtimeId);
        } catch (Exception e) {
            System.out.println("⚠️ Chưa có vé được bán cho suất chiếu này, chạy danh sách trống!");
        }

        // 2. BỐC ĐÚNG GHẾ THẬT THEO SUẤT CHIẾU (Đã sửa từ findAll() sang hàm lọc động)
        try {
            List<Seat> allSeatsInRoom = seatRepository.findSeatsByShowtimeId(showtimeId); 

            for (Seat seat : allSeatsInRoom) {
                Map<String, Object> seatMap = new HashMap<>();
                
                // 🎯 Gọi các hàm Getter chuẩn camelCase nhờ Lombok
                seatMap.put("seatRow", seat.getSeatRow());
                seatMap.put("seatNumber", seat.getSeatNumber());
                seatMap.put("rowIndex", seat.getRowIndex());
                seatMap.put("colIndex", seat.getColIndex());
                seatMap.put("seatType", seat.getSeatType());
                seatMap.put("roomId", seat.getRoomId());
                
                // Ghép chuỗi mã ghế (Ví dụ: "A" + 1 = "A1") để kiểm tra trạng thái đặt
                String seatCode = (seat.getSeatRow() + seat.getSeatNumber()).trim().toUpperCase();
                
                if (soldSeats != null && soldSeats.contains(seatCode)) {
                    seatMap.put("status", "sold");
                } else {
                    seatMap.put("status", "available");
                }
                
                seatMatrixResult.add(seatMap);
            }
        } catch (Exception e) {
            System.out.println("🚨 Lỗi bốc dữ liệu ma trận ghế từ DB: " + e.getMessage());
        }

        return seatMatrixResult;
    }
}