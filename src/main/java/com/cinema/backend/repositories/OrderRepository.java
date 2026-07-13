package com.cinema.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cinema.backend.entities.Order1;

@Repository
public interface OrderRepository
        extends JpaRepository<Order1, Integer> {

    List<Order1>
        findByCustomerAccountIdOrderByCreatedDateDesc(
            Integer accountId
        );
}