package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.backend.dto.FoodItemDTO;
import com.cinema.backend.dto.OrderHistoryDTO;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.SeatRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private SeatRepository seatRepository;

    public List<OrderHistoryDTO> getHistory(Integer accountId) {

        List<Order1> orders =
                orderRepository.findByCustomerAccountIdOrderByCreatedDateDesc(accountId);

        List<OrderHistoryDTO> result = new ArrayList<>();

        for (Order1 order : orders) {

            OrderHistoryDTO dto = new OrderHistoryDTO();

            dto.setOrderId(order.getOrderId());
            dto.setOrderCode(order.getOrderCode());
            dto.setGrossAmount(order.getGrossAmount());
            dto.setFinalAmount(order.getFinalAmount());
            dto.setCreatedDate(order.getCreatedDate());
            dto.setOrderStatus(order.getOrderStatus());
            dto.setPaymentStatus(order.getPaymentStatus());
            dto.setVoucher(order.getVoucher());
            dto.setShowtime(order.getShowtime());
            dto.setTicketStatus( calculateTicketStatus(order.getShowtime()));

            //------------------------------------
            // Ghế
            //------------------------------------

            List<String> seats = new ArrayList<>();

            //------------------------------------
            // F&B
            //------------------------------------

            List<FoodItemDTO> foods = new ArrayList<>();

            //------------------------------------
            // Đọc Order Detail
            //------------------------------------

            List<OrderDetail> details =
                    orderDetailRepository.findByOrderOrderId(order.getOrderId());

            for (OrderDetail detail : details) {
                 System.out.println("Detail ID = " + detail.getOrderDetailId());

                System.out.println("Ticket = " + detail.getTicket());

                System.out.println("Food = " + detail.getFoodItem());


                // ===== Vé =====
                if (detail.getTicket() != null) {

                    Ticket ticket = detail.getTicket();

                    Seat seat = seatRepository
                            .findById(ticket.getSeatId())
                            .orElse(null);

                    if (seat != null) {

                        seats.add(
                                seat.getSeatRow() +
                                seat.getSeatNumber()
                        );

                    }
                }

                // ===== F&B =====
                if (detail.getFoodItem() != null) {

                    FoodItemDTO food = new FoodItemDTO();

                    food.setName(detail.getFoodItem().getItemName());
                    food.setQty(detail.getQuantity());

                    foods.add(food);
                }
            }

            dto.setSeats(seats);
            dto.setFnb(foods);

            // Trạng thái vé
            dto.setTicketStatus(calculateTicketStatus(order.getShowtime()));

            result.add(dto);
        }

        return result;
    }

    private String calculateTicketStatus(Showtime showtime) {

        if (showtime == null) {
            return "Không xác định";
        }

        LocalDateTime now = LocalDateTime.now();

        // Nếu Entity Showtime dùng LocalDateTime
        if (showtime.getEndTime() != null && now.isAfter(showtime.getEndTime())) {
            return "Đã sử dụng";
        }

        if (showtime.getStartTime() != null && now.isAfter(showtime.getStartTime())) {
            return "Đang chiếu";
        }

        return "Sắp chiếu";
    }

}