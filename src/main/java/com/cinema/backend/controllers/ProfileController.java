package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*") // Mở cổng CORS cho Front-End của Vy gọi vào thoải mái
public class ProfileController {

    @Autowired
    private AccountRepository accountRepository;

    // 1. API LẤY THÔNG TIN HỒ SƠ CHI TIẾT (Dùng khi F5 hoặc chuyển Tab Thành Viên)
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfileDetails(@PathVariable("id") Integer accountId) {
        Optional<Account> accountOpt = accountRepository.findById(accountId);
        
        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "status", "error",
                "message", "Không tìm thấy thông tin tài khoản người dùng này!"
            ));
        }

        Account account = accountOpt.get();
        String roleString = account.getRoleId() == 1 ? "MANAGER / ADMIN" : "MEMBER";

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "data", Map.of(
                "accountId", account.getAccountId(),
                "fullName", account.getFullname(),
                "email", account.getEmail(),
                "phone", account.getPhone(),
                "dateOfBirth", account.getDateOfBirth() != null
                        ? account.getDateOfBirth().toString()
                        : "", // Trả về phom 'YYYY-MM-DD'
                "roleId", account.getRoleId(),
                "roleName", roleString
            )
        ));
    }

    // 2. API CẬP NHẬT CHỈNH SỬA THÔNG TIN HỒ SƠ (Nối trực tiếp vào nút LƯU THÔNG TIN)
    @PutMapping("/update")
    public ResponseEntity<?> updateProfileInformation(@RequestBody Map<String, Object> updateRequest) {
        try {
            if (updateRequest.get("accountId") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Thiếu ID tài khoản định danh!"
                ));
            }

            Integer accountId = Integer.parseInt(updateRequest.get("accountId").toString());

            String fullname = updateRequest.get("fullName") != null
                    ? updateRequest.get("fullName").toString().trim()
                    : "";

            String email = updateRequest.get("email") != null
                    ? updateRequest.get("email").toString().trim()
                    : "";

            String phone = updateRequest.get("phone") != null
                    ? updateRequest.get("phone").toString().trim()
                    : "";

            String dobStr = updateRequest.get("dateOfBirth") != null
                    ? updateRequest.get("dateOfBirth").toString().trim()
                    : "";

            // 1. Check rỗng giống đăng ký
            if (fullname.isBlank() || email.isBlank() || phone.isBlank() || dobStr.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Vui lòng điền đầy đủ họ tên, email, số điện thoại và ngày sinh!"
                ));
            }

            // 2. Validate họ tên
            if (fullname.length() < 2 || fullname.length() > 50) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Họ tên phải từ 2 đến 50 ký tự!"
                ));
            }

            if (!fullname.matches("^[A-Za-zÀ-ỹ\\s]+$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Họ tên chỉ được chứa chữ cái và khoảng trắng!"
                ));
            }

            // 3. Validate phone
            if (!phone.matches("^0\\d{9}$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0!"
                ));
            }

            // 4. Validate email
            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Email không đúng định dạng!"
                ));
            }

            // 5. Parse và validate ngày sinh
            LocalDate dateOfBirth;

            try {
                if (dobStr.contains("/")) {
                    String[] parts = dobStr.split("/");

                    if (parts.length != 3) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "status", "fail",
                                "message", "Ngày sinh không đúng định dạng!"
                        ));
                    }

                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);

                    dateOfBirth = LocalDate.of(year, month, day);
                } else {
                    dateOfBirth = LocalDate.parse(dobStr);
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Ngày sinh không hợp lệ!"
                ));
            }

            if (!dateOfBirth.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Ngày sinh không được lớn hơn hoặc bằng ngày hiện tại!"
                ));
            }

            int age = Period.between(dateOfBirth, LocalDate.now()).getYears();

            if (age < 6) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Tuổi tài khoản phải từ 6 tuổi trở lên!"
                ));
            }

            // 6. Tìm account
            Optional<Account> accountOpt = accountRepository.findById(accountId);

            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                        "status", "error",
                        "message", "Tài khoản không tồn tại trên hệ thống!"
                ));
            }

            Account account = accountOpt.get();

            // 7. Check trùng email với tài khoản khác
            if (accountRepository.existsByEmailAndAccountIdNot(email, accountId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Địa chỉ Email mới này đã có người khác sử dụng!"
                ));
            }

            // 8. Check trùng phone với tài khoản khác
            if (accountRepository.existsByPhoneAndAccountIdNot(phone, accountId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "fail",
                        "message", "Số điện thoại mới này đã có người đăng ký!"
                ));
            }

            // 9. Cập nhật
            account.setFullname(fullname);
            account.setEmail(email);
            account.setPhone(phone);
            account.setDateOfBirth(dateOfBirth);
            account.setUpdatedDate(LocalDateTime.now());

            accountRepository.save(account);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Cập nhật hồ sơ thông tin tài khoản thành công!",
                    "data", Map.of(
                            "accountId", account.getAccountId(),
                            "fullName", account.getFullname(),
                            "phone", account.getPhone(),
                            "email", account.getEmail(),
                            "dateOfBirth", account.getDateOfBirth().toString()
                    )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Lỗi xử lý lưu hồ sơ: " + e.getMessage()
            ));
        }
    }
}