package com.cinema.backend.controllers;
import java.util.HashMap;
import java.util.Map;
import java.util.HashMap;
import java.util.Map;
import com.cinema.backend.entities.AccountNotification;
import com.cinema.backend.repositories.AccountNotificationRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import com.cinema.backend.entities.Account;
import com.cinema.backend.entities.SysLogDTO;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.SysLogRepository;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
@RestController // Thay vì @RestControlleradmin
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")

public class AdminController {

    @Autowired
    private AccountRepository accountRepository; // Sử dụng AccountRepository đã có của bạn

    @Autowired
    private SysLogRepository sysLogRepository; // Sử dụng SysLogRepository vừa tạo ở trên
@Autowired
private AccountNotificationRepository notificationRepository;
    @GetMapping("/users")
public List<Map<String, Object>> getAllUsers() {
    return accountRepository.findAll()
            .stream()
            .map(account -> {
                Map<String, Object> user = new LinkedHashMap<>();

                user.put("accountId", account.getAccountId());
                user.put("email", account.getEmail());
                user.put("roleId", account.getRoleId());
                user.put("status", account.getStatus());

                return user;
            })
            .collect(Collectors.toList());
}
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
@PutMapping("/users/update-role/{userId}")
public ResponseEntity<?> updateRole(
        @PathVariable Integer userId,
        @RequestBody Integer newRoleId
) {
    Account account = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

    // Chỉ cho phép những role đang tồn tại trong hệ thống
    if (newRoleId == null || newRoleId < 1 || newRoleId > 4) {
        return ResponseEntity.badRequest().body(
                Map.of("message", "Quyền được chọn không hợp lệ")
        );
    }

    Integer oldRoleId = account.getRoleId();

    // Không thực hiện cập nhật nếu quyền không thay đổi
    if (oldRoleId != null && oldRoleId.equals(newRoleId)) {
        return ResponseEntity.badRequest().body(
                Map.of("message", "Tài khoản đang có quyền này")
        );
    }

    String oldRoleName = getRoleName(oldRoleId);
    String newRoleName = getRoleName(newRoleId);

    // 1. Cập nhật quyền tài khoản
    account.setRoleId(newRoleId);
    accountRepository.save(account);

    // 2. Tạo thông báo dành cho chính chủ tài khoản
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

    // 3. Ghi log hệ thống
    SysLogDTO log = new SysLogDTO();
    log.setTime(LocalDateTime.now());
    log.setAction(
            "CẬP_NHẬT_QUYỀN_ID_"
                    + userId
                    + "_TỪ_"
                    + oldRoleId
                    + "_SANG_"
                    + newRoleId
    );
    log.setUser("admin");
    log.setStatus("SUCCESS");

    sysLogRepository.save(log);

    // 4. Trả dữ liệu JSON cho admin.js
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

@PutMapping("/users/ban/{userId}")
public ResponseEntity<?> banUser(@PathVariable Integer userId) {
    Account account = accountRepository.findById(userId)
            .orElseThrow(() ->
                    new RuntimeException("Không tìm thấy người dùng")
            );

    String oldStatus = account.getStatus();

    String newStatus =
            "Active".equals(oldStatus)
                    ? "Banned"
                    : "Active";

    account.setStatus(newStatus);
    accountRepository.save(account);

    SysLogDTO log = new SysLogDTO();
    log.setTime(LocalDateTime.now());

    if ("Banned".equals(newStatus)) {
        log.setAction("KHÓA_TÀI_KHOẢN_ID_" + userId);
    } else {
        log.setAction("MỞ_KHÓA_TÀI_KHOẢN_ID_" + userId);
    }

    log.setUser("admin");
    log.setStatus("SUCCESS");

    sysLogRepository.save(log);

    // Trả JSON cho JavaScript
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
    @GetMapping("/syslogs")
    public List<SysLogDTO> getSysLogs() {
        // Lấy toàn bộ log hệ thống từ database trả về cho file admin.js
        return sysLogRepository.findAll();
    }

}