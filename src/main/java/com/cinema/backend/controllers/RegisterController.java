package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.service.EmailService;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder; 
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private static final Map<String, LocalDateTime> otpExpiryStorage = new ConcurrentHashMap<>();

    public RegisterController(AccountRepository accountRepository, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> handleRegister(@RequestBody Map<String, Object> regRequest) {
        Account savedAccount = null;

        try {
            String name = regRequest.containsKey("name") && regRequest.get("name") != null
                    ? String.valueOf(regRequest.get("name")).trim()
                    : "";

            String phone = regRequest.containsKey("phone") && regRequest.get("phone") != null
                    ? String.valueOf(regRequest.get("phone")).trim()
                    : "";

            String email = regRequest.containsKey("email") && regRequest.get("email") != null
                    ? String.valueOf(regRequest.get("email")).trim()
                    : "";

            String password = regRequest.containsKey("password") && regRequest.get("password") != null
                    ? String.valueOf(regRequest.get("password")).trim()
                    : "";

            if (name.isEmpty() || phone.isEmpty() || email.isEmpty() || password.isEmpty()
                    || !regRequest.containsKey("birthDay")
                    || !regRequest.containsKey("birthMonth")
                    || !regRequest.containsKey("birthYear")) {

                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Vui lòng điền đầy đủ các thông tin bắt buộc!"
                ));
            }

            if (!name.matches("^[\\p{L}\\s]+$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Tên không hợp lệ. Chỉ được phép nhập chữ cái và khoảng trắng!"
                ));
            }

            if (!phone.matches("^0\\d{9,10}$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Số điện thoại không đúng định dạng!"
                ));
            }

            if (!email.matches("(?i)^[A-Za-z0-9._%+-]+@gmail\\.com$")) {
    return ResponseEntity.badRequest().body(Map.of(
            "status", "error",
            "message", "Email phải đúng định dạng Gmail, ví dụ: example@gmail.com"
    ));
}

            if (password.length() < 6 || password.length() > 25) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Mật khẩu bảo mật phải từ 6 đến 25 ký tự!"
                ));
            }

            LocalDate dateOfBirth;

            try {
                int birthDay = Integer.parseInt(regRequest.get("birthDay").toString());
                int birthMonth = Integer.parseInt(regRequest.get("birthMonth").toString());
                int birthYear = Integer.parseInt(regRequest.get("birthYear").toString());

                dateOfBirth = LocalDate.of(birthYear, birthMonth, birthDay);

                if (dateOfBirth.isAfter(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Ngày sinh không thể nằm ở thời gian tương lai!"
                    ));
                }

            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Ngày tháng năm sinh chọn lựa không hợp lệ trên lịch!"
                ));
            }

            Account existingAccount = accountRepository.findByEmail(email).orElse(null);

