package com.cinema.backend.entities;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.cinema.backend.repositories.MovieRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.entities.Movie;
import com.cinema.backend.entities.Showtime;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.DateTimeException;
import java.util.Comparator;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.beans.factory.annotation.Autowired;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class Gemini {
        @Autowired
        private MovieRepository movieRepository;

        @Autowired
        private ShowtimeRepository showtimeRepository;

        private final ObjectMapper objectMapper = new ObjectMapper();
        private final String apiKey;

        private String buildCinemaContext() {
                StringBuilder context = new StringBuilder();

                context.append("\nDỮ LIỆU THẬT HIỆN CÓ TRONG HỆ THỐNG:\n");

                List<Movie> movies = movieRepository.findAll();

                context.append("\nDanh sách phim:\n");

                int movieCount = 0;

                for (Movie movie : movies) {
                        String status = movie.getStatus() == null
                                        ? ""
                                        : movie.getStatus().toLowerCase();

                        if (!status.equals("now_showing")
                                        && !status.equals("coming_soon")) {
                                continue;
                        }

                        context.append("- ")
                                        .append(movie.getTitle())
                                        .append(" | thể loại: ")
                                        .append(movie.getGenre())
                                        .append(" | thời lượng: ")
                                        .append(movie.getDuration())
                                        .append(" phút | trạng thái: ")
                                        .append(status)
                                        .append("\n");

                        movieCount++;

                        if (movieCount >= 20)
                                break;
                }

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime sevenDaysLater = now.plusDays(7);

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

                context.append("\nSuất chiếu trong 7 ngày tới:\n");

                int showtimeCount = 0;

                for (Showtime showtime : showtimeRepository.findAll()) {
                        if (showtime.getStartTime() == null)
                                continue;

                        if (showtime.getStartTime().isBefore(now)
                                        || showtime.getStartTime().isAfter(sevenDaysLater)) {
                                continue;
                        }

                        String status = showtime.getStatus() == null
                                        ? "ACTIVE"
                                        : showtime.getStatus();

                        if (!status.equalsIgnoreCase("ACTIVE"))
                                continue;
                        if (showtime.getMovie() == null)
                                continue;

                        context.append("- Phim: ")
                                        .append(showtime.getMovie().getTitle())
                                        .append(" | thời gian: ")
                                        .append(showtime.getStartTime().format(formatter))
                                        .append(" | phòng: ")
                                        .append(showtime.getRoomId())
                                        .append(" | giá vé: ")
                                        .append(showtime.getTicketPrice())
                                        .append("đ\n");

                        showtimeCount++;

                        if (showtimeCount >= 30)
                                break;
                }

                if (showtimeCount == 0) {
                        context.append("- Chưa có suất chiếu phù hợp.\n");
                }

                return context.toString();
        }

        public Gemini() {
                Dotenv dotenv = null;
                try {
                        dotenv = Dotenv.configure().directory("./Back-end").ignoreIfMissing().load();
                } catch (Exception e) {
                }

                if (dotenv == null || dotenv.get("GEMINI_API_KEY") == null) {
                        try {
                                dotenv = Dotenv.configure().directory(".").ignoreIfMissing().load();
                        } catch (Exception e) {
                        }
                }

                String key = (dotenv != null) ? dotenv.get("GEMINI_API_KEY") : null;
                this.apiKey = (key != null) ? key.trim() : "";
        }

        private String normalizeVietnamese(String value) {
                if (value == null)
                        return "";

                return Normalizer
                                .normalize(value, Normalizer.Form.NFD)
                                .replaceAll("\\p{M}", "")
                                .toLowerCase()
                                .trim();
        }

        private boolean isShowtimeQuestion(String message) {
                String normalized = normalizeVietnamese(message);

                return normalized.contains("lich chieu")
                                || normalized.contains("suat chieu")
                                || normalized.contains("gio chieu")
                                || normalized.contains("gia ve")
                                || normalized.contains("chieu may gio")
                                || normalized.contains("chieu luc may")
                                || normalized.contains("chieu hom nay")
                                || normalized.contains("chieu ngay mai")
                                || normalized.contains("phim nao chieu")
                                || normalized.contains("phim gi chieu")
                                || normalized.contains("ve bao nhieu")
                                || normalized.contains("phong nao");
        }

        private LocalDate getRequestedShowtimeDate(String message) {
                String normalized = normalizeVietnamese(message);
                LocalDate today = LocalDate.now();

                if (normalized.contains("ngay mai")) {
                        return today.plusDays(1);
                }

                Pattern pattern = Pattern.compile(
                                "(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}))?");

                Matcher matcher = pattern.matcher(message);

                if (matcher.find()) {
                        try {
                                int day = Integer.parseInt(matcher.group(1));
                                int month = Integer.parseInt(matcher.group(2));

                                int year = matcher.group(3) != null
                                                ? Integer.parseInt(matcher.group(3))
                                                : today.getYear();

                                return LocalDate.of(year, month, day);

                        } catch (DateTimeException | NumberFormatException ignored) {
                        }
                }

                return today;
        }

        private String findMovieTitleInQuestion(String message) {
                String normalizedMessage = normalizeVietnamese(message);

                for (Movie movie : movieRepository.findAll()) {
                        if (movie.getTitle() == null)
                                continue;

                        String normalizedTitle = normalizeVietnamese(movie.getTitle());

                        if (!normalizedTitle.isBlank()
                                        && normalizedMessage.contains(normalizedTitle)) {
                                return movie.getTitle();
                        }
                }

                return null;
        }

        private String buildExactShowtimeAnswer(String message) {
                LocalDate requestedDate = getRequestedShowtimeDate(message);

                String requestedMovieTitle = findMovieTitleInQuestion(message);

                List<Showtime> showtimes = showtimeRepository
                                .findAll()
                                .stream()
                                .filter(showtime -> showtime.getStartTime() != null)
                                .filter(showtime -> showtime.getStartTime()
                                                .toLocalDate()
                                                .equals(requestedDate))
                                .filter(showtime -> showtime.getMovie() != null)
                                .filter(showtime -> showtime.getStatus() == null
                                                || showtime.getStatus()
                                                                .equalsIgnoreCase("ACTIVE"))
                                .filter(showtime -> {
                                        String movieStatus = showtime.getMovie().getStatus();

                                        return movieStatus == null
                                                        || !movieStatus.equalsIgnoreCase("hidden");
                                })
                                .filter(showtime -> requestedMovieTitle == null
                                                || showtime.getMovie()
                                                                .getTitle()
                                                                .equalsIgnoreCase(requestedMovieTitle))
                                .sorted(
                                                Comparator.comparing(
                                                                Showtime::getStartTime))
                                .collect(Collectors.toList());

                if (showtimes.isEmpty()) {
                        if (requestedMovieTitle != null) {
                                return "Hiện chưa có suất chiếu phim "
                                                + requestedMovieTitle
                                                + " vào ngày "
                                                + requestedDate.format(
                                                                DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                                                + ".";
                        }

                        return "Hiện chưa có lịch chiếu vào ngày "
                                        + requestedDate.format(
                                                        DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                                        + ".";
                }

                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

                NumberFormat moneyFormatter = NumberFormat.getNumberInstance(
                                new Locale("vi", "VN"));

                StringBuilder answer = new StringBuilder();

                answer.append("Lịch chiếu ngày ")
                                .append(requestedDate.format(dateFormatter))
                                .append(":\n\n");

                for (Showtime showtime : showtimes) {
                        answer.append(showtime.getMovie().getTitle())
                                        .append(" - ")
                                        .append(
                                                        showtime.getStartTime()
                                                                        .format(timeFormatter))
                                        .append(" - phòng ")
                                        .append(showtime.getRoomId())
                                        .append(" - giá vé ");

                        if (showtime.getTicketPrice() != null) {
                                answer.append(
                                                moneyFormatter.format(
                                                                showtime.getTicketPrice()))
                                                .append("đ");
                        } else {
                                answer.append("chưa cập nhật");
                        }

                        answer.append("\n");
                }

                return answer.toString().trim();
        }

        public String askGemini(
                        String userMessage,
                        List<Map<String, String>> history) {
                if (userMessage == null || userMessage.isBlank()) {
                        return "Bạn vui lòng nhập câu hỏi.";
                }

                // Lịch chiếu, phòng và giá lấy thẳng từ database
                if (isShowtimeQuestion(userMessage)) {
                        return buildExactShowtimeAnswer(userMessage);
                }

                // Những câu cần Gemini mới kiểm tra API key
                if (apiKey.isEmpty()) {
                        return "Không tìm thấy GEMINI_API_KEY trong file .env.";
                }

                String systemContext = "Bạn là trợ lý ảo của rạp phim LAS Cinemas. "
                                + "Luôn trả lời bằng tiếng Việt, thân thiện và ngắn gọn. "
                                + "Bạn được hướng dẫn khách về: đăng ký, đăng nhập, chọn phim, "
                                + "chọn ngày, chọn suất chiếu, chọn ghế, mua F&B, dùng voucher, "
                                + "thanh toán, xem lịch sử đặt vé và gửi đánh giá. "
                                + "Quy trình đặt vé là: đăng nhập → chọn phim → chọn ngày và suất chiếu "
                                + "→ chọn ghế → chọn F&B → nhập voucher nếu có → thanh toán. "
                                + "Chỉ vé đã sử dụng mới được gửi đánh giá. "
                                + "Khi trả lời phim, lịch chiếu, phòng và giá vé, chỉ được dùng dữ liệu "
                                + "được cung cấp từ hệ thống, tuyệt đối không tự bịa. "
                                + "Nếu không tìm thấy dữ liệu, hãy nói hiện chưa có thông tin. "
                                + "Bạn chỉ hướng dẫn thao tác, không được tuyên bố đã đặt vé hoặc "
                                + "thanh toán thay khách. "
                                + "Nếu câu hỏi không liên quan LAS Cinemas, hãy từ chối lịch sự. "
                                + "Chỉ trả lời bằng văn bản thuần. "
                                + "Không sử dụng Markdown, không dùng dấu **, dấu # hoặc dấu * để định dạng. "
                                + "Khi liệt kê lịch chiếu, mỗi suất chiếu phải nằm trên một dòng riêng "
                                + "theo dạng: Tên phim - giờ chiếu - phòng - giá vé."
                                + "Khi người dùng hỏi lịch chiếu, phải liệt kê đầy đủ tất cả suất chiếu "
                                + "của ngày được hỏi có trong dữ liệu hệ thống. "
                                + "Không được tóm tắt, không được bỏ bớt và không được dừng giữa câu. ";
                try {
                        ObjectNode payload = objectMapper.createObjectNode();

                        ObjectNode systemInstruction = payload.putObject("system_instruction");

                        systemInstruction
                                        .putArray("parts")
                                        .addObject()
                                        .put("text", systemContext + buildCinemaContext());

                        ArrayNode contents = payload.putArray("contents");

                        // Gửi tối đa 8 tin nhắn trước đó để AI nhớ cuộc trò chuyện
                        if (history != null) {
                                int start = Math.max(0, history.size() - 8);

                                for (int index = start; index < history.size(); index++) {
                                        Map<String, String> item = history.get(index);

                                        if (item == null)
                                                continue;

                                        String text = item.get("text");
                                        String role = item.get("role");

                                        if (text == null || text.isBlank())
                                                continue;

                                        ObjectNode content = contents.addObject();

                                        content.put(
                                                        "role",
                                                        "model".equals(role) ? "model" : "user");

                                        content
                                                        .putArray("parts")
                                                        .addObject()
                                                        .put("text", text);
                                }
                        }

                        ObjectNode currentMessage = contents.addObject();
                        currentMessage.put("role", "user");

                        currentMessage
                                        .putArray("parts")
                                        .addObject()
                                        .put("text", userMessage.trim());

                        ObjectNode config = payload.putObject("generationConfig");

                        // Dữ liệu lịch chiếu không cần AI suy luận phức tạp
                        config.put("temperature", 0.1);

                        // Tăng giới hạn để đủ chỗ liệt kê toàn bộ suất chiếu
                        config.put("maxOutputTokens", 4096);

                        // Hạn chế Gemini sử dụng token cho phần suy luận nội bộ
                        ObjectNode thinkingConfig = config.putObject("thinkingConfig");

                        thinkingConfig.put("thinkingLevel", "minimal");
                        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                                        + "gemini-3.5-flash:generateContent";

                        HttpClient client = HttpClient.newBuilder()
                                        .connectTimeout(Duration.ofSeconds(10))
                                        .build();

                        HttpRequest request = HttpRequest.newBuilder()
                                        .uri(URI.create(url))
                                        .timeout(Duration.ofSeconds(30))
                                        .header("Content-Type", "application/json")
                                        .header("x-goog-api-key", apiKey)
                                        .POST(
                                                        HttpRequest.BodyPublishers.ofString(
                                                                        objectMapper.writeValueAsString(payload)))
                                        .build();

                        HttpResponse<String> response = client.send(
                                        request,
                                        HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() < 200
                                        || response.statusCode() >= 300) {

                                System.err.println(
                                                "Gemini HTTP STATUS: " + response.statusCode());

                                System.err.println(
                                                "Gemini RESPONSE: " + response.body());

                                return "Trợ lý AI đang tạm thời không phản hồi. "
                                                + "Bạn vui lòng thử lại sau.";
                        }

                        JsonNode responseJson = objectMapper.readTree(response.body());
                        System.out.println(
                                        "GEMINI FINISH REASON: "
                                                        + responseJson
                                                                        .path("candidates")
                                                                        .path(0)
                                                                        .path("finishReason")
                                                                        .asText());
                        JsonNode parts = responseJson
                                        .path("candidates")
                                        .path(0)
                                        .path("content")
                                        .path("parts");

                        StringBuilder fullAnswer = new StringBuilder();

                        if (parts.isArray()) {
                                for (JsonNode part : parts) {
                                        // Bỏ qua phần suy nghĩ nội bộ của Gemini
                                        if (part.path("thought").asBoolean(false)) {
                                                continue;
                                        }

                                        JsonNode textNode = part.path("text");

                                        if (!textNode.isMissingNode()
                                                        && !textNode.asText().isBlank()) {
                                                fullAnswer.append(textNode.asText());
                                        }
                                }
                        }

                        if (fullAnswer.toString().isBlank()) {
                                return "Tôi chưa tìm được câu trả lời phù hợp.";
                        }

                        return fullAnswer.toString().trim();

                } catch (Exception error) {
                        error.printStackTrace();

                        return "Hệ thống AI đang bận, bạn thử lại sau nhé.";
                }
        }
}