package com.cinema.backend.repositories;

import com.cinema.backend.entities.AccountNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountNotificationRepository
        extends JpaRepository<AccountNotification, Integer> {

    List<AccountNotification> findByAccountIdAndIsReadFalseOrderByCreatedAtDesc(Integer accountId);
}