package com.cinema.backend.repositories;


import com.cinema.backend.entities.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Integer> {

    Optional<EmailOtp> findTopByEmailAndPurposeOrderByCreatedAtDesc(
            String email,
            String purpose
    );
}