package com.cinema.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.cinema.backend.entities.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    // JpaRepository cung cấp sẵn các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()...
    // Bạn có thể thêm các phương thức tùy chỉnh nếu cần, ví dụ:
    // List<Movie> findByGenre(String genre);
    
}
