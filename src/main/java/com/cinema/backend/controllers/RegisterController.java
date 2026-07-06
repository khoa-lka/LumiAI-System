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
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public RegisterController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> handleRegister(@RequestBody Map<String, Object> regRequest) {
        try {
            // 1. Trích xuất dữ liệu an toàn tuyệt đối (Không lo NullPointerException)
            String name = regRequest.containsKey("name") && regRequest.get("name") != null 
                          ? String.valueOf(regRequest.get("name")).trim() : "";
            String phone = regRequest.containsKey("phone") && regRequest.get("phone") != null 
                           ? String.valueOf(regRequest.get("phone")).trim() : "";
            String email = regRequest.containsKey("email") && regRequest.get("email") != null 
                           ? String.valueOf(regRequest.get("email")).trim() : "";
            String password = regRequest.containsKey("password") && regRequest.get("password") != null 
                              ? String.valueOf(regRequest.get("password")).trim() : "";

            // 2. Kiểm tra rỗng toàn bộ các trường bắt buộc
            if (name.isEmpty() || phone.isEmpty() || email.isEmpty() || password.isEmpty() ||
                !regRequest.containsKey("birthDay") || !regRequest.containsKey("birthMonth") || !regRequest.containsKey("birthYear")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Vui lòng điền đầy đủ các thông tin bắt buộc!"));
            }

            // 3. Ràng buộc Tên (Chỉ chữ cái và khoảng trắng)
            if (!name.matches("^[\\p{L}\\s]+$")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Tên không hợp lệ. Chỉ được phép nhập chữ cái và khoảng trắng!"));
            }

            // 4. Ràng buộc Số điện thoại (Bắt đầu bằng số 0, dài 10-11 số)
            if (!phone.matches("^0\\d{9,10}$")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Số điện thoại không đúng định dạng (Phải từ 10-11 chữ số và bắt đầu bằng số 0)!"));
            }

            // 5. Ràng buộc Email chuẩn
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Địa chỉ Email không đúng định dạng!"));
            }

            // 6. Ràng buộc độ dài Mật khẩu
            if (password.length() < 6 || password.length() > 25) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mật khẩu bảo mật phải từ 6 đến 25 ký tự!"));
            }

            // 7. Ràng buộc tính hợp lệ của Ngày tháng năm sinh
            LocalDate dateOfBirth;
            try {
                int birthDay = Integer.parseInt(regRequest.get("birthDay").toString());
                int birthMonth = Integer.parseInt(regRequest.get("birthMonth").toString());
                int birthYear = Integer.parseInt(regRequest.get("birthYear").toString());
                
                dateOfBirth = LocalDate.of(birthYear, birthMonth, birthDay);
                
                if (dateOfBirth.isAfter(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Ngày sinh không thể nằm ở thời gian tương lai!"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Ngày tháng năm sinh chọn lựa không hợp lệ trên lịch!"));
            }

            // 8. Kiểm tra trùng lặp Database
            if (accountRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Địa chỉ Email này đã có người sử dụng!"));
            }
            if (accountRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Số điện thoại này đã được đăng ký!"));
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
            // Lưu ý thực tế: Bạn nên Hash mật khẩu (ví dụ dùng BCrypt) ở bước này trước khi lưu
            newAccount.setPasswordHash(password); 
            newAccount.setRoleId(3); 
            newAccount.setDateOfBirth(dateOfBirth); 
            newAccount.setCreatedDate(LocalDateTime.now()); 
            newAccount.setUpdatedDate(LocalDateTime.now());
            
            accountRepository.save(newAccount);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Thông tin đăng ký hợp lệ! Hệ thống đã gửi mã OTP kích hoạt.",
                "email", email
            ));

        } catch (Exception e) {
            e.printStackTrace(); // In ra log console để dễ debug nếu có lỗi ngầm
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Lỗi xử lý hệ thống vui lòng thử lại sau!"));
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
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mã kích hoạt đã hết hạn hoặc không tồn tại!"));
        }

        if (savedOtp.equals(otpInput)) {
            otpStorage.remove(email); 
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Kích hoạt tài khoản hội viên LAS thành công! Vui lòng tiến hành đăng nhập."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mã OTP nhập vào không chính xác!"));
        }
    }
}