package com.cinema.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.config.CurrentUser;
import org.springframework.http.ResponseEntity;
import com.cinema.backend.entities.Banner;
import com.cinema.backend.entities.Booking;
import com.cinema.backend.repositories.BannerRepository;
import com.cinema.backend.repositories.BookingRepository;
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired
    BookingRepository bookingRepository;

    @GetMapping("/user/{accountId}")
    public ResponseEntity<?> history(@PathVariable Integer accountId) {

        if (!CurrentUser.canAccess(accountId)) {
            return ResponseEntity.status(403).body(Map.of(
                "status", "error",
                "message", "Bạn không có quyền xem dữ liệu này!"
            ));
        }

        return ResponseEntity.ok(bookingRepository.findByAccountId(accountId));
    }
}