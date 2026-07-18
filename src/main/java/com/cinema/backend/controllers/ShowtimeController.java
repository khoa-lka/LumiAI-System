package com.cinema.backend.controllers;

import com.cinema.backend.entities.Showtime;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.service.ShowtimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

    @Autowired
    private ShowtimeService showtimeService;

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
            map.put("status", st.getStatus() != null ? st.getStatus() : "ACTIVE"); // 🌟 ĐÃ THÊM: Trả status về ma trận UI
            
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
   // 🚀 API Hứng yêu cầu POST từ Front-End (Đã được Refactor gọn gàng)
    @PostMapping("/add")
    public ResponseEntity<?> addShowtime(@RequestBody Map<String, Object> payload) {
        try {
            // Đẩy toàn bộ trách nhiệm phân tích dữ liệu và kiểm tra trùng lịch xuống Service
            Showtime savedShowtime = showtimeService.addShowtime(payload);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Xếp lịch suất chiếu mới thành công!",
                "showtimeId", savedShowtime.getShowtimeId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            // Đổi thành badRequest để trả về HTTP 400 kèm câu thông báo lỗi cho Front-End
            return ResponseEntity.badRequest().body(Map.of( 
                "status", "error",
                "message", e.getMessage() // Sẽ in ra câu báo lỗi "XUNG ĐỘT LỊCH CHIẾU!" từ Service
            ));
        }
    }

    // 🚀 API Sửa suất chiếu: Nhận lệnh PUT và gọi qua tầng Service xử lý bài bản
    // (có kiểm tra xung đột lịch/phòng chiếu ở tầng Service trước khi lưu)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateShowtime(@PathVariable("id") Integer id, @RequestBody Map<String, Object> payload) {
        try {
            showtimeService.updateShowtime(id, payload);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đã cập nhật dữ liệu suất chiếu qua Service thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "status", "error",
                "message", "Cập nhật suất chiếu thất bại: " + e.getMessage()
            ));
        }
    }

    // 🌟 THÊM MỚI: API dành riêng cho Customer Front-End (Chỉ lấy suất chiếu ACTIVE)
    @GetMapping("/customer")
    public ResponseEntity<?> getShowtimesForCustomer(
            @RequestParam("movieId") Long movieId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Showtime> showtimes = showtimeRepository.findActiveShowtimesForCustomer(movieId, startOfDay, endOfDay);

        List<Map<String, Object>> resultList = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (Showtime st : showtimes) {
            Map<String, Object> map = new HashMap<>();
            map.put("showtimeId", st.getShowtimeId());
            map.put("startTime", st.getStartTime().format(timeFormatter));
            map.put("endTime", st.getEndTime().format(timeFormatter));
            map.put("ticketPrice", st.getTicketPrice());
            map.put("roomId", st.getRoomId());
            map.put("status", "ACTIVE");

            resultList.add(map);
        }

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "movieId", movieId,
            "selectedDate", date.toString(),
            "showtimes", resultList
        ));
    }

    // 🚀 API Xóa suất chiếu: Nhận lệnh DELETE chọc thẳng xuống SQL Server để xóa vật lý
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable("id") Integer id) {
        try {
            if (!showtimeRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", "Không tìm thấy suất chiếu mang ID: " + id
                ));
            }

            showtimeRepository.deleteById(id);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Hệ thống đã gỡ bỏ suất chiếu khỏi cơ sở dữ liệu thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Không thể xóa suất chiếu (Có thể vé đã được khách đặt mua): " + e.getMessage()
            ));
        }
    }
}