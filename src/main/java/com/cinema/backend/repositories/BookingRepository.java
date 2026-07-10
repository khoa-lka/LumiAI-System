package com.cinema.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.Booking;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
        List<Booking> findByAccountId(Integer accountId);
}