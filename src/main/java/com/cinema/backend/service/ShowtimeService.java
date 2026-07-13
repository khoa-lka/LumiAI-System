package com.cinema.backend.service;

import com.cinema.backend.entities.Showtime;
import java.util.Map;

public interface ShowtimeService {
    Showtime updateShowtime(Integer id, Map<String, Object> payload);
}