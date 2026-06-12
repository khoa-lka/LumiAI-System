package com.cinema.backend.repositories;

import com.cinema.backend.entities.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    // Tìm tài khoản bằng email hoặc số điện thoại khi đăng nhập
    Optional<Account> findByEmailOrPhone(String email, String phone);
    
    // Kiểm tra trùng lặp khi đăng ký thành viên mới
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
