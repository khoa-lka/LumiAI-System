package com.cinema.backend.repositories;

import com.cinema.backend.entities.WebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookLogRepository
        extends JpaRepository<WebhookLog, Long> {

    List<WebhookLog> findAllByOrderByIdDesc();
}