if (existingAccount != null) {

    // Tài khoản đã kích hoạt thì không được đăng ký lại
    if ("ACTIVE".equalsIgnoreCase(existingAccount.getStatus())) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Địa chỉ Email này đã được đăng ký và kích hoạt!"
        ));
    }

    // Tài khoản bị khóa
    if ("BANNED".equalsIgnoreCase(existingAccount.getStatus())) {
        return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Tài khoản sử dụng Email này đã bị khóa!"
        ));
    }

    // Tài khoản PENDING: cập nhật thông tin và gửi OTP mới
    if ("PENDING".equalsIgnoreCase(existingAccount.getStatus())) {

        // Kiểm tra số điện thoại nhập lại có đúng với tài khoản cũ không
        if (!phone.equals(existingAccount.getPhone())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Email này đang có tài khoản chờ kích hoạt nhưng số điện thoại không khớp!"
            ));
        }

        existingAccount.setFullname(name);
        existingAccount.setPasswordHash(passwordEncoder.encode(password));
        existingAccount.setDateOfBirth(dateOfBirth);
        existingAccount.setUpdatedDate(LocalDateTime.now());

        accountRepository.save(existingAccount);

        String newOtpCode =
                String.format("%06d", new Random().nextInt(1000000));

        otpStorage.put(email, newOtpCode);
        otpExpiryStorage.put(
                email,
                LocalDateTime.now().plusMinutes(5)
        );

        try {
            emailService.sendSimpleEmail(
                    email,
                    "Mã OTP kích hoạt tài khoản LAS Cinema",
                    "Xin chào " + name + ",\n\n"
                            + "Mã OTP kích hoạt mới của bạn là: "
                            + newOtpCode
                            + "\n\nMã này có hiệu lực trong 5 phút."
            );

            System.out.println(
                    "========= OTP MỚI CỦA [" + email + "] LÀ: "
                            + newOtpCode + " ========="
            );

        } catch (Exception mailException) {
            mailException.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Không thể gửi lại OTP. Vui lòng thử lại!"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Tài khoản đang chờ kích hoạt. Hệ thống đã gửi lại OTP mới!",
                "email", email,
                "pending", true
        ));
    }
}

            if (accountRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Số điện thoại này đã được đăng ký!"
                ));
            }

            // =========================
            // 1. Lưu account PENDING trước
            // =========================
            Account newAccount = new Account();
            newAccount.setFullname(name);
            newAccount.setPhone(phone);
            newAccount.setEmail(email);
            newAccount.setPasswordHash(passwordEncoder.encode(password));
            newAccount.setRoleId(3);
            newAccount.setStatus("PENDING");
            newAccount.setDateOfBirth(dateOfBirth);
            newAccount.setCreatedDate(LocalDateTime.now());
            newAccount.setUpdatedDate(LocalDateTime.now());

            savedAccount = accountRepository.save(newAccount);

            // =========================
            // 2. Tạo OTP sau khi save thành công
            // =========================
            String otpCode = String.format("%06d", new Random().nextInt(1000000));

            otpStorage.put(email, otpCode);
            otpExpiryStorage.put(email, LocalDateTime.now().plusMinutes(5));

            System.out.println("========= MÃ OTP KÍCH HOẠT ĐĂNG KÝ CỦA [" + email + "] LÀ: " + otpCode + " =========");

            // =========================
            // 3. Gửi OTP qua Gmail
            // =========================
            try {
                emailService.sendSimpleEmail(
                        email,
                        "Mã OTP đăng ký tài khoản LAS Cinema",
                        "Xin chào " + name + ",\n\n" +
                                "Mã OTP kích hoạt tài khoản LAS Cinema của bạn là: " + otpCode + "\n\n" +
                                "Mã này có hiệu lực trong 5 phút.\n\n" +
                                "Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này."
                );

                System.out.println("ĐÃ GỬI OTP ĐĂNG KÝ TỚI EMAIL: " + email);

            } catch (Exception mailEx) {
                mailEx.printStackTrace();

                otpStorage.remove(email);
                otpExpiryStorage.remove(email);

                if (savedAccount != null) {
                    accountRepository.delete(savedAccount);
                }

                return ResponseEntity.internalServerError().body(Map.of(
                        "status", "error",
                        "message", "Không gửi được OTP về Gmail. Vui lòng kiểm tra cấu hình email hệ thống!"
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Thông tin đăng ký hợp lệ! Hệ thống đã gửi mã OTP kích hoạt.",
                    "email", email
            ));

        } catch (DataIntegrityViolationException e) {
            e.printStackTrace();

            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Email hoặc số điện thoại này đã được đăng ký!"
            ));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Lỗi xử lý hệ thống vui lòng thử lại sau!"
            ));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(
        @RequestBody Map<String, String> request
) {
    try {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Vui lòng nhập Email!"
            ));
        }

        email = email.trim();

        Account account = accountRepository.findByEmail(email)
                .orElse(null);

        if (account == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Không tìm thấy tài khoản sử dụng Email này!"
            ));
        }

        if ("ACTIVE".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Tài khoản này đã được kích hoạt!"
            ));
        }

        if ("BANNED".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.status(403).body(Map.of(
                    "status", "error",
                    "message", "Tài khoản này đã bị khóa!"
            ));
        }

        if (!"PENDING".equalsIgnoreCase(account.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Tài khoản không ở trạng thái chờ kích hoạt!"
            ));
        }

        String newOtpCode =
                String.format("%06d", new Random().nextInt(1000000));

        otpStorage.put(email, newOtpCode);
        otpExpiryStorage.put(
                email,
                LocalDateTime.now().plusMinutes(5)
        );

        emailService.sendSimpleEmail(
                email,
                "Gửi lại mã OTP LAS Cinema",
                "Xin chào " + account.getFullname() + ",\n\n"
                        + "Mã OTP kích hoạt mới của bạn là: "
                        + newOtpCode
                        + "\n\nMã này có hiệu lực trong 5 phút."
        );

        System.out.println(
                "========= OTP GỬI LẠI CỦA [" + email + "] LÀ: "
                        + newOtpCode + " ========="
        );

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đã gửi lại mã OTP mới!",
                "email", email
        ));

    } catch (Exception e) {
        e.printStackTrace();

        return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Không thể gửi lại OTP. Vui lòng thử lại!"
        ));
    }
}

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> verifyRequest) {
        try {
            String email = verifyRequest.get("email");
            String otpInput = verifyRequest.get("otp");

            if (email == null || otpInput == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Dữ liệu xác thực không hợp lệ!"
                ));
            }

            email = email.trim();
            otpInput = otpInput.trim();

            String savedOtp = otpStorage.get(email);
            LocalDateTime expiredAt = otpExpiryStorage.get(email);

            if (savedOtp == null || expiredAt == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Mã kích hoạt đã hết hạn hoặc không tồn tại!"
                ));
            }

            if (LocalDateTime.now().isAfter(expiredAt)) {
                otpStorage.remove(email);
                otpExpiryStorage.remove(email);

                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Mã OTP đã hết hạn. Vui lòng đăng ký lại!"
                ));
            }

            if (!savedOtp.equals(otpInput)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Mã OTP nhập vào không chính xác!"
                ));
            }

            Account account = accountRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản cần kích hoạt!"));

            if ("ACTIVE".equalsIgnoreCase(account.getStatus())) {
                otpStorage.remove(email);
                otpExpiryStorage.remove(email);

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Tài khoản này đã được kích hoạt trước đó."
                ));
            }

            account.setStatus("ACTIVE");
            account.setUpdatedDate(LocalDateTime.now());

            accountRepository.save(account);

            otpStorage.remove(email);
            otpExpiryStorage.remove(email);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Kích hoạt tài khoản hội viên LAS thành công! Vui lòng tiến hành đăng nhập."
            ));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Lỗi xác thực OTP. Vui lòng thử lại!"
            ));
        }
    }
}