package com.cinema.backend.controllers;
import com.cinema.backend.service.DatabaseBackupService;
import com.cinema.backend.entities.Account;
import com.cinema.backend.entities.AccountNotification;
import com.cinema.backend.entities.SysLogDTO;
import com.cinema.backend.repositories.AccountNotificationRepository;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.SysLogRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.cinema.backend.entities.WebhookLog;
import com.cinema.backend.repositories.WebhookLogRepository;
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private SysLogRepository sysLogRepository;

    @Autowired
    private AccountNotificationRepository notificationRepository;

@Autowired
private WebhookLogRepository webhookLogRepository;
@Autowired
private DatabaseBackupService databaseBackupService;
    // =========================================================
    // 1. LẤY DANH SÁCH TÀI KHOẢN
    // =========================================================

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {

        return accountRepository.findAll()
                .stream()
                .map(account -> {

                    Map<String, Object> user = new LinkedHashMap<>();

                   user.put("accountId", account.getAccountId());
user.put("fullname", account.getFullname());
user.put("email", account.getEmail());
user.put("roleId", account.getRoleId());
user.put("status", account.getStatus());
user.put("createdDate", account.getCreatedDate());

                    return user;
                })
                .collect(Collectors.toList());
    }


    // =========================================================
    // 2. LẤY TÊN QUYỀN TỪ ROLE ID
    // =========================================================

    private String getRoleName(Integer roleId) {

        if (roleId == null) {
            return "Không xác định";
        }

        return switch (roleId) {
            case 1 -> "Quản lý (MANAGER)";
            case 2 -> "Nhân viên (STAFF)";
            case 3 -> "Khách hàng (MEMBER)";
            case 4 -> "Quản trị viên (ADMIN)";
            default -> "Không xác định";
        };
    }


    // =========================================================
    // 3. THAY ĐỔI QUYỀN TÀI KHOẢN
    // =========================================================

    @Transactional
    @PutMapping("/users/update-role/{userId}")
    public ResponseEntity<?> updateRole(
            @PathVariable Integer userId,
            @RequestBody Integer newRoleId,
            HttpServletRequest request
    ) {

        // Kiểm tra tài khoản có tồn tại hay không
        Account account = accountRepository.findById(userId).orElse(null);

        if (account == null) {
            return ResponseEntity.status(404).body(
                    Map.of(
                            "success", false,
                            "message", "Không tìm thấy người dùng"
                    )
            );
        }

        // Chỉ cho phép role ID từ 1 đến 4
        if (newRoleId == null || newRoleId < 1 || newRoleId > 4) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Quyền được chọn không hợp lệ"
                    )
            );
        }

        Integer oldRoleId = account.getRoleId();

        // Không cập nhật khi quyền mới giống quyền hiện tại
        if (oldRoleId != null && oldRoleId.equals(newRoleId)) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Tài khoản đang có quyền này"
                    )
            );
        }

        String oldRoleName = getRoleName(oldRoleId);
        String newRoleName = getRoleName(newRoleId);

        // -----------------------------------------------------
        // Cập nhật quyền tài khoản
        // -----------------------------------------------------

        account.setRoleId(newRoleId);
        accountRepository.save(account);

        // -----------------------------------------------------
        // Tạo thông báo cho tài khoản vừa bị đổi quyền
        // -----------------------------------------------------

        AccountNotification notification = new AccountNotification();

        notification.setAccountId(account.getAccountId());
        notification.setTitle("Thay đổi quyền tài khoản");
        notification.setMessage(
                "Tài khoản của bạn đã được thay đổi quyền từ "
                        + oldRoleName
                        + " sang "
                        + newRoleName
                        + "."
        );
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);

        // -----------------------------------------------------
        // Ghi log hệ thống
        // -----------------------------------------------------

        SysLogDTO log = new SysLogDTO();

        log.setTime(LocalDateTime.now());
        log.setLevel("warning");
        log.setAction("Thay đổi vai trò người dùng");
        log.setUser("admin");
        log.setIp(getClientIp(request));
        log.setDetail(
                "Thay đổi quyền tài khoản ID: "
                        + userId
                        + " từ "
                        + oldRoleName
                        + " sang "
                        + newRoleName
        );
        log.setStatus("SUCCESS");

        sysLogRepository.save(log);

        // -----------------------------------------------------
        // Trả JSON về admin.js
        // -----------------------------------------------------

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Cập nhật quyền thành công");
        response.put("accountId", account.getAccountId());
        response.put("oldRoleId", oldRoleId);
        response.put("newRoleId", newRoleId);
        response.put("oldRoleName", oldRoleName);
        response.put("newRoleName", newRoleName);

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // 4. KHÓA HOẶC MỞ KHÓA TÀI KHOẢN
    // =========================================================

    @Transactional
    @PutMapping("/users/ban/{userId}")
    public ResponseEntity<?> banUser(
            @PathVariable Integer userId,
            HttpServletRequest request
    ) {

        // Kiểm tra tài khoản có tồn tại hay không
        Account account = accountRepository.findById(userId).orElse(null);

        if (account == null) {
            return ResponseEntity.status(404).body(
                    Map.of(
                            "success", false,
                            "message", "Không tìm thấy người dùng"
                    )
            );
        }

        String oldStatus = account.getStatus();

        // Nếu đang Active thì khóa, ngược lại thì mở khóa
        String newStatus =
                "Active".equalsIgnoreCase(oldStatus)
                        ? "Banned"
                        : "Active";

        // -----------------------------------------------------
        // Cập nhật trạng thái tài khoản
        // -----------------------------------------------------

        account.setStatus(newStatus);
        accountRepository.save(account);

        // -----------------------------------------------------
        // Ghi log hệ thống
        // -----------------------------------------------------

        SysLogDTO log = new SysLogDTO();

        log.setTime(LocalDateTime.now());
        log.setLevel("warning");
        log.setUser("admin");
        log.setIp(getClientIp(request));
        log.setStatus("SUCCESS");

        if ("Banned".equals(newStatus)) {

            log.setAction("Khóa tài khoản người dùng");
            log.setDetail(
                    "Admin đã khóa tài khoản ID: "
                            + userId
                            + ", trạng thái từ "
                            + oldStatus
                            + " thành "
                            + newStatus
            );

        } else {

            log.setAction("Mở khóa tài khoản người dùng");
            log.setDetail(
                    "Admin đã mở khóa tài khoản ID: "
                            + userId
                            + ", trạng thái từ "
                            + oldStatus
                            + " thành "
                            + newStatus
            );
        }

        sysLogRepository.save(log);

        // -----------------------------------------------------
        // Trả JSON về admin.js
        // -----------------------------------------------------

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("accountId", account.getAccountId());
        response.put("oldStatus", oldStatus);
        response.put("status", newStatus);

        if ("Banned".equals(newStatus)) {
            response.put("message", "Khóa tài khoản thành công");
        } else {
            response.put("message", "Mở khóa tài khoản thành công");
        }

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // 5. LẤY DANH SÁCH LOG HỆ THỐNG
    // =========================================================

    @GetMapping("/syslogs")
    public List<SysLogDTO> getSysLogs() {

        // Lấy log mới nhất lên đầu
        return sysLogRepository.findAllByOrderByIdDesc();
    }


    // =========================================================
    // 6. LẤY ĐỊA CHỈ IP CỦA NGƯỜI GỬI REQUEST
    // =========================================================

    private String getClientIp(HttpServletRequest request) {

        String forwardedIp = request.getHeader("X-Forwarded-For");

        if (forwardedIp != null && !forwardedIp.isBlank()) {
            return forwardedIp.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
    @GetMapping("/webhooks")
public List<WebhookLog> getWebhookLogs() {
    return webhookLogRepository.findAllByOrderByIdDesc();
}
// =========================================================
// LẤY DANH SÁCH BACKUP
// =========================================================

@GetMapping("/backups")
public ResponseEntity<?> getDatabaseBackups() {

    try {
        return ResponseEntity.ok(
                databaseBackupService.getAllBackups()
        );
    } catch (Exception exception) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "message",
                        "Không thể lấy danh sách backup: "
                                + exception.getMessage()
                )
        );
    }
}


// =========================================================
// TẠO BACKUP THỦ CÔNG
// =========================================================

@PostMapping("/backups")
public ResponseEntity<?> createDatabaseBackup() {

    try {
        Map<String, Object> backup =
                databaseBackupService.createManualBackup();

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Tạo bản sao lưu thành công",
                        "backup", backup
                )
        );
    } catch (Exception exception) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message",
                        "Không thể tạo backup: "
                                + exception.getMessage()
                )
        );
    }
}


// =========================================================
// PHỤC HỒI DATABASE
// =========================================================

@PostMapping("/backups/{fileName}/restore")
public ResponseEntity<?> restoreDatabaseBackup(
        @PathVariable String fileName
) {

    try {
        return ResponseEntity.ok(
                databaseBackupService.restoreBackup(fileName)
        );
    } catch (Exception exception) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message",
                        "Không thể phục hồi database: "
                                + exception.getMessage()
                )
        );
    }
}
}