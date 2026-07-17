package com.cinema.backend.repositories;

import com.cinema.backend.entities.Feedback;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {

    // Lấy feedback theo phim
    List<Feedback> findByMovieId(Integer movieId);

    // Lấy tất cả feedback sắp xếp mới nhất
    List<Feedback> findAll(Sort sort);

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
            LEFT JOIN Account a
                ON f.account_staff_id = a.account_id
            WHERE f.movie_id = :movieId
            ORDER BY f.created_at DESC
            """, nativeQuery = true)
    List<Object[]> getFeedbackWithUser(
            @Param("movieId") Integer movieId);
@Query("""
    SELECT AVG(f.ratingStars)
    FROM Feedback f
    WHERE f.movieId = :movieId
""")
Double getAverageRating(@Param("movieId") Integer movieId);
}
