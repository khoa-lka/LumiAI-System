package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/register")
public class RegisterController {

  
    private final AccountRepository accountRepository;
public RegisterController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/submit")
    public ResponseEntity<?> handleRegister(@RequestBody Map<String, Object> regRequest) {
        try {
            String name = (String) regRequest.get("name");
            String phone = (String) regRequest.get("phone");
            String email = (String) regRequest.get("email");
            String password = (String) regRequest.get("password");
            
            // 1. Kiểm tra dữ liệu trống (Blank/Null)
            if (name == null || name.isBlank() || phone == null || phone.isBlank() ||
                email == null || email.isBlank() || password == null || password.isBlank() ||
                regRequest.get("birthDay") == null || regRequest.get("birthMonth") == null || regRequest.get("birthYear") == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng điền đầy đủ các thông tin bắt buộc!"));
            }

            name = name.trim();
            phone = phone.trim();
            email = email.trim();

            // 2. Ràng buộc định dạng Số điện thoại (Phải bắt đầu bằng 0, có 10-11 số)
            if (!phone.matches("^0\\d{9,10}$")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Số điện thoại không đúng định dạng (Phải từ 10-11 chữ số và bắt đầu bằng số 0)!"));
            }

            // 3. Ràng buộc định dạng Email chuẩn
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Địa chỉ Email không đúng định dạng!"));
            }

            // 4. Ràng buộc độ dài mật khẩu (Khớp với giới hạn NVARCHAR(25) trong Database)
            if (password.length() < 6 || password.length() > 25) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mật khẩu bảo mật phải từ 6 đến 25 ký tự!"));
            }

            // 5. Ràng buộc tính hợp lệ của Ngày tháng năm sinh
            Integer birthDay = Integer.parseInt(regRequest.get("birthDay").toString());
            Integer birthMonth = Integer.parseInt(regRequest.get("birthMonth").toString());
            Integer birthYear = Integer.parseInt(regRequest.get("birthYear").toString());

            LocalDate dateOfBirth;
            try {
                dateOfBirth = LocalDate.of(birthYear, birthMonth, birthDay);
                
                // Kiểm tra xem ngày sinh có vượt quá thời gian hiện tại không
                if (dateOfBirth.isAfter(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Ngày sinh không thể nằm ở thời gian tương lai!"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Ngày tháng năm sinh chọn lựa không hợp lệ trên lịch!"));
            }

            // 6. Kiểm tra trùng lặp trong Database
            if (accountRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Địa chỉ Email này đã có người sử dụng!"));
            }

            if (accountRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Số điện thoại này đã được đăng ký!"));
            }

            // --- LUỒNG SINH MÃ OTP ---
            String otpCode = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, otpCode);
            
            System.out.println("========= MÃ OTP KÍCH HOẠT ĐĂNG KÝ CỦA [" + email + "] LÀ: " + otpCode + " =========");

            // Lưu tài khoản hợp lệ xuống Database
            Account newAccount = new Account();
            newAccount.setFullname(name);
            newAccount.setPhone(phone);
            newAccount.setEmail(email);
            newAccount.setPasswordHash(password);
           
            newAccount.setRoleId(3); // Khách hàng 
newAccount.setDateOfBirth(dateOfBirth); // dateOfBirth lúc nãy bạn đã parse ra LocalDate rồi
            newAccount.setCreatedDate(LocalDateTime.now()); // Lấy giờ hệ thống hiện tại
            newAccount.setUpdatedDate(LocalDateTime.now());
            accountRepository.save(newAccount);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Thông tin đăng ký hợp lệ! Hệ thống đã gửi mã OTP kích hoạt.",
                "email", email
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Lỗi xử lý hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> verifyRequest) {
        String email = verifyRequest.get("email");
        String otpInput = verifyRequest.get("otp");

        if (email == null || otpInput == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Dữ liệu xác thực không hợp lệ!"));
        }

        String savedOtp = otpStorage.get(email);

        if (savedOtp == null) {
            return ResponseEntity.status(400).body(Map.of("status", "fail", "message", "Mã kích hoạt đã hết hạn hoặc không tồn tại!"));
        }

        if (savedOtp.equals(otpInput)) {
            otpStorage.remove(email); 
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Kích hoạt tài khoản hội viên LAS thành công! Vui lòng tiến hành đăng nhập."
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of("status", "fail", "message", "Mã OTP nhập vào không chính xác!"));
        }
    }
}