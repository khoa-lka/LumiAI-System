package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.cinema.backend.config.JwtUtil;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/login")
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;   

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

        if ("PENDING".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "fail",
                "message", "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra Gmail và nhập OTP."
            ));
        }

        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "fail",
                "message", "Trạng thái tài khoản không hợp lệ!"
            ));
        }

        // ===== So khớp mật khẩu (BCrypt + tự nâng cấp data cũ) =====
        String stored = account.getPasswordHash();
        boolean matched;

        if (stored != null && stored.startsWith("$2")) {
            matched = passwordEncoder.matches(password, stored);
        } else {
            matched = stored != null && stored.equals(password);
            if (matched) {
                account.setPasswordHash(passwordEncoder.encode(password));
                account.setUpdatedDate(LocalDateTime.now());
                accountRepository.save(account);
            }
        }

        if (!matched) {
            return ResponseEntity.status(401).body(Map.of(
                "status", "fail",
                "message", "Mật khẩu không chính xác!"
            ));
        }

        String token = jwtUtil.generateToken(account.getAccountId(), account.getRoleId());

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Đăng nhập thành công!",
            "data", Map.of(
                "accountId", account.getAccountId(),
                "fullName", account.getFullname(),
                "email", account.getEmail(),
                "phoneNumber", account.getPhone(),
                "roleId", account.getRoleId(),
                "token", token
            )
        ));
    }
}