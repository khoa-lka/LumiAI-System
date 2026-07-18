package com.cinema.backend.repositories;

import com.cinema.backend.entities.FoodBeverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FoodBeverageRepository extends JpaRepository<FoodBeverage, Integer> {
@Modifying
    @Query("UPDATE FoodBeverage f SET f.stockQuantity = f.stockQuantity - :quantity WHERE f.id = :id AND f.stockQuantity >= :quantity")
    int decrementStockQuantity(@Param("id") Long id, @Param("quantity") Integer quantity);
}