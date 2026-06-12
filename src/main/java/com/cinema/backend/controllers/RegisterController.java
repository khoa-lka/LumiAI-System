package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/register")
public class RegisterController {

    @Autowired
    private AccountRepository accountRepository;

    // Kho lưu trữ tạm thời mã OTP của từng Email dưới dạng bộ nhớ đệm (Cache tạm)
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/submit")
    public ResponseEntity<?> handleRegister(@RequestBody Map<String, Object> regRequest) {
        try {
            String name = (String) regRequest.get("name");
            String phone = (String) regRequest.get("phone");
            String email = (String) regRequest.get("email");
            String password = (String) regRequest.get("password");
            
            if (regRequest.get("birthDay") == null || regRequest.get("birthMonth") == null || regRequest.get("birthYear") == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng chọn đầy đủ ngày, tháng, năm sinh!"));
            }

            Integer birthDay = Integer.parseInt(regRequest.get("birthDay").toString());
            Integer birthMonth = Integer.parseInt(regRequest.get("birthMonth").toString());
            Integer birthYear = Integer.parseInt(regRequest.get("birthYear").toString());

            if (name == null || name.isBlank() || phone == null || phone.isBlank() ||
                email == null || email.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng điền đầy đủ các thông tin bắt buộc!"));
            }

            if (accountRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Địa chỉ Email này đã có người sử dụng!"));
            }

            if (accountRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Số điện thoại này đã được đăng ký!"));
            }

            // --- LUỒNG SINH MÃ OTP GIẢ LẬP ---
            String otpCode = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, otpCode); // Lưu tạm mã OTP gắn liền với email này
            
            // In ra màn hình Console của VS Code để Huy nhìn thấy và lấy mã nhập test
            System.out.println("========= MÃ OTP KÍCH HOẠT ĐĂNG KÝ CỦA [" + email + "] LÀ: " + otpCode + " =========");

            // Lưu thông tin tài khoản xuống DB trước
            Account newAccount = new Account();
            newAccount.setFullname(name);
            newAccount.setPhone(phone);
            newAccount.setEmail(email);
            newAccount.setPasswordHash(password);
            newAccount.setDateOfBirth(LocalDate.of(birthYear, birthMonth, birthDay));
            newAccount.setCreatedDate(LocalDateTime.now());
            newAccount.setUpdatedDate(LocalDateTime.now());
            newAccount.setRoleId(3); 

            accountRepository.save(newAccount);

            // Trả về email để lát nữa FE giữ lại email này gửi kèm mã xác thực OTP
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Thông tin đăng ký hợp lệ! Hệ thống đã gửi mã OTP kích hoạt.",
                "email", email
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Lỗi xử lý hệ thống: " + e.getMessage()));
        }
    }

    // 🚀 API MỚI: Xử lý kiểm tra mã OTP từ giao diện gửi lên
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> verifyRequest) {
        String email = verifyRequest.get("email");
        String otpInput = verifyRequest.get("otp");

        if (email == null || otpInput == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Dữ liệu xác thực không hợp lệ!"));
        }

        // Lấy mã OTP gốc trong bộ nhớ ra so sánh
        String savedOtp = otpStorage.get(email);

        if (savedOtp == null) {
            return ResponseEntity.status(400).body(Map.of("status", "fail", "message", "Mã kích hoạt đã hết hạn hoặc không tồn tại!"));
        }

        if (savedOtp.equals(otpInput)) {
            otpStorage.remove(email); // Xác thực đúng thì xóa OTP tạm thời đi
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Kích hoạt tài khoản hội viên LAS thành công! Vui lòng tiến hành đăng nhập."
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of("status", "fail", "message", "Mã OTP nhập vào không chính xác!"));
        }
    }
}
