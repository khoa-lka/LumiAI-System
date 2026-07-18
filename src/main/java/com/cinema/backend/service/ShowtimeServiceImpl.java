package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.repositories.ShowtimeRepository;

@Service
public class ShowtimeServiceImpl implements ShowtimeService {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    // ==========================================================================
    // HÀM HELPER: KIỂM TRA TRÙNG LỊCH (DRY - Dùng chung cho cả Add và Update)
    // ==========================================================================
    private void validateOverlappingShowtime(Integer excludeShowtimeId, Integer roomId, LocalDateTime newStart, LocalDateTime newEnd) {
        java.util.List<Showtime> existingShowtimes = showtimeRepository.findAll();
        
        for (Showtime existing : existingShowtimes) {
            // Khi tạo mới (excludeShowtimeId = null), bỏ qua điều kiện so sánh ID.
            // Khi update, bỏ qua chính suất chiếu đang được sửa.
            boolean isSameShowtime = excludeShowtimeId != null && existing.getShowtimeId().equals(excludeShowtimeId);
            
            if (!isSameShowtime && existing.getRoomId().equals(roomId)) {
                LocalDateTime existStart = existing.getStartTime();
                LocalDateTime existEnd = existing.getEndTime();
                
                // Thuật toán giao thoa thời gian (Overlap Detector)
                if (newStart.isBefore(existEnd) && newEnd.isAfter(existStart)) {
                    throw new RuntimeException("XUNG ĐỘT LỊCH CHIẾU! Khung giờ bị trùng với suất chiếu ID: " 
                            + existing.getShowtimeId() + " tại Phòng " + roomId);
                }
            }
        }
    }

    // ==========================================================================
    // 🚀 HÀM MỚI BỔ SUNG: Chuyển logic từ Controller xuống tầng Service
    // ==========================================================================
    @Override
    @Transactional
    public Showtime addShowtime(Map<String, Object> payload) {
        Showtime newShowtime = new Showtime();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        // 1. Map các trường dữ liệu
        if (payload.containsKey("movie")) {
            Map<String, Object> movieMap = (Map<String, Object>) payload.get("movie");
            Long movieId = Long.valueOf(movieMap.get("movieId").toString());
            com.cinema.backend.entities.Movie movie = new com.cinema.backend.entities.Movie();
            movie.setMovieId(movieId);
            newShowtime.setMovie(movie);
        } else {
            throw new RuntimeException("Thiếu thông tin bộ phim!");
        }

        newShowtime.setRoomId(Integer.valueOf(payload.get("roomId").toString()));
        newShowtime.setCreatedBy(Integer.valueOf(payload.get("createdBy").toString()));
        newShowtime.setTicketPrice(new java.math.BigDecimal(payload.get("ticketPrice").toString()));
        
        LocalDateTime startTime = LocalDateTime.parse(payload.get("startTime").toString(), formatter);
        LocalDateTime endTime = LocalDateTime.parse(payload.get("endTime").toString(), formatter);
        newShowtime.setStartTime(startTime);
        newShowtime.setEndTime(endTime);

        if (payload.containsKey("status")) {
            newShowtime.setStatus(payload.get("status").toString().toUpperCase());
        } else {
            newShowtime.setStatus("ACTIVE");
        }

        // 2. Gọi hàm dùng chung để kiểm tra trùng lịch (truyền null vì tạo mới chưa có ID)
        validateOverlappingShowtime(null, newShowtime.getRoomId(), newShowtime.getStartTime(), newShowtime.getEndTime());

        // 3. Lưu xuống Database
        return showtimeRepository.save(newShowtime);
    }

    @Override
    @Transactional
    public Showtime updateShowtime(Integer id, Map<String, Object> payload) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại với id: " + id));

        if (payload.containsKey("roomId")) showtime.setRoomId(Integer.valueOf(payload.get("roomId").toString()));
        if (payload.containsKey("updatedBy")) showtime.setUpdatedBy(Integer.valueOf(payload.get("updatedBy").toString()));
        if (payload.containsKey("ticketPrice")) showtime.setTicketPrice(new java.math.BigDecimal(payload.get("ticketPrice").toString()));
        if (payload.containsKey("status")) showtime.setStatus(payload.get("status").toString().toUpperCase()); 

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        if (payload.containsKey("startTime")) showtime.setStartTime(LocalDateTime.parse(payload.get("startTime").toString(), formatter));
        if (payload.containsKey("endTime")) showtime.setEndTime(LocalDateTime.parse(payload.get("endTime").toString(), formatter));

        // Gọi hàm dùng chung để kiểm tra trùng lịch (truyền ID hiện tại để loại trừ chính nó)
        validateOverlappingShowtime(id, showtime.getRoomId(), showtime.getStartTime(), showtime.getEndTime());

        return showtimeRepository.save(showtime);
    }
}