package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.service.EmailService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private final EmailService emailService;

    // Lưu OTP tạm cho quên mật khẩu
    private static final Map<String, String> forgotOtpStorage = new ConcurrentHashMap<>();

    // Lưu thời gian hết hạn OTP
    private static final Map<String, LocalDateTime> forgotOtpExpiryStorage = new ConcurrentHashMap<>();

    // 1. API gửi OTP quên mật khẩu
    @PostMapping("/request")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        try {
            String identifier = request.get("identifier");

            if (identifier == null || identifier.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Vui lòng nhập Email hoặc Số điện thoại!"
                ));
            }

            identifier = identifier.trim();

            // Tìm account bằng email hoặc phone
            Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(identifier, identifier);

            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "Tài khoản này không tồn tại trên hệ thống!"
                ));
            }

            Account account = accountOpt.get();

            // Email thật để gửi OTP
            String emailToSend = account.getEmail();

            if (emailToSend == null || emailToSend.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Tài khoản này chưa có email để nhận OTP!"
                ));
            }

            // Sinh mã OTP 6 số
            String otpCode = String.format("%06d", new Random().nextInt(1000000));

            // Lưu theo identifier để frontend reset vẫn dùng identifier cũ được
            forgotOtpStorage.put(identifier, otpCode);
            forgotOtpExpiryStorage.put(identifier, LocalDateTime.now().plusMinutes(5));

            System.out.println("\n==========================================");
            System.out.println("[LAS CINEMAS - QUÊN MẬT KHẨU] Tài khoản: " + identifier);
            System.out.println("Email nhận OTP: " + emailToSend);
            System.out.println("MÃ SỐ XÁC THỰC OTP LÀ: " + otpCode);
            System.out.println("==========================================\n");

            try {
                emailService.sendSimpleEmail(
                        emailToSend,
                        "Mã OTP đặt lại mật khẩu LAS Cinema",
                        "Xin chào " + account.getFullname() + ",\n\n" +
                                "Mã OTP đặt lại mật khẩu LAS Cinema của bạn là: " + otpCode + "\n\n" +
                                "Mã này có hiệu lực trong 5 phút.\n\n" +
                                "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này."
                );

                System.out.println("ĐÃ GỬI OTP QUÊN MẬT KHẨU TỚI EMAIL: " + emailToSend);

            } catch (Exception mailEx) {
                mailEx.printStackTrace();

                forgotOtpStorage.remove(identifier);
                forgotOtpExpiryStorage.remove(identifier);

                return ResponseEntity.internalServerError().body(Map.of(
                        "status", "error",
                        "message", "Không gửi được OTP về Gmail. Vui lòng kiểm tra cấu hình email hệ thống!"
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Mã xác thực OTP đã được gửi tới Gmail của bạn!",
                    "identifier", identifier
            ));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    // 2. API xác nhận OTP và đổi mật khẩu
    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String identifier = request.get("identifier");
            String otpInput = request.get("otp");
            String newPassword = request.get("newPassword");

            if (identifier == null || otpInput == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Vui lòng nhập đủ thông tin!"
                ));
            }

            identifier = identifier.trim();
            otpInput = otpInput.trim();
            newPassword = newPassword.trim();

            if (newPassword.length() < 6 || newPassword.length() > 25) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Mật khẩu mới phải từ 6 đến 25 ký tự!"
                ));
            }

            String savedOtp = forgotOtpStorage.get(identifier);
            LocalDateTime expiredAt = forgotOtpExpiryStorage.get(identifier);

            if (savedOtp == null || expiredAt == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "status", "error",
                        "message", "Mã xác thực OTP không tồn tại hoặc đã hết hạn!"
                ));
            }

            if (LocalDateTime.now().isAfter(expiredAt)) {
                forgotOtpStorage.remove(identifier);
                forgotOtpExpiryStorage.remove(identifier);

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "status", "error",
                        "message", "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới!"
                ));
            }

            if (!savedOtp.equals(otpInput)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "status", "error",
                        "message", "Mã xác thực OTP không chính xác!"
                ));
            }

            Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(identifier, identifier);

            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "status", "error",
                        "message", "Không tìm thấy tài khoản!"
                ));
            }

            Account account = accountOpt.get();

            account.setPasswordHash(newPassword);
            account.setUpdatedDate(LocalDateTime.now());

            accountRepository.save(account);

            forgotOtpStorage.remove(identifier);
            forgotOtpExpiryStorage.remove(identifier);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
            ));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }
}