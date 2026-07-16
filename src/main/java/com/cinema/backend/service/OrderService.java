package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinema.backend.dto.FoodItemDTO;
import com.cinema.backend.dto.MovieHistoryDTO;
import com.cinema.backend.dto.OrderHistoryDTO;
import com.cinema.backend.dto.ShowtimeHistoryDTO;
import com.cinema.backend.entities.Order1;
import com.cinema.backend.entities.OrderDetail;
import com.cinema.backend.entities.Seat;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Ticket;
import com.cinema.backend.repositories.OrderDetailRepository;
import com.cinema.backend.repositories.OrderRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    // BO SUNG: getHistory() giờ trả về DTO an toàn (ShowtimeHistoryDTO/MovieHistoryDTO)
    // thay vì trả thẳng Hibernate Entity (Showtime) như trước - tránh rủi ro lazy-loading
    // proxy / vòng lặp serialization khi Jackson chuyển đối tượng sang JSON.
    // ticket.getSeat() lấy trực tiếp từ quan hệ object mới của Ticket, không cần
    // gọi lại SeatRepository.findById() như bản cũ.
    @Transactional(readOnly = true)
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

            List<String> seats = new ArrayList<>();
            List<FoodItemDTO> foods = new ArrayList<>();

            Showtime historyShowtime = null;
            String databaseTicketStatus = null;

            List<OrderDetail> details =
                    orderDetailRepository.findByOrderOrderId(order.getOrderId());

            for (OrderDetail detail : details) {

                if (detail.getTicket() != null) {

                    Ticket ticket = detail.getTicket();

                    if (historyShowtime == null && ticket.getShowtime() != null) {
                        historyShowtime = ticket.getShowtime();
                    }

                    if (databaseTicketStatus == null) {
                        databaseTicketStatus = ticket.getTicketStatus();
                    }

                    Seat seat = ticket.getSeat();

                    if (seat != null) {
                        String seatLabel = seat.getSeatRow() + seat.getSeatNumber();
                        if (!seats.contains(seatLabel)) {
                            seats.add(seatLabel);
                        }
                    }
                }

                if (detail.getFoodItem() != null) {

                    FoodItemDTO food = new FoodItemDTO();
                    food.setName(detail.getFoodItem().getItemName());
                    food.setQty(detail.getQuantity() == null ? 0 : detail.getQuantity());

                    foods.add(food);
                }
            }

            // Map Showtime Entity sang ShowtimeHistoryDTO - không trả Hibernate Entity trực tiếp.
            ShowtimeHistoryDTO showtimeDTO = mapShowtime(historyShowtime);

            dto.setShowtime(showtimeDTO);
            dto.setSeats(seats);
            dto.setFnb(foods);

            if (historyShowtime != null) {
                dto.setTicketStatus(calculateTicketStatus(historyShowtime));
            } else if (databaseTicketStatus != null) {
                dto.setTicketStatus(databaseTicketStatus);
            } else {
                dto.setTicketStatus("Không xác định");
            }

            result.add(dto);
        }

        return result;
    }

    private ShowtimeHistoryDTO mapShowtime(Showtime showtime) {

        if (showtime == null) {
            return null;
        }

        MovieHistoryDTO movieDTO = null;

        if (showtime.getMovie() != null) {
            movieDTO = new MovieHistoryDTO();
            movieDTO.setMovieId(showtime.getMovie().getMovieId());
            movieDTO.setTitle(showtime.getMovie().getTitle());
            movieDTO.setGenre(showtime.getMovie().getGenre());
            movieDTO.setDuration(showtime.getMovie().getDuration());
            movieDTO.setMainposterUrl(showtime.getMovie().getMainposterUrl());
        }

        ShowtimeHistoryDTO dto = new ShowtimeHistoryDTO();

        dto.setShowtimeId(showtime.getShowtimeId());
        dto.setStartTime(showtime.getStartTime());
        dto.setEndTime(showtime.getEndTime());
        dto.setTicketPrice(showtime.getTicketPrice());
        dto.setRoomId(showtime.getRoomId());
        dto.setMovie(movieDTO);

        return dto;
    }

    private String calculateTicketStatus(Showtime showtime) {

        if (showtime == null) {
            return "Không xác định";
        }

        LocalDateTime now = LocalDateTime.now();

        if (showtime.getEndTime() != null && now.isAfter(showtime.getEndTime())) {
            return "Đã sử dụng";
        }

        if (showtime.getStartTime() != null && now.isAfter(showtime.getStartTime())) {
            return "Đang chiếu";
        }

        return "Sắp chiếu";
    }
}