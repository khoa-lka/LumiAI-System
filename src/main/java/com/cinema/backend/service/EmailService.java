package com.cinema.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendSimpleEmail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(mimeMessage);
    }

    public String buildTicketEmailHtml(
        String customerName,
        String orderCode,
        String movieName,
        String showtime,
        String seats,
        String totalAmount,
        String ticketCode,
        String fnbSummary,
        String qrData
) {
    String safeQrData = URLEncoder.encode(qrData, StandardCharsets.UTF_8);
    String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + safeQrData;

    return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Vé xem phim LAS Cinema</title>
            </head>

            <body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:28px 0;">
                    <tr>
                        <td align="center">

                            <table width="620" cellpadding="0" cellspacing="0" align="center"
                                   style="width:620px; max-width:620px; background:#ffffff; border-radius:14px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">

                                <!-- HEADER -->
                                <tr>
                                    <td style="background:linear-gradient(135deg,#111827,#7f1d1d,#dc2626); padding:20px 28px;">
                                        <table width="100%%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="left" valign="middle">
                                                    <img src="cid:logoImage"
                                                         alt="LAS Cinema"
                                                         style="height:44px; width:auto; display:block;">
                                                </td>

                                                <td align="right" valign="middle" style="color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
                                                    <div style="font-size:12px; opacity:0.85;">Vé điện tử</div>
                                                    <div style="font-size:20px; font-weight:800;">LAS CINEMA</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- GREETING -->
                                <tr>
                                    <td style="padding:24px 28px 8px; font-family:Arial, Helvetica, sans-serif;">
                                        <p style="margin:0 0 8px; font-size:15px; color:#111827;">
                                            Kính gửi: <strong>%s</strong>,
                                        </p>
                                        <p style="margin:0; font-size:13px; color:#4b5563; line-height:1.6;">
                                            Cảm ơn bạn đã đặt vé thành công tại LAS Cinema. Vui lòng kiểm tra thông tin vé bên dưới trước khi đến rạp.
                                        </p>
                                    </td>
                                </tr>

                                <!-- TICKET BODY -->
                                <tr>
                                    <td style="padding:18px 28px 10px;">

                                        <table width="100%%" cellpadding="0" cellspacing="0"
                                               style="border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">
                                            <tr>
                                                <!-- POSTER -->
                                                <td width="190" valign="top" style="background:#111827; padding:14px;">
                                                    <img src="cid:posterImage"
                                                         alt="Poster phim"
                                                         style="width:162px; height:242px; object-fit:cover; border-radius:10px; display:block; margin:0 auto;">
                                                </td>

                                                <!-- INFO -->
                                                <td valign="top" style="padding:22px 24px; font-family:Arial, Helvetica, sans-serif;">

                                                    <div style="font-size:11px; color:#dc2626; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                                                        Thông tin vé
                                                    </div>

                                                    <h2 style="margin:8px 0 12px;
                                                               font-size:22px;
                                                               line-height:1.35;
                                                               font-weight:700;
                                                               color:#111827;
                                                               font-family:Arial, Helvetica, sans-serif;">
                                                        %s
                                                    </h2>

                                                    <table width="100%%" cellpadding="6" cellspacing="0" style="font-size:13px; font-family:Arial, Helvetica, sans-serif;">
                                                        <tr>
                                                            <td style="color:#6b7280; width:92px;">Mã đơn</td>
                                                            <td style="color:#111827; font-weight:700;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#6b7280;">Suất chiếu</td>
                                                            <td style="color:#111827; font-weight:700;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#6b7280;">Ghế</td>
                                                            <td style="color:#111827; font-weight:700;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#6b7280;">Mã vé</td>
                                                            <td style="color:#111827; font-weight:700;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color:#6b7280;">Combo F&amp;B</td>
                                                            <td style="color:#111827; font-weight:700;">%s</td>
                                                        </tr>
                                                    </table>

                                                    <div style="margin-top:16px;
                                                                padding:12px 14px;
                                                                background:#fff7ed;
                                                                border-left:5px solid #f97316;
                                                                border-radius:12px;
                                                                font-family:Arial, Helvetica, sans-serif;">
                                                        <div style="font-size:12px; color:#9a3412; margin-bottom:5px;">
                                                            Tổng thanh toán
                                                        </div>
                                                        <div style="font-size:25px; font-weight:900; color:#dc2626;">
                                                            %s VNĐ
                                                        </div>
                                                    </div>

                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>

                                <!-- QR BLOCK -->
                                <tr>
                                    <td style="padding:14px 28px;">
                                        <table width="100%%" cellpadding="0" cellspacing="0"
                                               style="width:100%%; border:1px dashed #9ca3af; border-radius:12px; background:#f9fafb;">
                                            <tr>
                                                <td width="130" align="center" style="padding:14px;">
                                                    <img src="%s" alt="QR Code"
                                                         style="width:105px; height:105px; display:block;">
                                                    <div style="font-size:10px; color:#6b7280; margin-top:6px;">
                                                        Quét mã tại rạp
                                                    </div>
                                                </td>

                                                <td style="padding:14px 16px; font-family:Arial, Helvetica, sans-serif;">
                                                    <div style="font-size:14px; font-weight:700; color:#111827; margin-bottom:6px;">
                                                        Mã QR vé điện tử
                                                    </div>

                                                    <p style="margin:0 0 8px; font-size:12px; color:#4b5563; line-height:1.5;">
                                                        Quý khách vui lòng xuất trình mã QR này tại quầy hoặc cổng kiểm soát vé.
                                                    </p>

                                                    <div style="font-size:12px; color:#dc2626; font-weight:700; word-break:break-word;">
                                                        %s
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- NOTE -->
                                <tr>
                                    <td style="padding:0 28px 20px;">
                                        <div style="background:#111827;
                                                    color:#e5e7eb;
                                                    border-radius:10px;
                                                    padding:14px 16px;
                                                    font-family:Arial, Helvetica, sans-serif;">
                                            <div style="font-weight:700; font-size:13px; margin-bottom:6px; color:#ffffff;">
                                                Lưu ý trước khi đến rạp
                                            </div>

                                            <ul style="margin:0; padding-left:16px; font-size:11.5px; line-height:1.6;">
                                                <li>Vui lòng đến trước giờ chiếu ít nhất 15 phút.</li>
                                                <li>Vé đã thanh toán thành công không hỗ trợ hoàn/hủy nếu đã quá thời gian quy định.</li>
                                                <li>Không chia sẻ mã QR vé cho người khác để tránh mất quyền sử dụng vé.</li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>

                                <!-- FOOTER -->
                                <tr>
                                    <td style="background:#f9fafb; text-align:center; padding:16px 24px; border-top:1px solid #e5e7eb; font-family:Arial, Helvetica, sans-serif;">
                                        <p style="margin:0 0 4px; font-size:12px; color:#6b7280;">
                                            LAS Cinema - Trải nghiệm điện ảnh hiện đại
                                        </p>
                                        <p style="margin:0; font-size:11px; color:#9ca3af;">
                                            Email này được gửi tự động. Vui lòng không trả lời email này.
                                        </p>
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(
            customerName,
            movieName,
            orderCode,
            showtime,
            seats,
            ticketCode,
            fnbSummary,
            totalAmount,
            qrUrl,
            qrData
    );
}

    private String cleanImagePath(String path) {
    if (path == null) {
        return "";
    }

    path = path.trim();

    // bỏ dấu / đầu
    while (path.startsWith("/")) {
        path = path.substring(1);
    }

    // bỏ query ?v=1
    int queryIndex = path.indexOf("?");
    if (queryIndex >= 0) {
        path = path.substring(0, queryIndex);
    }

    return path;
}

public void sendTicketHtmlEmailWithImages(
        String to,
        String subject,
        String htmlContent,
        String logoPath,
        String posterPath
) throws Exception {

    MimeMessage mimeMessage = mailSender.createMimeMessage();

    MimeMessageHelper helper = new MimeMessageHelper(
            mimeMessage,
            MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
            "UTF-8"
    );

    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(htmlContent, true);

    // Logo
    if (logoPath != null && !logoPath.isBlank()) {
        ClassPathResource logoResource = new ClassPathResource("static/" + cleanImagePath(logoPath));

        if (logoResource.exists()) {
            helper.addInline("logoImage", logoResource);
        } else {
            System.out.println("KHÔNG TÌM THẤY LOGO: " + logoPath);
        }
    }

    // Poster
    if (posterPath != null && !posterPath.isBlank()) {
        ClassPathResource posterResource = new ClassPathResource("static/" + cleanImagePath(posterPath));

        if (posterResource.exists()) {
            helper.addInline("posterImage", posterResource);
        } else {
            System.out.println("KHÔNG TÌM THẤY POSTER: " + posterPath);
        }
    }

    mailSender.send(mimeMessage);
}
}