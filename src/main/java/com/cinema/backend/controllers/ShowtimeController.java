package com.cinema.backend.controllers;

import com.cinema.backend.entities.Showtime;
import com.cinema.backend.repositories.ShowtimeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "*")
public class ShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @GetMapping("/matrix")
    public ResponseEntity<?> getShowtimeMatrix(
            @RequestParam("movieId") Long movieId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        // Tạo mốc bắt đầu lúc 00:00:00 và kết thúc lúc 23:59:59 của ngày xem lịch
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // Chọc xuống SQL Server lôi các suất chiếu thực tế lên
        List<Showtime> showtimes = showtimeRepository.findShowtimesByMovieAndDate(movieId, startOfDay, endOfDay);

        // Định dạng lại đầu ra JSON gọn gàng để đẩy lên UI Front-End
        List<Map<String, Object>> resultList = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (Showtime st : showtimes) {
            Map<String, Object> map = new HashMap<>();
            map.put("showtimeId", st.getShowtimeId());
            map.put("startTime", st.getStartTime().format(timeFormatter)); // Ra chữ "19:00", "20:30"
            map.put("endTime", st.getEndTime().format(timeFormatter));
            map.put("ticketPrice", st.getTicketPrice());
            map.put("roomId", st.getRoomId());
            
            resultList.add(map);
        }

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "movieId", movieId,
            "selectedDate", date.toString(),
            "showtimes", resultList
        ));
    }
}