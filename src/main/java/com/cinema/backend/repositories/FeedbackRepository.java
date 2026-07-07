package com.cinema.backend.repositories;

import com.cinema.backend.entities.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    // Chỉ cần để trống như thế này, Spring Boot đã tự động viết sẵn các lệnh SQL cho bạn rồi
}