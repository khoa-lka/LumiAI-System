package com.cinema.backend.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.cinema.backend.config.CurrentUser;
import org.springframework.http.ResponseEntity;



import com.cinema.backend.config.CurrentUser;
import com.cinema.backend.dto.OrderHistoryDTO;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private FoodBeverageRepository foodRepository;

    @Autowired
    private OrderService orderService;

    @GetMapping("/history/{accountId}")
    public ResponseEntity<?> getHistory(@PathVariable Integer accountId) {

        if (!CurrentUser.canAccess(accountId)) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Bạn không có quyền xem đơn hàng này!"
            ));
        }

        return ResponseEntity.ok(orderService.getHistory(accountId));
    }

}
