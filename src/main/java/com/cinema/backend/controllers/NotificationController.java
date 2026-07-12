package com.cinema.backend.controllers;

import com.cinema.backend.entities.AccountNotification;
import com.cinema.backend.repositories.AccountNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private AccountNotificationRepository notificationRepository;

    @GetMapping("/unread/{accountId}")
    public List<AccountNotification> getUnreadNotifications(
            @PathVariable Integer accountId
    ) {
        return notificationRepository
                .findByAccountIdAndIsReadFalseOrderByCreatedAtDesc(accountId);
    }

    @PutMapping("/read/{notificationId}")
    public AccountNotification markAsRead(
            @PathVariable Integer notificationId
    ) {
        AccountNotification noti = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));

        noti.setIsRead(true);

        return notificationRepository.save(noti);
    }
}