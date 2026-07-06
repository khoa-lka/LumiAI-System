package com.cinema.backend.entities;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class Gemini {

    private final String apiKey;

    public Gemini() {
        Dotenv dotenv = null;
        try {
            dotenv = Dotenv.configure().directory("./Back-end").ignoreIfMissing().load();
        } catch (Exception e) {}

        if (dotenv == null || dotenv.get("GEMINI_API_KEY") == null) {
            try {
                dotenv = Dotenv.configure().directory(".").ignoreIfMissing().load();
            } catch (Exception e) {}
        }

        String key = (dotenv != null) ? dotenv.get("GEMINI_API_KEY") : null;
        this.apiKey = (key != null) ? key.trim() : "";
    }

    public String askGemini(String userMessage) {
        if (apiKey.isEmpty()) {
            return "{\"error\": \"Lỗi: Không tìm thấy API Key trong file .env!\"}";
        }

        // Bối cảnh thắt chặt luật rạp phim LAS
        String systemContext = "Bạn là trợ lý ảo của rạp phim LAS Cinemas. "
                + "Chỉ trả lời câu hỏi liên quan đến lịch chiếu, giá vé, đặt ghế của rạp LAS. "
                + "Nếu người dùng hỏi câu hỏi ngoài lề hệ thống rạp phim, bạn phải từ chối lịch sự bằng câu: "
                + "'Tôi là trợ lý ảo của rạp phim LAS, tôi không thể trả lời câu hỏi ngoài hệ thống.'";

        // Làm sạch tin nhắn để tránh gãy cấu trúc chuỗi JSON
        String cleanUserMessage = userMessage.replace("\"", "\\\"").replace("\n", "\\n");

        // Gói dữ liệu contents thô chuẩn hóa
        String jsonPayload = "{"
                + "\"contents\": [{"
                + "  \"parts\": [{"
                + "    \"text\": \"" + systemContext + "\\n\\nNgười dùng hỏi: " + cleanUserMessage + "\""
                + "  }]"
                + "}]"
                + "}";

        try {
            HttpClient client = HttpClient.newHttpClient();
            
            // 🌟 ĐOẠN SỬA VÀNG: Tách hẳn API Key ra sau dấu chấm hỏi và giữ nguyên gemini-1.5-flash chuẩn REST
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"error\": \"Hệ thống AI đang bận, cậu thử lại sau nhé!\"}";
        }
    }
}