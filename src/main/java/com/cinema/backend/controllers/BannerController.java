package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Banner;
import com.cinema.backend.repositories.BannerRepository;

@RestController
@RequestMapping("/api")
public class BannerController {
     @Autowired
    private BannerRepository bannerRepository;

    // 🚀 ĐẠO ĐOẠN API NẰM TẠI ĐÂY: Trả về danh sách banner active = true dưới dạng JSON
    @GetMapping("/banners")
    public List<Banner> getAllActiveBanners() {
        // Hoặc dùng bannerRepository.findAll() nếu chưa viết hàm lọc custom
        return bannerRepository.findAll(); 
    }
}
