package com.cinema.backend.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
public List<OrderHistoryDTO> getHistory(
        @PathVariable Integer accountId) {

    return orderService.getHistory(accountId);
}

}
