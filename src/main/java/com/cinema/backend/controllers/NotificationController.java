package com.cinema.backend.controllers;
import com.cinema.backend.config.CurrentUser;
import org.springframework.http.ResponseEntity;
import com.cinema.backend.entities.AccountNotification;
import com.cinema.backend.repositories.AccountNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private AccountNotificationRepository notificationRepository;

    @GetMapping("/unread/{accountId}")
    public ResponseEntity<?> getUnreadNotifications(@PathVariable Integer accountId) {

        if (!CurrentUser.canAccess(accountId)) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Bạn không có quyền xem thông báo này!"
            ));
        }

        return ResponseEntity.ok(
            notificationRepository.findByAccountIdAndIsReadFalseOrderByCreatedAtDesc(accountId)
        );
    }

    @PutMapping("/read/{notificationId}")
    public ResponseEntity<?> markAsRead(@PathVariable Integer notificationId) {

        AccountNotification noti = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));

        if (!CurrentUser.canAccess(noti.getAccountId())) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Bạn không có quyền thao tác thông báo này!"
            ));
        }

        noti.setIsRead(true);

        return ResponseEntity.ok(notificationRepository.save(noti));
    }
}