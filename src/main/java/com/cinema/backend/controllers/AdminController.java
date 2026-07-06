package com.cinema.backend.controllers;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Account;
import com.cinema.backend.entities.SysLogDTO;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.SysLogRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AccountRepository accountRepository; // Sử dụng AccountRepository đã có của bạn

    @Autowired
    private SysLogRepository sysLogRepository; // Sử dụng SysLogRepository vừa tạo ở trên

    @GetMapping("/users")
    public List<Account> getAllUsers() {
        // Lấy toàn bộ danh sách tài khoản từ database trả về cho file admin.js
        return accountRepository.findAll(); 
    }

    @GetMapping("/syslogs")
    public List<SysLogDTO> getSysLogs() {
        // Lấy toàn bộ log hệ thống từ database trả về cho file admin.js
        return sysLogRepository.findAll();
    }
}