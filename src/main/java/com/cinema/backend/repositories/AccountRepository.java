package com.cinema.backend.repositories;

import com.cinema.backend.entities.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmailOrPhoneNumber(String email, String phoneNumber);
}
