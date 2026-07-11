package com.cinema.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.backend.entities.Account;

import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.PaymentTransaction;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;
import com.cinema.backend.repositories.PaymentTransactionRepository;
import com.cinema.backend.repositories.SeatRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.TicketRepository;
import com.cinema.backend.repositories.VoucherRepository;
import com.cinema.backend.entities.CheckoutFoodItem;
import com.cinema.backend.entities.FoodBeverage;

import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private VoucherService voucherService;
    
    @Autowired
    private FoodBeverageRepository foodRepository;

    
@Transactional
public Order1 checkout(CheckoutRequest request) {
System.out.println("===== BOOKING SERVICE =====");
System.out.println(request);
    if (request.getShowtimeId() == null) {
        throw new RuntimeException("ShowtimeId is null from client");
    }

    // Lấy khách hàng
    Account customer = accountRepository.findById(request.getAccountId())
            .orElseThrow(() -> new RuntimeException("Customer not found"));

    // Lấy suất chiếu
    Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
            .orElseThrow(() -> new RuntimeException("Showtime not found"));

    // =========================
    // Tạo Order
    // =========================

    BigDecimal grossAmount = BigDecimal.ZERO;

// Tổng tiền vé
grossAmount = grossAmount.add(
        showtime.getTicketPrice().multiply(
                BigDecimal.valueOf(request.getSeats().size())
        )
);

if (request.getFnb() != null) {

    for (CheckoutFoodItem item : request.getFnb()) {

        FoodBeverage food = foodRepository
                .findById(item.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food not found"));

        grossAmount = grossAmount.add(
                food.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                )
        );
    }
}



    Order1 order = new Order1();

    order.setOrderCode("ORDER-" + System.currentTimeMillis());
    order.setCreatedDate(LocalDateTime.now());

    order.setGrossAmount(grossAmount);
    order.setFinalAmount(request.getTotalMoney());

    order.setOrderStatus("COMPLETED");
    order.setPaymentMethod(request.getPaymentMethod());
    order.setPaymentStatus("SUCCESS");

    order.setCustomer(customer);
    order.setShowtime(showtime);

    if (request.getVoucherCode() != null &&
            !request.getVoucherCode().isBlank()) {

        Voucher voucher = voucherRepository
                .findByVoucherCode(request.getVoucherCode())
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        order.setVoucher(voucher);
    }
System.out.println("SAVE ORDER");
    order = orderRepository.save(order);
System.out.println("ORDER ID = " + order.getOrderId());
    // =========================
    // Tạo Ticket + OrderDetail
    // =========================
    for (String seatCode : request.getSeats()) {

        String row = seatCode.substring(0, 1);
        Integer number = Integer.parseInt(seatCode.substring(1));

        Seat seat = seatRepository
                .findByRoomIdAndSeatRowAndSeatNumber(
                        showtime.getRoomId(),
                        row,
                        number)
                .orElseThrow(() -> new RuntimeException("Seat not found: " + seatCode));

        Ticket ticket = new Ticket();

        ticket.setOrder(order);
        ticket.setSeatId(seat.getSeatId());
        ticket.setShowtimeId(showtime.getShowtimeId());

        ticket.setTicketStatus("SOLD");

        String code = "TICKET-" + System.currentTimeMillis() + "-" + seatCode;

        ticket.setTicketCode(code);
        ticket.setQrCode(code);

        ticket = ticketRepository.save(ticket);

        OrderDetail detail = new OrderDetail();

        detail.setOrder(order);
        detail.setTicket(ticket);

        detail.setQuantity(1);

        detail.setSubtotal(showtime.getTicketPrice());

        orderDetailRepository.save(detail);
    }
System.out.println("SAVE TICKET OK");
// =========================
// Tạo OrderDetail cho F&B
// =========================
if (request.getFnb() != null && !request.getFnb().isEmpty()) {

    for (CheckoutFoodItem item : request.getFnb()) {

        FoodBeverage food = foodRepository
                .findById(item.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food not found"));

        // Kiểm tra tồn kho
        if (food.getStockQuantity() < item.getQuantity()) {
            throw new RuntimeException(
                    food.getItemName() + " không đủ số lượng trong kho");
        }

        // Tạo OrderDetail cho món ăn
        OrderDetail detail = new OrderDetail();

        detail.setOrder(order);

        detail.setFoodItem(food);

        detail.setQuantity(item.getQuantity());

        detail.setSubtotal(
                food.getPrice().multiply(
                        BigDecimal.valueOf(item.getQuantity())
                )
        );

        orderDetailRepository.save(detail);

        // Trừ tồn kho
        food.setStockQuantity(
                food.getStockQuantity() - item.getQuantity());

        foodRepository.save(food);
    }
}


    // =========================
    // Cập nhật Voucher
    // =========================
    if (request.getVoucherCode() != null &&
            !request.getVoucherCode().isBlank()) {

        voucherService.useVoucher(request.getVoucherCode());
    }

    // =========================
    // Tạo PaymentTransaction
    // =========================
    PaymentTransaction payment = new PaymentTransaction();

    payment.setTransactionCode("PAY-" + System.currentTimeMillis());

    payment.setAmount(order.getFinalAmount());

    payment.setPaymentStatus("SUCCESS");

    payment.setOrder(order);
System.out.println("SAVE PAYMENT");
    paymentTransactionRepository.save(payment);
System.out.println("DONE");
    return order;
}
}

