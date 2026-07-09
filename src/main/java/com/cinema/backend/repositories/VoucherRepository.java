package com.cinema.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
     Optional<Voucher> findByVoucherCode(String voucherCode);
    
}
