package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/login")
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @PostMapping("/login")
    public ResponseEntity<?> handleLogin(@RequestBody Map<String, String> loginRequest) {
        String identifier = loginRequest.get("identifier"); 
        String password = loginRequest.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Vui lòng nhập đầy đủ tài khoản và mật khẩu!"
            ));
        }

        // Tìm tài khoản theo Email hoặc Số điện thoại
        Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(identifier, identifier);

        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "fail",
                "message", "Tài khoản (Email/Số điện thoại) không tồn tại!"
            ));
        }

        Account account = accountOpt.get();
if ("Banned".equalsIgnoreCase(account.getStatus())) {
    return ResponseEntity.status(403).body(Map.of(
        "status", "fail",
        "message", "Tài khoản của bạn đã bị khóa bởi Quản trị viên!"
    ));
}
        // So sánh mật khẩu thô trực tiếp
        if (!account.getPasswordHash().equals(password)) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "fail",
                "message", "Mật khẩu không chính xác!"
            ));
        }

        // Trả về đúng cấu trúc thông tin của Gia Vy để hiển thị lên UI Front-End
        return ResponseEntity.ok(Map.of(
    "status", "success",
    "message", "Đăng nhập thành công!",
    "data", Map.of(
        "accountId", account.getAccountId(),
        "fullName", account.getFullname(),
        "email", account.getEmail(),
        "phoneNumber", account.getPhone(),
        "roleId", account.getRoleId(), // 🚀 1: ADMIN, 2: STAFF, 3: CUSTOMER
        "token", "generated-jwt-token-string"
    )
));
    }
}
