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
    // 🚀 THÊM MỚI: API hứng yêu cầu POST từ Front-End để tạo suất chiếu và lưu xuống SQL Server
    @PostMapping("/add")
    public ResponseEntity<?> addShowtime(@RequestBody Map<String, Object> payload) {
        try {
            Showtime newShowtime = new Showtime();

            // 1. Phân rã dữ liệu từ object liên kết movie: { movie: { movieId: X } }
            if (payload.containsKey("movie")) {
                Map<String, Object> movieMap = (Map<String, Object>) payload.get("movie");
                Long movieId = Long.valueOf(movieMap.get("movieId").toString());
                
                com.cinema.backend.entities.Movie movie = new com.cinema.backend.entities.Movie();
                movie.setMovieId(movieId);
                newShowtime.setMovie(movie);
            } else {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Thiếu thông tin bộ phim!"));
            }

            // 2. Map các trường dữ liệu cơ bản cơ bản chuẩn kiểu dữ liệu
            newShowtime.setRoomId(Integer.valueOf(payload.get("roomId").toString()));
            newShowtime.setCreatedBy(Integer.valueOf(payload.get("createdBy").toString()));

            // 3. Ép kiểu an toàn từ số thực/chuỗi JavaScript sang BigDecimal của SQL Server
            java.math.BigDecimal price = new java.math.BigDecimal(payload.get("ticketPrice").toString());
            newShowtime.setTicketPrice(price);

            // 4. Định dạng chuỗi ISO "2026-06-20T19:00:00" ngược lại thành LocalDateTime trong Java
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            
            LocalDateTime startTime = LocalDateTime.parse(payload.get("startTime").toString(), formatter);
            LocalDateTime endTime = LocalDateTime.parse(payload.get("endTime").toString(), formatter);
            
            newShowtime.setStartTime(startTime);
            newShowtime.setEndTime(endTime);

            // 5. Lưu trực tiếp xuống Database qua JpaRepository
            Showtime savedShowtime = showtimeRepository.save(newShowtime);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Xếp lịch suất chiếu mới thành công!",
                "showtimeId", savedShowtime.getShowtimeId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Lỗi xử lý lưu suất chiếu hệ thống: " + e.getMessage()
            ));
        }
    }
}