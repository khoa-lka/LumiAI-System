package com.cinema.backend.service;

import com.cinema.backend.entities.Promotion;
import java.util.List;

public interface PromotionService {
    List<Promotion> getAllPromotionsForManager();
    List<Promotion> getActivePromotionsForCustomer();
    Promotion createPromotion(Promotion promotion, Integer voucherId);
    Promotion updatePromotion(Long id, Promotion promotionDetails, Integer voucherId);
    void deletePromotion(Long id);
}