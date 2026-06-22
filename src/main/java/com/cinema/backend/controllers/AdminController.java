package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Account;
import com.cinema.backend.entities.SysLogDTO;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    @GetMapping("/users")
    public List<Account> getAllUsers() {
        // Lấy dữ liệu từ Database ra và trả về...
        return null; 
    }

    @GetMapping("/syslogs")
    public List<SysLogDTO> getSysLogs() {
        // Lấy dữ liệu log hệ thống...
        return null;
    }
}
