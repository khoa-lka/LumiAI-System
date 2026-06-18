package com.cinema.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
    // JpaRepository cung cấp sẵn các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()...
    // Bạn có thể thêm các phương thức tùy chỉnh nếu cần, ví dụ:
    // List<Event> findByMovieId(Long movieId);
    
}
