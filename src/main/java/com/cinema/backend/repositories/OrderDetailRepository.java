package com.cinema.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.backend.entities.OrderDetail;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

     List<OrderDetail> findByOrderOrderId(Integer orderId);


}
