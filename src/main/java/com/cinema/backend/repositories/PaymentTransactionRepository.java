package com.cinema.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinema.backend.entities.PaymentTransaction;

import jakarta.persistence.LockModeType;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Integer> {

    Optional<PaymentTransaction> findByTransactionCode(
            String transactionCode
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT payment
        FROM PaymentTransaction payment
        WHERE payment.transactionCode = :transactionCode
    """)
    Optional<PaymentTransaction> findByTransactionCodeForUpdate(
            @Param("transactionCode") String transactionCode
    );
}