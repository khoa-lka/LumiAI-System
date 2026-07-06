package com.cinema.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.cinema.backend.repositories.MovieRepository;
import com.cinema.backend.entities.Movie;

@RestController 
@RequestMapping("/api/movies") 
@CrossOrigin(origins = "*") 
public class MovieController {

    @Autowired 
    private MovieRepository movieRepository;

    // 🚀 ĐÃ SỬA: Xóa "/sync-data" để khớp chuẩn xác với fetch("http://localhost:8080/api/movies")
    @GetMapping 
public List<Movie> getAllMovies() {
    // Trả về thẳng một mảng JSON dạng [ {id:1, title:...}, {id:2, ...} ]
    return movieRepository.findAll(); 
}

// 2. THÊM PHIM MỚI (INSERT INTO SQL)
    @PostMapping("/add")
    public Movie addMovie(@RequestBody Movie newMovie) {
        // Hàm .save() của JPA sẽ tự động dịch ra lệnh: 
        // INSERT INTO movie (title, genre, duration_minutes...) VALUES (...)
        return movieRepository.save(newMovie); 
    }

    // 3. CẬP NHẬT PHIM HIỆN TẠI (UPDATE SQL)
    @PutMapping("/update")
    public Movie updateMovie(@RequestBody Movie updatedMovie) {
        // 1. Tìm xem phim đó có trong SQL chưa dựa vào movie_id
        Movie existingMovie = movieRepository.findById(updatedMovie.getMovieId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phim có ID: " + updatedMovie.getMovieId()));

        // 2. Lấy dữ liệu mới đè lên dữ liệu cũ (Dựa theo chuẩn file cinema_db1.sql của em)
        existingMovie.setTitle(updatedMovie.getTitle());
        existingMovie.setGenre(updatedMovie.getGenre());
        existingMovie.setDuration(updatedMovie.getDuration());
        existingMovie.setSynopsis(updatedMovie.getSynopsis());
        
        // Link hình ảnh (Poster)
        existingMovie.setMainposterUrl(updatedMovie.getMainposterUrl());
        existingMovie.setSubposterUrl(updatedMovie.getSubposterUrl());
        
        // Thông tin công chiếu & phân loại
        existingMovie.setReleaseDate(updatedMovie.getReleaseDate());
        existingMovie.setAgeRating(updatedMovie.getAgeRating());
        existingMovie.setRating(updatedMovie.getRating());
        existingMovie.setStatus(updatedMovie.getStatus());
        
        // Ekip làm phim
        existingMovie.setPerformer(updatedMovie.getPerformer());
        existingMovie.setDirector(updatedMovie.getDirector());
        existingMovie.setCountry(updatedMovie.getCountry());

        // Cập nhật ID của người vừa chỉnh sửa (updated_by) nếu có gửi từ Frontend lên
        if (updatedMovie.getUpdatedBy() != null) {
            existingMovie.setUpdatedBy(updatedMovie.getUpdatedBy());
        }

        // 3. Hàm .save() lúc này vì đối tượng existingMovie đã có ID nên nó sẽ tự dịch ra lệnh:
        // UPDATE movie SET title = ?, genre = ?, ... WHERE movie_id = ?
        return movieRepository.save(existingMovie);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        try {
            // 1. Kiểm tra bộ phim có tồn tại trong Database không
            if (!movieRepository.existsById(id)) {
                response.put("message", "Không tìm thấy phim mang ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // 2. Tiến hành xóa phim bằng Spring Data JPA
            movieRepository.deleteById(id);
            
            // 3. Trả về Object JSON {"message": "..."} cho Frontend parse dữ liệu mượt mà
            response.put("message", "Xóa phim thành công!");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Trường hợp lỗi hoặc dính khóa ngoại (Foreign Key) do phim đã được xếp lịch chiếu
            response.put("message", "Không thể xóa phim này do lỗi hệ thống hoặc phim đang có lịch chiếu tồn tại!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}