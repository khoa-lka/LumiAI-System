package com.cinema.backend.controllers;

import com.cinema.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@CrossOrigin("*")
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/test")
    public String testEmail(@RequestParam String to) {

        emailService.sendSimpleEmail(
                to,
                "Test gửi mail từ LAS Cinema",
                "Nếu bạn nhận được email này thì chức năng gửi mail đã hoạt động."
        );

        return "Đã gửi mail test tới " + to;
    }
}
