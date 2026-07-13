package com.cinema.backend.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.cinema.backend.entities.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    // JpaRepository cung cấp sẵn các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()...

    // Dùng cho Máy POS (Staff): lấy phim theo trạng thái (VD: 'now_showing')
    List<Movie> findByStatus(String status);

    List<Movie> findByGenre(String genre);
}