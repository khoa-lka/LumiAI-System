package com.cinema.backend.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.SeatRepository;

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

    @GetMapping("/history/{accountId}")
public List<Map<String, Object>> getHistory(@PathVariable Integer accountId) {

    List<Order1> orders =
            orderRepository.findByCustomerAccountIdOrderByCreatedDateDesc(accountId);

    List<Map<String,Object>> result = new ArrayList<>();

    for(Order1 order : orders){

        Map<String,Object> item = new HashMap<>();

        item.put("orderId",order.getOrderId());
        item.put("orderCode",order.getOrderCode());
        item.put("grossAmount",order.getGrossAmount());
        item.put("finalAmount",order.getFinalAmount());
        item.put("orderStatus",order.getOrderStatus());
        item.put("createdDate",order.getCreatedDate());
        item.put("paymentMethod",order.getPaymentMethod());
        item.put("paymentStatus",order.getPaymentStatus());

        item.put("customer",order.getCustomer());
        item.put("voucher",order.getVoucher());
        item.put("showtime",order.getShowtime());

        List<OrderDetail> details =
                orderDetailRepository.findByOrderOrderId(order.getOrderId());

        List<Map<String,Object>> seats = new ArrayList<>();
        List<Map<String,Object>> fnb = new ArrayList<>();

        for(OrderDetail d : details){

            // Vé
            if(d.getTicket()!=null){

                Ticket t = d.getTicket();

                Seat seat = seatRepository
                        .findById(t.getSeatId())
                        .orElse(null);

                if(seat!=null){

                    Map<String,Object> s = new HashMap<>();

                    s.put("seatLabel",
                            seat.getSeatRow()+seat.getSeatNumber());

                    seats.add(s);

                }

            }

            // Bắp nước
            if(d.getFoodItem()!=null){

                Map<String,Object> food = new HashMap<>();

                food.put("name",
                        d.getFoodItem().getItemName());

                food.put("qty",
                        d.getQuantity());

                fnb.add(food);

            }

        }

        item.put("seats",seats);
        item.put("fnb",fnb);

        result.add(item);

    }

    return result;

}

}
