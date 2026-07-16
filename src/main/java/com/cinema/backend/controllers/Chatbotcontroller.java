package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Gemini;

@RestController
public class Chatbotcontroller {
    @Autowired
    private Gemini gemini;

    @GetMapping("/api/chat")
    public String chatWithGemini(String message) {
        return gemini.askGemini(message);
    }
}