package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/forgot-password")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final AccountRepository accountRepository;
    
    // Kho lưu trữ tạm mã OTP cho tính năng quên mật khẩu
    private static final Map<String, String> forgotOtpStorage = new ConcurrentHashMap<>();

    // 1. API Gửi yêu cầu lấy mã OTP
    @PostMapping("/request")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        try {
            String identifier = request.get("identifier");

            if (identifier == null || identifier.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng nhập Email hoặc Số điện thoại!"));
            }

            // Kiểm tra tài khoản có tồn tại trong DB không
            Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(identifier, identifier);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "error", "message", "Tài khoản này không tồn tại trên hệ thống!"));
            }

            // Sinh mã OTP 6 số
            String otpCode = String.format("%06d", new Random().nextInt(1000000));
            forgotOtpStorage.put(identifier, otpCode);

            // In ra Console để test
            System.out.println("\n==========================================");
            System.out.println("📩 [LAS CINEMAS - QUÊN MẬT KHẨU] Tài khoản: " + identifier);
            System.out.println("🔑 MÃ SỐ XÁC THỰC OTP LÀ: " + otpCode);
            System.out.println("==========================================\n");

            return ResponseEntity.ok(Map.of(
                "status", "success", 
                "message", "Mã xác thực OTP đã được gửi thành công!",
                "identifier", identifier
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    // 2. API Xác nhận mã OTP và Lưu mật khẩu mới
    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String identifier = request.get("identifier");
            String otpInput = request.get("otp");
            String newPassword = request.get("newPassword");

            if (identifier == null || otpInput == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng nhập đủ thông tin!"));
            }

            // Ràng buộc mật khẩu (6-25 ký tự)
            if (newPassword.length() < 6 || newPassword.length() > 25) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mật khẩu mới phải từ 6 đến 25 ký tự!"));
            }

            String savedOtp = forgotOtpStorage.get(identifier);

            if (savedOtp == null || !savedOtp.equals(otpInput)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("status", "error", "message", "Mã xác thực OTP không chính xác hoặc đã hết hạn!"));
            }

            // Tiến hành cập nhật mật khẩu mới vào DB
            Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(identifier, identifier);
            if (accountOpt.isPresent()) {
                Account account = accountOpt.get();
                account.setPasswordHash(newPassword);
                accountRepository.save(account);

                // Cập nhật xong thì xóa OTP đi
                forgotOtpStorage.remove(identifier);

                return ResponseEntity.ok(Map.of(
                    "status", "success", 
                    "message", "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
                ));
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", "Không tìm thấy tài khoản!"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}