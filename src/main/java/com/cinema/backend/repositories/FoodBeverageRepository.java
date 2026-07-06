package com.cinema.backend.repositories;

import com.cinema.backend.entities.FoodBeverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FoodBeverageRepository extends JpaRepository<FoodBeverage, Integer> {
}