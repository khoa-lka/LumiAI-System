package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.entities.Order1;
import com.cinema.backend.repositories.OrderRepository;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/history/{accountId}")
    public List<Order1> getHistory(@PathVariable Integer accountId) {
        return orderRepository.findByCustomerAccountIdOrderByCreatedDateDesc(accountId);
    }

}
