package com.cinema.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {
    
}
