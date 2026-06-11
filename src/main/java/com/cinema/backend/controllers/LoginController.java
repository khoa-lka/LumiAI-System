package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/login")
public class LoginController {

    @Autowired
    private AccountRepository accountRepository;

    @PostMapping("/login")
    public ResponseEntity<?> handleLogin(@RequestBody Map<String, String> loginRequest) {
        // Nhận thông tin đăng nhập (FE truyền email hoặc phone vào trường "identifier")
        String identifier = loginRequest.get("identifier"); 
        String password = loginRequest.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Vui lòng nhập đầy đủ tài khoản và mật khẩu!"
            ));
        }

        // 1. Tìm tài khoản trong DB bằng Email hoặc Số điện thoại
        Optional<Account> accountOpt = accountRepository.findByEmailOrPhoneNumber(identifier, identifier);

        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "fail",
                "message", "Tài khoản (Email/Số điện thoại) không tồn tại!"
            ));
        }

        Account account = accountOpt.get();

        // 2. Kiểm tra mật khẩu (So sánh chuỗi thô trực tiếp với password_hash để test kết nối DB)
        if (!account.getPasswordHash().equals(password)) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "fail",
                "message", "Mật khẩu không chính xác!"
            ));
        }

        // 3. Đăng nhập thành công -> Trả về JSON cho Front-End
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Đăng nhập thành công!",
            "data", Map.of(
                "accountId", account.getAccountId(),
                "fullName", account.getFullName(),
                "email", account.getEmail(),
                "phoneNumber", account.getPhoneNumber(),
                "token", "generated-jwt-token-string"
            )
        ));
    }
}