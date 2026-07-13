package com.cinema.backend.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// Controller phục vụ trang Máy POS dành cho Staff (role_id = 2)
@Controller
public class StaffController {

    @GetMapping("/staff")
    public String staffPage() {
        return "forward:/staff.html";
    }
}