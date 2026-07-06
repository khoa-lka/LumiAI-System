package com.cinema.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    Voucher findByVoucherCode(String voucherCode);
    
}
