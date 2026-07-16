package com.cinema.backend.controllers;
import com.cinema.backend.repositories.ShowtimeRepository; // Thêm dòng này
import com.cinema.backend.repositories.TicketRepository;
import com.cinema.backend.entities.FoodBeverage;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.SeatRepository;

import com.cinema.backend.service.VoucherService;

import org.springframework.transaction.annotation.Transactional;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.service.BookingService;
import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.dto.CheckoutResponseDTO;


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
    private VoucherService voucherService;

    @Autowired
    private BookingService bookingService;


    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private FoodBeverageRepository foodBeverageRepository;


    // 🚀 API: Lấy ma trận ghế
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

    
@PostMapping("/checkout")
public Map<String, Object> checkout(@RequestBody CheckoutRequest request) {
      System.out.println("accountId = " + request.getAccountId());
    System.out.println("showtimeId = " + request.getShowtimeId());
    System.out.println("totalMoney = " + request.getTotalMoney());
    System.out.println("paymentMethod = " + request.getPaymentMethod());
    System.out.println(request.getShowtimeId());
    Map<String, Object> response = new HashMap<>();

    try {

        CheckoutResponseDTO checkoutResult = bookingService.checkout(request);
        Order1 order = checkoutResult.getOrder();

        response.put("success", true);
        response.put("orderId", order.getOrderId());
        response.put("orderCode", order.getOrderCode());
        response.put("seats", request.getSeats());
        response.put("fnbSummary", checkoutResult.getFnbSummary());
        response.put("ticketCodes", checkoutResult.getTicketCodes());

        return response;

    } catch (Exception e) {

          e.printStackTrace();

    response.put("success",false);
    response.put("message",e.getMessage());

    return response;
    }
}

}