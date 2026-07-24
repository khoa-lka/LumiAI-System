package com.cinema.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinema.backend.entities.Order1;

public interface OrderRepository extends JpaRepository<Order1, Integer> {

    List<Order1> findByCustomerAccountIdOrderByCreatedDateDesc(Integer accountId);
     @Query(value = """
    SELECT
        COUNT(o.order_id),
        COALESCE(SUM(o.final_amount), 0)
    FROM public.order1 o
    WHERE o.account_cus_id = :accountId
      AND UPPER(COALESCE(o.order_status, ''))
          IN ('COMPLETED', 'COMPLETELY')
      AND (
          UPPER(COALESCE(o.payment_status, ''))
              = 'SUCCESS'
          OR EXISTS (
              SELECT 1
              FROM public.paymenttransaction p
              WHERE p.order_id = o.order_id
                AND UPPER(
                    COALESCE(p.payment_status, '')
                ) = 'SUCCESS'
          )
      )
    """, nativeQuery = true)
List<Object[]> getCustomerBookingSummary(
    @Param("accountId") Integer accountId
);
}
