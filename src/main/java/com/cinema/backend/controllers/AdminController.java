package com.cinema.backend.controllers;

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

@RestController // Thay vì @RestControlleradmin
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")

public class AdminController {

    @Autowired
    private AccountRepository accountRepository; // Sử dụng AccountRepository đã có của bạn

    @Autowired
    private SysLogRepository sysLogRepository; // Sử dụng SysLogRepository vừa tạo ở trên

    @GetMapping("/users")
    public List<Account> getAllUsers() {
        // Lấy toàn bộ danh sách tài khoản từ database trả về cho file admin.js
        return accountRepository.findAll(); 
    }
@PutMapping("/users/update-role/{userId}")
public ResponseEntity<?> updateRole(@PathVariable Integer userId, @RequestBody Integer newRoleId) {
    Account account = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    account.setRoleId(newRoleId);
    accountRepository.save(account);
    SysLogDTO log = new SysLogDTO();
    log.setTime(LocalDateTime.now());
    log.setAction("CẬP NHẬT_QUYỀN_ID_" + userId);
    log.setUser("admin"); // Hoặc lấy từ Session của bạn
    log.setStatus("SUCCESS");
    sysLogRepository.save(log);
    return ResponseEntity.ok("Cập nhật quyền thành công!");
}

@PutMapping("/users/ban/{userId}")
public ResponseEntity<?> banUser(@PathVariable Integer userId) {
    Account account = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    
    // Đảo ngược trạng thái
    String newStatus = "Active".equals(account.getStatus()) ? "Banned" : "Active";
    account.setStatus(newStatus);
    accountRepository.save(account);
    //ghi logs
    SysLogDTO log = new SysLogDTO();
    log.setTime(LocalDateTime.now());
    log.setAction("KHÓA_TÀI_KHOẢN_ID_" + userId);
    log.setUser("admin"); // Hoặc lấy từ Session của bạn
    log.setStatus("SUCCESS");
    sysLogRepository.save(log);
    return ResponseEntity.ok("Trạng thái tài khoản đã được cập nhật thành: " + newStatus);
}
    @GetMapping("/syslogs")
    public List<SysLogDTO> getSysLogs() {
        // Lấy toàn bộ log hệ thống từ database trả về cho file admin.js
        return sysLogRepository.findAll();
    }

}