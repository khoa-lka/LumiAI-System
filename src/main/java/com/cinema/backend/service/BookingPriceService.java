package com.cinema.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.backend.entities.CheckoutFoodItem;
import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.FoodBeverage;
import com.cinema.backend.entities.Showtime;
import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.FoodBeverageRepository;
import com.cinema.backend.repositories.ShowtimeRepository;
import com.cinema.backend.repositories.VoucherRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.cinema.backend.entities.Seat;
import com.cinema.backend.repositories.SeatRepository;

@Service
public class BookingPriceService {

    private static final BigDecimal ONE_HUNDRED =
            BigDecimal.valueOf(100);

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private FoodBeverageRepository foodRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
private SeatRepository seatRepository;

    public BigDecimal calculateFinalAmount(
            CheckoutRequest request
    ) {
        if (request == null) {
            throw new RuntimeException(
                    "Dữ liệu thanh toán không tồn tại"
            );
        }

        if (request.getShowtimeId() == null) {
            throw new RuntimeException(
                    "Thiếu mã suất chiếu"
            );
        }

        if (request.getSeats() == null ||
                request.getSeats().isEmpty()) {

            throw new RuntimeException(
                    "Danh sách ghế không được để trống"
            );
        }

        Showtime showtime = showtimeRepository
                .findById(request.getShowtimeId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy suất chiếu"
                        )
                );

        if (showtime.getMovie() == null) {
    throw new RuntimeException(
            "Suất chiếu chưa có thông tin phim"
    );
}

String movieStatus =
        showtime.getMovie()
                .getStatus();

String normalizedStatus =
        movieStatus == null
                ? ""
                : movieStatus
                        .trim()
                        .toUpperCase()
                        .replace("-", "_")
                        .replace(" ", "_");

if (
        "COMING_SOON".equals(
                normalizedStatus
        ) ||
        "UPCOMING".equals(
                normalizedStatus
        ) ||
        "SẮP_CHIẾU".equals(
                normalizedStatus
        ) ||
        "SAP_CHIEU".equals(
                normalizedStatus
        )
) {
    throw new RuntimeException(
            "Phim sắp chiếu hiện chưa mở bán vé"
    );
}

        if (showtime.getTicketPrice() == null) {
            throw new RuntimeException(
                    "Suất chiếu chưa có giá vé"
            );
        }

        // Tiền vé
        // =====================================================
// TÍNH TIỀN VÉ THEO ĐÚNG LOẠI GHẾ
// =====================================================

List<Seat> roomSeats =
        seatRepository.findByRoomId(
                showtime.getRoomId()
        );

Map<String, Seat> seatMap =
        new HashMap<>();

for (Seat seat : roomSeats) {
    String seatCode =
            (
                seat.getSeatRow() +
                seat.getSeatNumber()
            )
            .trim()
            .toUpperCase();

    seatMap.put(
            seatCode,
            seat
    );
}

BigDecimal grossAmount =
        BigDecimal.ZERO;

for (String requestedSeatCode :
        request.getSeats()) {

    if (requestedSeatCode == null ||
            requestedSeatCode.isBlank()) {

        throw new RuntimeException(
                "Mã ghế không hợp lệ"
        );
    }

    String normalizedSeatCode =
            requestedSeatCode
                    .trim()
                    .toUpperCase();

    Seat seat =
            seatMap.get(
                    normalizedSeatCode
            );

    if (seat == null) {
        throw new RuntimeException(
                "Không tìm thấy ghế: " +
                normalizedSeatCode
        );
    }

    String seatType =
            seat.getSeatType() == null
                    ? "STANDARD"
                    : seat.getSeatType()
                            .trim()
                            .toUpperCase();

    BigDecimal seatPrice;

    switch (seatType) {
        case "VIP":
            seatPrice =
                    BigDecimal.valueOf(
                            110000
                    );
            break;

        case "SWEETBOX":
            seatPrice =
                    BigDecimal.valueOf(
                            250000
                    );
            break;

        default:
            seatPrice =
                    BigDecimal.valueOf(
                            90000
                    );
            break;
    }

    grossAmount =
            grossAmount.add(
                    seatPrice
            );
}

        // Tiền F&B
        if (request.getFnb() != null) {
    for (CheckoutFoodItem item : request.getFnb()) {

        if (item == null ||
                item.getFoodItemId() == null ||
                item.getQuantity() == null ||
                item.getQuantity() <= 0) {

            continue;
        }

                FoodBeverage food = foodRepository
                        .findById(item.getFoodItemId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy món ăn có ID: "
                                                + item.getFoodItemId()
                                )
                        );

                if (food.getPrice() == null) {
                    throw new RuntimeException(
                            "Món ăn chưa có giá"
                    );
                }

                BigDecimal quantity =
                BigDecimal.valueOf(
                        item.getQuantity().longValue()
                );

                BigDecimal foodAmount =
                food.getPrice().multiply(quantity);


                grossAmount =
                        grossAmount.add(foodAmount);
            }
        }

        BigDecimal discount = BigDecimal.ZERO;

        // Voucher
        if (request.getVoucherCode() != null &&
                !request.getVoucherCode().isBlank()) {

            String voucherCode =
                    request.getVoucherCode()
                            .trim()
                            .toUpperCase();

            Voucher voucher = voucherRepository
                    .findByVoucherCode(voucherCode)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Voucher không tồn tại"
                            )
                    );

            if (voucher.getStatus() != null &&
                    !"ACTIVE".equalsIgnoreCase(
                            voucher.getStatus()
                    )) {

                throw new RuntimeException(
                        "Voucher không còn hoạt động"
                );
            }

            if (voucher.getExpiredDate() != null &&
                    voucher.getExpiredDate()
                            .isBefore(LocalDateTime.now())) {

                throw new RuntimeException(
                        "Voucher đã hết hạn"
                );
            }

            if (voucher.getUsageLimit() == null ||
                    voucher.getUsageLimit() <= 0) {

                throw new RuntimeException(
                        "Voucher đã hết lượt sử dụng"
                );
            }

            if (voucher.getMinimumOrder() != null &&
                    grossAmount.compareTo(
                            voucher.getMinimumOrder()
                    ) < 0) {

                throw new RuntimeException(
                        "Đơn hàng chưa đạt giá trị tối thiểu"
                );
            }

            if (voucher.getDiscountValue() == null) {
                throw new RuntimeException(
                        "Voucher chưa có giá trị giảm"
                );
            }

            // discountValue đã là BigDecimal
            BigDecimal discountValue =
                    voucher.getDiscountValue();

            String discountType =
                    voucher.getDiscountType() == null
                            ? ""
                            : voucher.getDiscountType()
                                    .trim()
                                    .toUpperCase();

            if ("PERCENT".equals(discountType)) {

                discount = grossAmount
                        .multiply(discountValue)
                        .divide(
                                ONE_HUNDRED,
                                2,
                                RoundingMode.HALF_UP
                        );

                if (voucher.getMaxDiscount() != null &&
                        discount.compareTo(
                                voucher.getMaxDiscount()
                        ) > 0) {

                    discount =
                            voucher.getMaxDiscount();
                }

            } else if (
                    "FIXED".equals(discountType) ||
                    "AMOUNT".equals(discountType)
            ) {
                discount = discountValue;

            } else {
                throw new RuntimeException(
                        "Loại giảm giá không hợp lệ: "
                                + voucher.getDiscountType()
                );
            }
        }

        if (discount.compareTo(grossAmount) > 0) {
            discount = grossAmount;
        }

        BigDecimal finalAmount =
                grossAmount.subtract(discount);

        return finalAmount.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }
}