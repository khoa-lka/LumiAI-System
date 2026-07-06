package com.cinema.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public List<Booking> history(
            @PathVariable Integer accountId){

        return bookingRepository.findByAccountId(accountId);
    }
}