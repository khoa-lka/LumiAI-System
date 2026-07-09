package com.cinema.backend.repositories;

import com.cinema.backend.entities.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.repository.query.Param;
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {

    // Hàm này cực kỳ quan trọng: Lấy tất cả feedback theo ID phim
    // Spring Data JPA sẽ tự động tạo câu SQL dựa trên tên hàm này!
    List<Feedback> findByMovieId(Integer movieId);

    @Query(value = """
            SELECT
            f.feedback_id,
            f.title,
            f.content,
            f.rating_stars,
            f.movie_id,
            f.account_staff_id,
            f.created_at,
            a.fullname
            FROM feedback f
            JOIN Account a
            ON f.account_staff_id = a.account_id
            WHERE f.movie_id = :movieId
            ORDER BY f.created_at DESC
            """, nativeQuery = true)
  List<Object[]> getFeedbackWithUser(
    @Param("movieId") Integer movieId
);
}