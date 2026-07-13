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

    @Override
    @Transactional
    public Showtime updateShowtime(Integer id, Map<String, Object> payload) {
        // 1. Tìm suất chiếu gốc dưới SQL Server
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại với id: " + id));

        // 2. Cập nhật các trường cơ bản từ Front-End gửi lên
        if (payload.containsKey("roomId")) {
            showtime.setRoomId(Integer.valueOf(payload.get("roomId").toString()));
        }
        if (payload.containsKey("updatedBy")) {
            showtime.setUpdatedBy(Integer.valueOf(payload.get("updatedBy").toString()));
        }
        if (payload.containsKey("ticketPrice")) {
            showtime.setTicketPrice(new java.math.BigDecimal(payload.get("ticketPrice").toString()));
        }
        if (payload.containsKey("status")) {
            showtime.setStatus(payload.get("status").toString().toUpperCase()); // Cập nhật ACTIVE/INACTIVE/HIDDEN
        }

        // 3. Phân rã và định dạng lại thời gian LocalDateTime nếu Manager thay đổi giờ trên ma trận
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        if (payload.containsKey("startTime")) {
            showtime.setStartTime(LocalDateTime.parse(payload.get("startTime").toString(), formatter));
        }
        if (payload.containsKey("endTime")) {
            showtime.setEndTime(LocalDateTime.parse(payload.get("endTime").toString(), formatter));
        }
        // ==========================================================================
        // 🌟 BƯỚC 3.5: CHỐT CHẶN BACKEND - Kiểm tra trùng lịch/phòng chiếu dưới SQL Server
        // ==========================================================================
        
        // 1. Lấy tất cả các suất chiếu đang có của bộ phim này trong ngày (hoặc lấy toàn bộ suất chiếu để check trùng phòng)
        // Để chặt chẽ nhất, ta quét xem trong phòng chiếu đó, vào ngày đó, có ai sở hữu khung giờ giao thoa không
        java.util.List<Showtime> existingShowtimes = showtimeRepository.findAll();
        
        for (Showtime existing : existingShowtimes) {
            // Chỉ so sánh với các suất chiếu KHÁC (bỏ qua chính nó đang sửa) và phải trùng PHÒNG CHIẾU
            if (!existing.getShowtimeId().equals(id) && existing.getRoomId().equals(showtime.getRoomId())) {
                
                LocalDateTime newStart = showtime.getStartTime();
                LocalDateTime newEnd = showtime.getEndTime();
                LocalDateTime existStart = existing.getStartTime();
                LocalDateTime existEnd = existing.getEndTime();
                
                // Thuật toán giao thoa thời gian (Overlap Detector)
                // Nếu Thời gian bắt đầu mới < Thời gian kết thúc cũ VÀ Thời gian kết thúc mới > Thời gian bắt đầu cũ
                if (newStart.isBefore(existEnd) && newEnd.isAfter(existStart)) {
                    throw new RuntimeException("XUNG ĐỘT LỊCH CHIẾU! Khung giờ chỉnh sửa bị trùng với suất chiếu ID: " 
                            + existing.getShowtimeId() + " tại Phòng " + showtime.getRoomId());
                }
            }
        }
        // 4. Ghi đè cập nhật xuống SQL Server qua Repository
        return showtimeRepository.save(showtime);
    }
}