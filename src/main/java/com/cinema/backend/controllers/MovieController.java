package com.cinema.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.cinema.backend.repositories.MovieRepository;

import com.cinema.backend.entities.Movie;





@RestController // Dán nhãn biến Class này thành trạm phát API xuất dữ liệu JSON
@RequestMapping("/api") // Cấu hình tiền tố đường dẫn gốc cho toàn bộ API
@CrossOrigin(origins = "*") // Mở cổng bảo mật CORS để Front-End của Vy gọi vào thoải mái không bị chặn
public class MovieController {
    @Autowired // Nhãn ra lệnh cho Spring tự động móc dây nối bộ máy Repository vào đây
    private MovieRepository movieRepository;

    @GetMapping("/sync-data") // Khi gõ http://localhost:8080/api/sync-data thì hàm này sẽ chạy
    public Map<String, Object> getSyncData() {
        
        // 1. Lấy toàn bộ danh sách phim từ SQL Server thông qua hàm có sẵn của JPA
        List<Movie> moviesList = movieRepository.findAll();

        // 2. Tạo cấu trúc Map bọc dữ liệu để ép Spring dịch sang đúng phom JSON mẫu Front-End đang dùng
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> innerData = new HashMap<>();
        
        innerData.put("movies", moviesList);
        // Tạm mồi dữ liệu showtimes và ghế trống giống hệt kịch bản cũ để Front-End không lỗi
        innerData.put("showtimes", List.of("19:00", "20:30", "22:00")); 
        innerData.put("masterSeatStore", new HashMap<>());

        response.put("type", "SYNC_DATA");
        response.put("data", innerData);

        return response; // Trả thẳng đối tượng Map về, Spring Boot tự động hóa hóa nó thành chuỗi JSON thô
    }
}
