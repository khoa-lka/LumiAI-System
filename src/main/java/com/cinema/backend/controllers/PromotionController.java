package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Promotion;
import com.cinema.backend.repositories.PromotionRepository;

@RestController
@RequestMapping("/api/promos")
@CrossOrigin(origins = "*")
public class PromotionController {
    @Autowired
    private PromotionRepository promotionRepository;

    // Cổng API lấy toàn bộ ưu đãi động đổ bộ ra Front-end
    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }
}
