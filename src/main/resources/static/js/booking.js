console.log("BOOKING JS LOADED");
window.selectedPaymentGateway = "qr";

// ============================================================================
// MERGED FILE: booking(21) is the base. Missing upgrades from booking(20) were
// restored, while booking(21)'s newer voucher/timer/UI fixes were preserved.
// ============================================================================

// Thông báo thống nhất theo FE của booking(15): luôn ưu tiên showCgvToast.
// 🎨 Icon outline trắng dùng chung cho khối Rà soát hóa đơn
const ICON_MOVIE =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l1.3-4a1 1 0 011-.7l13 2.3a1 1 0 01.8 1.2L18.5 10"/><rect x="3" y="10" width="18" height="9" rx="1.3"/><path d="M6.3 6.3l2 3.7M11 5.3l2 3.7M15.7 4.6l2 3.7"/></svg>';
const ICON_CLOCK =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
const ICON_SEAT =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13V6a1.5 1.5 0 013 0v6"/><path d="M15 13V6a1.5 1.5 0 013 0v6"/><path d="M5 13h14v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3z"/><path d="M7 18v2M17 18v2"/></svg>';
const ICON_POPCORN =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9l1.2 11a1.2 1.2 0 001.2 1.1h5.2a1.2 1.2 0 001.2-1.1L17 9"/><path d="M5.5 9a2.3 2.3 0 012-3.6 2.3 2.3 0 014-1.4 2.3 2.3 0 014 1.4 2.3 2.3 0 012 3.6z"/></svg>';
const ICON_TICKET =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a1.5 1.5 0 000 3v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a1.5 1.5 0 000-3V8z"/><path d="M9 6v12" stroke-dasharray="2 2"/></svg>';
const ICON_CALENDAR =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const ICON_DOWNLOAD =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>';
const ICON_INFO =
  '<svg class="inv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>';

// 🚀 THÊM MỚI: Khai báo mảng fnbMenu toàn cục ban đầu trống
window.fnbMenu = [];
function resetFnbSelection() {
  if (Array.isArray(window.fnbMenu)) {
    window.fnbMenu.forEach((item) => {
      item.qty = 0;
    });
  }
}

// ============================================================================
// MERGE booking(20) -> booking(21): dọn dữ liệu của đơn trước.
// Chỉ dùng khi bắt đầu một đơn mới hoặc sau khi checkout thành công.
// ============================================================================
function resetPreviousOrderExtras() {
  window.currentVoucher = null;
  window.selectedVoucherCode = null;
  appliedVoucherDiscount = 0;
  currentPriceTotal = 0;
  window.finalPriceTotal = 0;

  resetFnbSelection();

  // Xóa dữ liệu phục hồi/thanh toán cũ để đơn sau không dùng nhầm.
  window.vnpayRestoreFnb = null;
  window.fnbRestorePromise = null;
  window.currentVnpayReference = null;
  window.currentQrRef = null;
  window.currentPayOSOrderCode = null;
  window.currentPayOSPaymentLinkId = null;

  sessionStorage.removeItem("checkoutPayload");
  sessionStorage.removeItem("pendingBooking");
  localStorage.removeItem("pending_booking");
  localStorage.removeItem("las_current_booking_cache");

  const voucherInput = document.getElementById("voucher-input");
  if (voucherInput) voucherInput.value = "";

  const sumFnb = document.getElementById("sum-fnb");
  if (sumFnb) sumFnb.innerText = "0 Combo";

  const sumTotal = document.getElementById("sum-total");
  if (sumTotal) sumTotal.innerText = "0 đ";

  const reviewTotal = document.getElementById("review-final-total");
  if (reviewTotal) reviewTotal.innerText = "0 đ";

  const rawTotal = document.querySelector(".inv-total-amt");
  if (rawTotal) rawTotal.innerText = "0 đ";

  if (typeof renderFnbMenu === "function") renderFnbMenu();
}
window.resetPreviousOrderExtras = resetPreviousOrderExtras;

// Giữ các bản sửa của booking(21) về timer/ghế cũ, nhưng chỉ chạy khi mở đơn mới.
function resetBookingVisualState() {
  if (typeof timerInterval !== "undefined" && timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (typeof paymentTimerInterval !== "undefined" && paymentTimerInterval) {
    clearInterval(paymentTimerInterval);
    paymentTimerInterval = null;
  }

  if (typeof stopVietQRTimer === "function") stopVietQRTimer();
  if (typeof stopQrPaymentPolling === "function") stopQrPaymentPolling();

  const holdTimer = document.getElementById("hold-timer");
  if (holdTimer) holdTimer.style.display = "none";

  const timerString = document.getElementById("timer-string");
  if (timerString) timerString.innerText = "10:00";

  document
    .querySelectorAll(".seat.selected, .seat.active")
    .forEach((seatEl) => seatEl.classList.remove("selected", "active"));

  const invoiceContent = document.getElementById("review-invoice-content");
  if (invoiceContent) invoiceContent.innerHTML = "";
}

function startFreshBookingSession() {
  if (typeof window.markNewBookingSession === "function") {
    window.markNewBookingSession();
  }

  resetPreviousOrderExtras();
  resetBookingVisualState();

  selectedSeats = [];
  selectedShowtime = "";
  selectedDateStr = "";
  window.currentSelectedShowtimeId = null;
  currentBookingStep = 1;
  isHoldingState = false;
  window.bookingExpireAt = null;

  if (typeof bookingTimeoutHandled !== "undefined") {
    bookingTimeoutHandled = false;
  }

  if (typeof _qrCheckoutDone !== "undefined") {
    _qrCheckoutDone = false;
  }
}
window.startFreshBookingSession = startFreshBookingSession;
// Hàm tự động gọi lên Spring Boot lấy toàn bộ bắp nước thật bốc từ Database
function initFnbMenuFromServer() {
  if (typeof API !== "undefined" && typeof API.getFnbItems === "function") {
    API.getFnbItems()
      .then((dbItems) => {
        // Map chuyển đổi cấu trúc DB sang cấu trúc mảng cũ của em để không lỗi logic tính tiền
        window.fnbMenu = dbItems.map((item) => ({
          id: item.foodItemId,
          name: item.itemName, // Đổi itemName sang name để khớp code cũ
          price: item.price,
          qty: 0, // Khởi tạo số lượng đặt mua ban đầu bằng 0
        }));

        // Sau khi nạp xong data thật, gọi hàm vẽ giao diện F&B ở màn hình đặt vé của em
        if (typeof renderFnbMenu === "function") {
          renderFnbMenu();
        }
      })
      .catch((err) => {
        console.error("🚨 Lỗi nạp dữ liệu F&B động cho trang đặt vé:", err);
      });
  }
}

function handleBookNowClick() {
  if (
    typeof window.isBookingRestrictedRole === "function" &&
    window.isBookingRestrictedRole()
  ) {
    if (typeof showBookingRestrictedModal === "function") {
      showBookingRestrictedModal();
    }
    return;
  }

  const ticket = document.getElementById("final-ticket-result");
  if (ticket) ticket.innerHTML = "";

  if (!isUserLoggedInState) {
    window.showCgvToast("Vui lòng đăng nhập hệ thống để tiếp tục đặt vé!");
    openAuthModal();
    return;
  }

  // Không reset khi đang phục hồi giao dịch VNPAY.
  if (!window.isVnpayReturn) {
    startFreshBookingSession();
  }

  const detailMovieTitle = document.getElementById("detail-movie-title");
  const currentMovieTitle = detailMovieTitle?.innerText || "-";

  switchCgvTab("panel-booking");

  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo && currentMovieTitle !== "-") {
    if (
      [...selectCombo.options].some(
        (option) => option.value === currentMovieTitle,
      )
    ) {
      selectCombo.value = currentMovieTitle;
    }

    onMovieOrTimeChange();
  }

  if (typeof goToBookingStep === "function") goToBookingStep(1);
}

// 🚀 THÊM MỚI: Hàm chịu trách nhiệm gọi API lấy lịch chiếu động từ Database
// ====== TÌM VÀ SỬA LẠI HOÀN CHỈNH HÀM loadShowtimesFromServer() TRONG booking.js ======
function loadShowtimesFromServer() {
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (!selectCombo) return;

  // 1. Giữ nguyên logic bọc lót dropdown cực tốt của em
  let currentComboValue = selectCombo.value;
  //console.log("🔥 SHOWTIME RAW:", serverData.showtimes);

  const detailTitleEl = document.getElementById("detail-movie-title");
  if (
    (!currentComboValue || currentComboValue === "-") &&
    detailTitleEl &&
    detailTitleEl.innerText !== "-"
  ) {
    currentComboValue = detailTitleEl.innerText;
    selectCombo.value = currentComboValue;
  }

  if (
    (!currentComboValue || currentComboValue === "-") &&
    selectCombo.options.length > 0
  ) {
    currentComboValue = selectCombo.options[0].value;
    selectCombo.value = currentComboValue;
  }

  if (!currentComboValue || currentComboValue === "-") {
    console.warn(
      "⚠️ Không thể tải suất chiếu vì chưa có bộ phim nào được chọn!",
    );
    return;
  }

  // ==========================================================================
  // 🚀 ĐOẠN ĐÃ TỐI ƯU: Loại bỏ khối API.getShowtimes() dư thừa ở đây.
  // Chỉ kích hoạt duy nhất hàm vẽ giao diện tổng để nhường quyền Fetch
  // dữ liệu cho hàm renderCgvInterface() bên ui.js xử lý tập trung.
  // ==========================================================================
  if (typeof renderCgvInterface === "function") {
    renderCgvInterface();
  }
}

// 🚀 THÊM MỚI: Hàm vẽ danh sách các nút bấm suất chiếu động
function renderDynamicShowtimeGrid() {
  const timeGrid = document.getElementById("cgv-showtime-grid");
  if (!timeGrid) return;

  timeGrid.innerHTML = "";

  if (serverData.showtimes.length === 0) {
    timeGrid.innerHTML = "<p style='color:#a8a8b3'>Không có suất chiếu.</p>";
    return;
  }

  serverData.showtimes.forEach((t) => {
    const active =
      t.showtimeId === window.currentSelectedShowtimeId ? "active" : "";

    timeGrid.innerHTML += `
            <div class="showtime-btn ${active}"
                 onclick="selectTime(${t.showtimeId}, '${t.startTime}')">

                ${t.startTime}

                <span style="font-size:10px;display:block">
                    Phòng ${t.roomId}
                </span>

            </div>
        `;
  });

  const currentShowtimeObj = serverData.showtimes.find(
    (t) => String(t.showtimeId) === String(window.currentSelectedShowtimeId),
  );

  document.getElementById("sum-showtime").innerText = currentShowtimeObj
    ? currentShowtimeObj.startTime
    : "-";
}

function quickBookMovie(movieTitle) {
  if (
    typeof window.isBookingRestrictedRole === "function" &&
    window.isBookingRestrictedRole()
  ) {
    if (typeof showBookingRestrictedModal === "function") {
      showBookingRestrictedModal();
    }
    return;
  }

  if (!window.isVnpayReturn) {
    startFreshBookingSession();
  }

  switchCgvTab("panel-booking");

  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    onMovieOrTimeChange();
  }

  if (typeof goToBookingStep === "function") goToBookingStep(1);
}

function loadSeatMap(showtimeId) {
  const seatGrid = document.getElementById("cgv-seat-grid");

  if (seatGrid) {
    seatGrid.innerHTML =
      "<p style='color:#fff; padding:20px;'>Đang tải sơ đồ ghế thực tế...</p>";
  }

  API.getSeatsByShowtime(showtimeId)
    .then((backendSeats = []) => {
      // 🚀 KHÓA CHẶT TẠI ĐÂY: Đồng bộ găm biến toàn cục cho cả booking.js bốc dùng ở Bước 3
      window.currentBackendSeats = backendSeats;

      const currentMovie = document.getElementById("cgv-combo-movie").value;

      // Đảm bảo structure tồn tại
      if (!serverData.masterSeatStore[currentMovie]) {
        serverData.masterSeatStore[currentMovie] = {};
      }

      // Khởi tạo trạng thái dựa trên danh sách ghế thật từ server nhả về
      const activeSeatMap = {};
      if (Array.isArray(backendSeats)) {
        backendSeats.forEach((s) => {
          const row = s.seatRow || s.seat_row || "";
          const num = s.seatNumber || s.seat_number || "";
          const id = `${row}${num}`.trim().toUpperCase();

          activeSeatMap[id] = {
            status:
              s.status === "sold" ||
              s.status === "BOOKED" ||
              s.status === "SLOT_LOCKED"
                ? "sold"
                : "available",
            seatType: s.seatType || s.seat_type || "STANDARD",
          };
        });
      }

      serverData.masterSeatStore[currentMovie][showtimeId] = activeSeatMap;

      // Tính toán giỏ hàng dựa trên logic backend mới của Khoa
      calculateCgvCart();

      // Nếu có ui.js thì vẽ giao diện, không thì bọc lót an toàn
      if (typeof renderCgvInterface === "function") {
        renderCgvInterface();
      }
    })
    .catch((err) => {
      console.error("🚨 Lỗi đồng bộ dữ liệu ghế từ Server:", err);
      calculateCgvCart();
    });
}

function initSeatTemplate() {
  const seats = {};

  const rows = ["A", "B", "C", "D"];
  const count = 10;

  rows.forEach((r) => {
    for (let i = 1; i <= count; i++) {
      seats[r + i] = { status: "available" };
    }
  });

  return seats;
}

function onMovieOrTimeChange() {
  resetHoldState();

  selectedSeats = [];

  // ❌ KHÔNG reset showtime ở đây nếu chưa chọn phim mới hoàn toàn
  selectedShowtime = "";

  loadShowtimesFromServer();
}

// Đưa hàm selectCgvBookingDate ra phạm vi toàn cục window để nút bấm ở ui.js click được
window.selectCgvBookingDate = selectCgvBookingDate;

function calculateCgvCart() {
  window.calculateCgvCart = calculateCgvCart;

  document.getElementById("sum-seats").innerText =
    selectedSeats.join(", ") || "Chưa chọn";
  let total = 0;
  let totalFnbItems = 0;

  // 🚀 LOGIC ĐỘC LẬP HOÀN TOÀN TỪ BACKEND CỦA KHOA: Cấm quét DOM
  selectedSeats.forEach((seatId) => {
    let price = 90000;

    if (
      window.currentBackendSeats &&
      Array.isArray(window.currentBackendSeats)
    ) {
      const seatData = window.currentBackendSeats.find((s) => {
        const row = (s.seatRow || s.seat_row || "")
          .toString()
          .trim()
          .toUpperCase();
        const num = (s.seatNumber || s.seat_number || "").toString().trim();
        return `${row}${num}` === seatId.toUpperCase();
      });

      if (seatData) {
        const type = (
          seatData.seatType ||
          seatData.seat_type ||
          "STANDARD"
        ).toUpperCase();
        switch (type) {
          case "VIP":
            price = 110000;
            break;
          case "SWEETBOX":
            price = 250000;
            break;
          default:
            price = 90000;
        }
      }
    }
    total += price;
  });

  // 2. Tính tiền F&B động từ database mẫu
  const activeFnbMenu = window.fnbMenu;
  activeFnbMenu.forEach((item) => {
    total += (Number(item.qty) || 0) * (Number(item.price) || 0);
    totalFnbItems += Number(item.qty) || 0;
  });

  const sumFnbEl = document.getElementById("sum-fnb");
  if (sumFnbEl) sumFnbEl.innerText = totalFnbItems + " Combo";

  currentPriceTotal = total;
  // 🎟️ HỢP NHẤT LOGIC TÍNH TỔNG TIỀN SAU GIẢM GIÁ VOUCHER
  let discount = 0;

  if (window.currentVoucher) {
    const voucher = window.currentVoucher;

    const voucherStatus = String(voucher.status || "ACTIVE").toUpperCase();

    const minimumOrder = Number(
      voucher.minimumOrder ?? voucher.minimum_order ?? 0,
    );

    const usageLimit = Number(voucher.usageLimit ?? voucher.usage_limit ?? 0);

    const expiredDate = voucher.expiredDate ?? voucher.expired_date;

    const isExpired =
      expiredDate && new Date(expiredDate).getTime() < Date.now();

    const canApplyVoucher =
      voucherStatus === "ACTIVE" &&
      usageLimit > 0 &&
      !isExpired &&
      currentPriceTotal >= minimumOrder;

    if (canApplyVoucher) {
      const discountType = String(
        voucher.discountType ?? voucher.discount_type ?? "",
      ).toUpperCase();

      const discountValue = Number(
        voucher.discountValue ?? voucher.discount_value ?? 0,
      );

      if (discountType === "PERCENT") {
        discount = (currentPriceTotal * discountValue) / 100;

        const maxDiscount = Number(
          voucher.maxDiscount ?? voucher.max_discount ?? 0,
        );

        if (maxDiscount > 0) {
          discount = Math.min(discount, maxDiscount);
        }
      } else if (discountType === "FIXED" || discountType === "AMOUNT") {
        discount = discountValue;
      }
    } else {
      discount = 0;
    }
  }

  // Lưu số tiền giảm giá thực tế vào biến toàn cục
  appliedVoucherDiscount = discount;

  const finalTotal = Math.max(currentPriceTotal - discount, 0);
  window.finalPriceTotal = finalTotal;

  // Cập nhật lên giao diện hiển thị cho khách hàng (Bọc an toàn từ main)
  const sumTotalEl = document.getElementById("sum-total");
  if (sumTotalEl) {
    sumTotalEl.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
  }
}

// Chạy mồi một lần ngay lập tức để window nhận diện hàm này toàn cục
window.calculateCgvCart = calculateCgvCart;

function goToBookingStep(step) {
  const targetStep = Number(step);

  const shouldBlockComingSoon =
    window.blockComingSoonCheckout === true ||
    (typeof window.isCurrentMovieComingSoon === "function" &&
      window.isCurrentMovieComingSoon());

  if (targetStep > 1 && shouldBlockComingSoon) {
    if (typeof window.showComingSoonBookingModal === "function") {
      window.showComingSoonBookingModal();
    } else {
      window.showCgvToast("Phim sắp chiếu hiện chưa mở bán vé.", "error");
    }

    return;
  }

  console.log("goToBookingStep =", step);
  document
    .querySelectorAll(".las-step-bar-container .step-item")
    .forEach((el, idx) => {
      if (idx + 1 === step) el.classList.add("active");
      else el.classList.remove("active");
    });

  document
    .querySelectorAll(".booking-step")
    .forEach((el) => el.classList.remove("active"));
  const currentStepEl = document.getElementById("booking-step-" + step);
  if (currentStepEl) currentStepEl.classList.add("active");

  const mainBtn = document.getElementById("btn-main-action");
  const backBtn = document.querySelector(".btn-flow-back");
  const layoutGrid = document.querySelector(".booking-two-columns-layout");
  const rightColumn = document.querySelector(".right-invoice-sticky-column");

  if (step === 1) {
    if (layoutGrid) layoutGrid.style.gridTemplateColumns = "1fr 380px";
    if (rightColumn) rightColumn.style.display = "flex";
    if (mainBtn) {
      mainBtn.innerText = "Tiếp Tục";
      mainBtn.style.background = "#ff6b35";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "goHomeFromBc()");
    }
  } else if (step === 2) {
    // 🚀 NÂNG CẤP BẤT TỬ: Đồng bộ dữ liệu từ DB nhưng bảo toàn số lượng qty cực kỳ nghiêm ngặt
    if (typeof API !== "undefined" && typeof API.getFnbItems === "function") {
      API.getFnbItems()
        .then((dbItems) => {
          const oldMenu = window.fnbMenu || [];

          window.fnbMenu = dbItems.map((item) => {
            // So khớp chuẩn xác theo foodItemId
            const matchedOldItem = oldMenu.find(
              (o) => String(o.id) === String(item.foodItemId),
            );
            return {
              id: item.foodItemId,
              name: item.itemName,
              // Khóa ép kiểu số đề phòng Database trả về chuỗi text gây lỗi NaN khi tính tiền
              price: Number(item.price) || 0,
              qty: matchedOldItem ? matchedOldItem.qty : 0,
            };
          });
          if (window.vnpayRestoreFnb) {
            window.fnbMenu.forEach((item) => {
              const old = window.vnpayRestoreFnb.find(
                (x) => String(x.id) === String(item.id),
              );

              item.qty = old ? old.qty : 0;
            });

            // dùng xong thì xóa luôn
            window.vnpayRestoreFnb = null;
          }
          // Phơi hàm tính tiền ra toàn cục ngay lập tức đề phòng file khác không gọi được
          window.calculateCgvCart = calculateCgvCart;

          // Cào xong data thì vẽ ra giao diện và tính tiền luôn
          if (typeof renderFnbMenu === "function") renderFnbMenu();
          if (typeof calculateCgvCart === "function") calculateCgvCart();
        })
        .catch((err) => {
          console.error("🚨 Lỗi nạp F&B cập nhật từ Server:", err);
        });
    } else {
      if (typeof renderFnbMenu === "function") renderFnbMenu();
    }

    if (mainBtn) {
      mainBtn.innerText = "Đến Thanh Toán";
      mainBtn.style.background = "#ff6b35";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "goToBookingStep(1)");
    }
  } else if (step === 3) {
    if (mainBtn) {
      mainBtn.innerText = "Thanh Toán Ngay";
      mainBtn.style.background = "#10B981";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "goToBookingStep(2)");
    }

    // 🚀 BƯỚC 1: Tính toán lại giỏ hàng giá gốc trước để lấy currentPriceTotal chuẩn làm bộ lọc đơn hàng
    if (typeof calculateCgvCart === "function") {
      calculateCgvCart();
    }

    // ==========================================================================
    // 🌟 TỰ ĐỘNG ÁP DỤNG VOUCHER: Đã sửa sang API Public rẽ nhánh & chống lặp UI
    // ==========================================================================
    if (
      currentPriceTotal > 0 &&
      !window.currentVoucher &&
      document.getElementById("voucher-input")?.value.trim() === ""
    ) {
      console.log("🔍 Đang gọi API Public rẽ nhánh tìm Voucher tự động...");

      // Gọi đến endpoint public đã được rẽ nhánh xử lý[cite: 2, 4]
      fetch("http://localhost:8080/api/vouchers/all")
        .then((res) => {
          if (!res.ok) return null;
          // 🟢 ĐÃ SỬA: Đọc dạng chuỗi text trước để bọc lót nếu body rỗng, tránh lỗi SyntaxError
          return res.text().then((text) => (text ? JSON.parse(text) : null));
        })
        .then((vouchers) => {
          // Lọc tìm voucher tự động từ danh sách an toàn nhả về
          const autoVoucher = (vouchers || []).find(
            (v) => v.applyType && v.applyType.toUpperCase() === "AUTO",
          );

          if (autoVoucher) {
            console.log(
              "🎯 Tìm thấy voucher tự động hợp lệ:",
              autoVoucher.voucherCode,
            );
            window.currentVoucher = autoVoucher;

            const vInput = document.getElementById("voucher-input");
            if (vInput) vInput.value = autoVoucher.voucherCode; // Điền mã lên giao diện

            calculateCgvCart(); // Tính toán lại số tiền thực tế sau khi giảm trừ thành công

            // 🟢 ĐÃ SỬA: Cập nhật trực tiếp số tiền đã giảm lên UI (Tuyệt đối không dùng goToBookingStep)
            const liveFinalPrice = window.finalPriceTotal || 0;

            const reviewTotalEl = document.getElementById("review-final-total");
            if (reviewTotalEl)
              reviewTotalEl.innerText =
                liveFinalPrice.toLocaleString("vi-VN") + " đ";

            const sumTotalEl = document.getElementById("sum-total");
            if (sumTotalEl)
              sumTotalEl.innerText =
                liveFinalPrice.toLocaleString("vi-VN") + " đ";
          } else {
            console.log(
              "ℹ️ Không tìm thấy voucher tự động nào thỏa mãn đơn hàng hiện tại.",
            );
          }
        })
        .catch((err) => console.error("🚨 Lỗi quét Voucher tự động:", err));
    } else if (currentPriceTotal <= 0) {
      // 🟢 BỔ SUNG: Nếu tổng tiền bằng 0, đảm bảo xóa sạch chữ voucher hiển thị trên giao diện ô input
      const vInput = document.getElementById("voucher-input");
      if (vInput) vInput.value = "";
      window.currentVoucher = null;
    }

    // ==========================================================================
    // 🎨 RENDER GIAO DIỆN HÓA ĐƠN ĐỒNG BỘ
    // ==========================================================================
    const currentMovie = document.getElementById("cgv-combo-movie").value;
    const activeFnbReview = window.fnbMenu || fnbMenu || [];

    const fnbItems = activeFnbReview.filter((i) => i.qty > 0);
    let fnbHtml = fnbItems
      .map(
        (i) =>
          `<div class="inv-fnb"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString("vi-VN")} đ</span></div>`,
      )
      .join("");

    document.getElementById("review-invoice-content").innerHTML = `
            <div class="inv-review">
              <div class="inv-line"><span class="inv-k">${ICON_MOVIE}Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">${ICON_CLOCK}Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
              <div class="inv-line"><span class="inv-k">${ICON_SEAT}Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">${ICON_POPCORN}Bắp nước</span><span class="inv-v">${window.fnbMenu.length ? "" : "Không có"}</span></div>
              ${fnbHtml}
              <div class="inv-total"><span>Tổng cộng (chưa giảm)</span><span class="inv-total-amt">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></div>
            </div>
        `;

    const finalPrice = window.finalPriceTotal || 0;
    console.log("Step3 currentPriceTotal =", currentPriceTotal);

    const reviewTotalEl = document.getElementById("review-final-total");
    if (reviewTotalEl) {
      reviewTotalEl.innerText = finalPrice.toLocaleString("vi-VN") + " đ";
    }

    const sumTotalEl = document.getElementById("sum-total");
    if (sumTotalEl) {
      sumTotalEl.innerText = finalPrice.toLocaleString("vi-VN") + " đ";
    }
  } else if (step === 4) {
    if (rightColumn) rightColumn.style.display = "none";
    if (layoutGrid) layoutGrid.style.gridTemplateColumns = "1fr";
  }
  currentBookingStep = step;
  const bookingPanel = document.getElementById("panel-booking");
  if (bookingPanel)
    bookingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizeMovieStatus(status) {
  return String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isComingSoonMovie(movie) {
  if (!movie) {
    return false;
  }

  const normalizedStatus = normalizeMovieStatus(
    movie.status || movie.movieStatus || movie.movie_status,
  );

  return (
    normalizedStatus === "comingsoon" ||
    normalizedStatus === "upcoming" ||
    normalizedStatus === "sapchieu"
  );
}

function getCurrentBookingMovie() {
  const movieList =
    typeof serverData !== "undefined" && Array.isArray(serverData.movies)
      ? serverData.movies
      : Array.isArray(window.serverData?.movies)
        ? window.serverData.movies
        : [];

  const movieSelect = document.getElementById("cgv-combo-movie");

  const detailTitle =
    document.getElementById("detail-movie-title")?.innerText?.trim() || "";

  const selectedMovieTitle =
    movieSelect?.value?.trim() ||
    window.currentBookingMovieTitle ||
    detailTitle;

  if (!selectedMovieTitle || movieList.length === 0) {
    return null;
  }

  return movieList.find(
    (movie) =>
      String(movie.title || "")
        .trim()
        .toLowerCase() === String(selectedMovieTitle).trim().toLowerCase(),
  );
}

function isCurrentMovieComingSoon() {
  /*
   * Cờ được lưu trực tiếp khi người dùng
   * bấm XEM SUẤT CHIẾU.
   */
  if (window.blockComingSoonCheckout === true) {
    return true;
  }

  const currentMovie = getCurrentBookingMovie();

  if (currentMovie) {
    return isComingSoonMovie(currentMovie);
  }

  /*
   * Fallback khi chưa tìm thấy movie
   * trong dropdown.
   */
  return isComingSoonMovie({
    status: window.currentBookingMovieStatus,
  });
}

window.isCurrentMovieComingSoon = isCurrentMovieComingSoon;

window.isComingSoonMovie = isComingSoonMovie;

window.isCurrentMovieComingSoon = isCurrentMovieComingSoon;

function handleMainAction() {
  if (
    typeof window.isBookingRestrictedRole === "function" &&
    window.isBookingRestrictedRole()
  ) {
    if (typeof showBookingRestrictedModal === "function")
      showBookingRestrictedModal();
    return;
  }

  if (!isUserLoggedInState) {
    if (typeof window.showLoginRequiredModal === "function") {
      window.showLoginRequiredModal();
    } else {
      window.showCgvToast(
        "Bạn phải đăng nhập tài khoản thành viên mới có thể tiến hành đặt vé!",
      );
      openAuthModal();
    }
    return;
  }

  // =====================================================
  // CHẶN CUSTOMER MUA VÉ PHIM SẮP CHIẾU
  // =====================================================
  const shouldBlockComingSoon =
    window.blockComingSoonCheckout === true ||
    (typeof window.isCurrentMovieComingSoon === "function" &&
      window.isCurrentMovieComingSoon());

  console.log("[COMING SOON CONTINUE CHECK]", {
    shouldBlockComingSoon: shouldBlockComingSoon,

    status: window.currentBookingMovieStatus,

    title: window.currentBookingMovieTitle,

    step: currentBookingStep,
  });

  if (shouldBlockComingSoon) {
    if (typeof window.showComingSoonBookingModal === "function") {
      window.showComingSoonBookingModal();
    } else {
      window.showCgvToast("Phim sắp chiếu hiện chưa mở bán vé.", "error");
    }

    return;
  }

  if (!window.currentSelectedShowtimeId) {
    window.showCgvToast("Vui lòng chọn suất chiếu!");
    return;
  }

  if (currentBookingStep === 1) {
    if (!window.currentSelectedShowtimeId) {
      window.showCgvToast("Vui lòng chọn suất chiếu!");
      return;
    }

    if (selectedSeats.length === 0) {
      window.showCgvToast("Vui lòng chọn ghế!");
      return;
    }

    if (!isHoldingState) {
      isHoldingState = true;
      document.getElementById("hold-timer").style.display = "flex";
      startCountdown(Date.now() + 10 * 60 * 1000);
    }

    goToBookingStep(2);
  } else if (currentBookingStep === 2) {
    goToBookingStep(3);
  } else if (currentBookingStep === 3) {
    processToPaymentGateway();
  }
}

function selectPaymentGatewayType(type, element) {
  window.selectedPaymentGateway = type;

  // Giữ tương thích với các file cũ đang đọc biến global không có window.
  try {
    selectedPaymentGateway = type;
  } catch (error) {
    console.debug("selectedPaymentGateway chỉ được lưu trên window", error);
  }

  document.querySelectorAll(".payment-option-row").forEach((row) => {
    row.classList.remove("active");
  });

  if (element) element.classList.add("active");
}

function openCheckoutReview() {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  const fnbItems = window.fnbMenu.filter((i) => i.qty > 0);
  let fnbHtml = fnbItems
    .map(
      (i) =>
        `<div class="inv-fnb"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString("vi-VN")} đ</span></div>`,
    )
    .join("");

  document.getElementById("review-invoice-content").innerHTML = `
        <div class="inv-review">
          <div class="inv-line"><span class="inv-k">${ICON_MOVIE}Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
          <div class="inv-line"><span class="inv-k">${ICON_CLOCK}Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
          <div class="inv-line"><span class="inv-k">${ICON_SEAT}Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
          <div class="inv-line"><span class="inv-k">${ICON_POPCORN}Bắp nước</span><span class="inv-v">${fnbItems.length ? "" : "Không có"}</span></div>
          ${fnbHtml}
          <div class="inv-total"><span>Tổng cộng (chưa giảm)</span><span class="inv-total-amt">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></div>
        </div>
    `;

  document.getElementById("review-final-total").innerText =
    window.finalPriceTotal.toLocaleString("vi-VN") + " đ";
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closeCheckoutReview() {
  document.getElementById("checkout-review-modal").classList.remove("open");
  calculateCgvCart();
}

function buildPricePayload() {
  let accountId = Number(sessionStorage.getItem("accountId"));

  if (!accountId) {
    try {
      const user = JSON.parse(
        localStorage.getItem("las_logged_in_user") || "{}",
      );

      accountId = Number(user.accountId || user.account_id);
    } catch (error) {
      accountId = 0;
    }
  }

  return {
    accountId,

    showtimeId: window.currentSelectedShowtimeId,

    seats: [...selectedSeats],

    voucherCode: document.getElementById("voucher-input")?.value?.trim() || "",

    paymentMethod: "QR",

    fnb: (window.fnbMenu || [])
      .filter((item) => Number(item.qty) > 0)
      .map((item) => ({
        foodItemId: item.id,
        quantity: Number(item.qty),
      })),
  };
}

async function getServerFinalAmount() {
  const response = await fetch(
    "http://localhost:8080/api/booking-price/preview",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(buildPricePayload()),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tính giá đơn hàng");
  }

  const serverAmount = Number(data.finalAmount);

  if (!Number.isFinite(serverAmount) || serverAmount <= 0) {
    throw new Error("Giá thanh toán từ máy chủ không hợp lệ");
  }

  return serverAmount;
}

async function processToPaymentGateway() {
  const reviewModal = document.getElementById("checkout-review-modal");

  if (reviewModal?.classList.contains("open")) {
    closeCheckoutReview();
  }

  const gateway = window.selectedPaymentGateway;

  if (!gateway) {
    window.showCgvToast("Vui lòng chọn phương thức thanh toán!", "error");

    return;
  }

  try {
    /*
     * Không sử dụng giá tự tính
     * của trình duyệt để thanh toán.
     */
    const serverFinalAmount = await getServerFinalAmount();

    window.finalPriceTotal = serverFinalAmount;

    const sumTotal = document.getElementById("sum-total");

    if (sumTotal) {
      sumTotal.innerText = serverFinalAmount.toLocaleString("vi-VN") + " đ";
    }

    const reviewTotal = document.getElementById("review-final-total");

    if (reviewTotal) {
      reviewTotal.innerText = serverFinalAmount.toLocaleString("vi-VN") + " đ";
    }

    console.log("SERVER FINAL AMOUNT:", serverFinalAmount);

    if (gateway === "qr") {
      openQrPayment(serverFinalAmount);

      return;
    }

    if (gateway === "vnpay") {
      openVnpayPayment(serverFinalAmount);

      return;
    }

    window.showCgvToast("Phương thức thanh toán không hợp lệ!", "error");
  } catch (error) {
    console.error("Lỗi đồng bộ giá:", error);

    window.showCgvToast(
      error.message || "Không thể đồng bộ giá thanh toán",
      "error",
    );
  }
}

function openQrPayment(finalTotal) {
  if (window.bookingExpireAt && Date.now() >= window.bookingExpireAt) {
    handleBookingExpired(
      "Phiên giữ ghế đã hết hạn. Vui lòng chọn lại phim và ghế.",
    );
    return;
  }

  let currentAccountId = Number(sessionStorage.getItem("accountId"));

  if (!currentAccountId) {
    try {
      const cachedUser = JSON.parse(
        localStorage.getItem("las_logged_in_user") || "{}",
      );
      currentAccountId = Number(cachedUser.accountId || cachedUser.account_id);
    } catch (error) {
      console.error("Không đọc được tài khoản:", error);
    }
  }

  if (!currentAccountId) {
    window.showCgvToast("Bạn chưa đăng nhập!", "error");
    return;
  }

  _qrCheckoutDone = false;
  paymentPollingErrorCount = 0;

  window.currentQrRef = null;
  window.currentPayOSOrderCode = null;
  window.currentPayOSPaymentLinkId = null;

  const qrImg = document.getElementById("bank-qr-img");
  if (qrImg) qrImg.removeAttribute("src");

  const statusText = document.getElementById("vietqr-payment-status-text");
  if (statusText) {
    statusText.innerText = "Đang chờ thanh toán...";
    statusText.className = "vietqr-status-wait";
  }

  const timerBox = document.getElementById("vietqr-timer-box");
  if (timerBox) {
    timerBox.classList.remove("vietqr-timer-expired");
    timerBox.innerHTML =
      '<span>⏱</span> Thời gian thanh toán còn lại <strong id="vietqr-timer">10:00</strong>';
  }
  updatePaymentTimerText();

  const qrTotal = document.getElementById("qr-total-price");
  if (qrTotal) {
    qrTotal.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
  }

  const genView = document.getElementById("vietqr-generate-view");
  const codeView = document.getElementById("vietqr-code-view");

  if (genView) genView.style.display = "";
  if (codeView) codeView.style.display = "none";

  stopVietQRTimer();
  stopQrPaymentPolling();

  const paymentModal = document.getElementById("payment-redirect-modal");
  if (paymentModal) {
    paymentModal.style.display = "";
    paymentModal.classList.add("open");
  }

  const currentMovie =
    document.getElementById("cgv-combo-movie")?.value?.trim() || "";
  const currentEmail =
    document.getElementById("profile-field-email")?.value?.trim() || "";

  // Payload nâng cấp từ booking(20), đồng thời giữ amount/totalMoney để tương thích backend cũ.
  const paymentPayload = {
    accountId: currentAccountId,
    movieName: currentMovie,
    showtimeId: window.currentSelectedShowtimeId,
    seats: [...selectedSeats],
    email: currentEmail,
    amount: Math.round(finalTotal),
    grossAmount: Number(currentPriceTotal) || 0,
    totalMoney: Math.round(finalTotal),
    voucherCode: document.getElementById("voucher-input")?.value?.trim() || "",
    paymentMethod: "qr",
    fnb: (window.fnbMenu || [])
      .filter((item) => Number(item.qty) > 0)
      .map((item) => ({
        foodItemId: item.id,
        quantity: Number(item.qty) || 0,
      })),
  };

  console.log("PAYOS CREATE PAYLOAD:", paymentPayload);

  API.createPayOSPayment(paymentPayload)
    .then((res) => {
      console.log("PAYOS CREATE RESPONSE:", res);

      if (!res || res.code !== "00" || !res.data) {
        window.showCgvToast(
          "Không tạo được thanh toán payOS: " +
            (res?.desc || "Lỗi không xác định"),
          "error",
        );
        return;
      }

      const data = res.data;

      window.currentQrRef = String(data.orderCode);
      window.currentPayOSOrderCode = data.orderCode;
      window.currentPayOSPaymentLinkId = data.paymentLinkId;

      const bankQrImg = document.getElementById("bank-qr-img");
      if (bankQrImg) {
        bankQrImg.src =
          "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" +
          encodeURIComponent(data.qrCode);
      }

      if (qrTotal) {
        qrTotal.innerText =
          Number(data.amount ?? finalTotal).toLocaleString("vi-VN") + " đ";
      }

      if (genView) genView.style.display = "none";
      if (codeView) codeView.style.display = "";

      generateVietQR();
    })
    .catch((err) => {
      console.error("Lỗi tạo thanh toán payOS:", err);
      handleBookingExpired(
        "Có lỗi xảy ra trong quá trình tạo thanh toán. Vui lòng thực hiện lại.",
      );
    });
}

let _vietqrTimerId = null;
let _qrPaymentPollId = null;
let _qrCheckoutDone = false;
window.currentQrRef = null;

function stopVietQRTimer() {
  if (_vietqrTimerId) {
    clearInterval(_vietqrTimerId);
    _vietqrTimerId = null;
  }
}

function stopQrPaymentPolling() {
  if (_qrPaymentPollId) {
    clearInterval(_qrPaymentPollId);
    _qrPaymentPollId = null;
  }
}

function generateVietQR() {
  const genView = document.getElementById("vietqr-generate-view");
  const codeView = document.getElementById("vietqr-code-view");
  const timerBox = document.getElementById("vietqr-timer-box");

  if (genView) genView.style.display = "none";
  if (codeView) codeView.style.display = "";

  if (timerBox) {
    timerBox.classList.remove("vietqr-timer-expired");
    timerBox.innerHTML = `<span>⏱</span> Thời gian thanh toán còn lại <strong id="vietqr-timer">10:00</strong>`;
  }

  updatePaymentTimerText();

  startPaymentCountdown();
  startQrPaymentPolling();
}

window.generateVietQR = generateVietQR;
window.stopVietQRTimer = stopVietQRTimer;

function startQrPaymentPolling() {
  stopQrPaymentPolling();
  paymentPollingErrorCount = 0;

  if (!window.currentQrRef) {
    console.warn("Chưa có currentQrRef nên không thể kiểm tra thanh toán");
    return;
  }

  const statusText = document.getElementById("vietqr-payment-status-text");

  _qrPaymentPollId = setInterval(() => {
    API.getQrPaymentStatus(window.currentQrRef)
      .then((data) => {
        console.log("QR PAYMENT STATUS:", data);

        if (statusText) {
          statusText.innerText =
            data.paymentStatus === "SUCCESS"
              ? "Thanh toán thành công!"
              : "Đang chờ thanh toán...";
        }

        if (data.paymentStatus === "SUCCESS") {
          if (_qrCheckoutDone) return;

          _qrCheckoutDone = true;
          bookingTimeoutHandled = true;

          clearInterval(timerInterval);

          if (paymentTimerInterval) {
            clearInterval(paymentTimerInterval);
            paymentTimerInterval = null;
          }

          if (typeof stopVietQRTimer === "function") stopVietQRTimer();
          if (typeof stopQrPaymentPolling === "function")
            stopQrPaymentPolling();

          const paymentModal = document.getElementById(
            "payment-redirect-modal",
          );
          if (paymentModal) {
            paymentModal.classList.remove("open");
            paymentModal.style.display = "none";
          }

          executeFinalCheckout();
        }

        if (data.paymentStatus === "CANCELLED") {
          stopQrPaymentPolling();
          stopVietQRTimer();
        }
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra trạng thái QR:", err);

        paymentPollingErrorCount++;

        if (paymentPollingErrorCount >= 3) {
          handleBookingExpired(
            "Không thể kiểm tra trạng thái thanh toán. Vui lòng thực hiện lại.",
          );
        }
      });
  }, 3000);
}

function openVnpayPayment(finalTotal) {
  let accountId = Number(sessionStorage.getItem("accountId"));

  if (!accountId) {
    try {
      const cachedUser = JSON.parse(
        localStorage.getItem("las_logged_in_user") || "{}",
      );
      accountId = Number(cachedUser.accountId || cachedUser.account_id);
    } catch (error) {
      console.error("Không đọc được tài khoản:", error);
    }
  }

  if (!accountId) {
    window.showCgvToast("Bạn chưa đăng nhập!", "error");
    return;
  }

  const currentMovie =
    document.getElementById("cgv-combo-movie")?.value?.trim() || "";
  const currentEmail =
    document.getElementById("profile-field-email")?.value?.trim() || "";
  const voucherCode =
    document.getElementById("voucher-input")?.value?.trim() || "";

  const vnpayRequest = {
    accountId,
    movieName: currentMovie,
    showtimeId: window.currentSelectedShowtimeId,
    seats: [...selectedSeats],
    email: currentEmail,
    amount: Math.round(finalTotal),
    grossAmount: Number(currentPriceTotal) || 0,
    totalMoney: Math.round(finalTotal),
    voucherCode,
    paymentMethod: "vnpay",
    fnb: (window.fnbMenu || [])
      .filter((item) => Number(item.qty) > 0)
      .map((item) => ({
        foodItemId: item.id,
        quantity: Number(item.qty) || 0,
      })),
  };

  console.log("VNPAY CREATE REQUEST:", vnpayRequest);

  fetch("http://localhost:8080/api/payment/vnpay/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vnpayRequest),
  })
    .then(async (response) => {
      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        result = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(result.message || "Không thể tạo giao dịch VNPAY");
      }

      return result;
    })
    .then((result) => {
      if (!result.paymentUrl || !result.paymentReference) {
        throw new Error("Backend không trả về đủ thông tin VNPAY");
      }

      // Lưu đủ dữ liệu để quay về từ VNPAY không bị mất phim, ghế, F&B và voucher.
      sessionStorage.setItem(
        "checkoutPayload",
        JSON.stringify({
          ...vnpayRequest,
          movie: currentMovie,
          showtime: window.currentSelectedShowtimeId,
          selectedShowtime,
          date: selectedDateStr,
          originalTotal: Number(currentPriceTotal) || 0,
          total: Number(window.finalPriceTotal) || Number(finalTotal) || 0,
          discount: Number(appliedVoucherDiscount) || 0,
          voucher: window.currentVoucher || null,
          voucherCode,
          fnb: (window.fnbMenu || []).map((item) => ({ ...item })),
          vnpayReference: result.paymentReference,
        }),
      );

      window.currentVnpayReference = result.paymentReference;
      console.log("VNPAY paymentReference:", result.paymentReference);
      window.location.href = result.paymentUrl;
    })
    .catch((error) => {
      console.error("Lỗi tạo giao dịch VNPAY:", error);
      window.showCgvToast(error.message || "Không thể kết nối VNPAY", "error");
    });
}

function checkVnpayReturn() {
  console.log("===== CHECK VNPAY RETURN =====");

  const params = new URLSearchParams(window.location.search);
  const responseCode = params.get("vnp_ResponseCode");

  // Không phải URL VNPAY trả về.
  if (!responseCode) return;

  const savedPayload = sessionStorage.getItem("checkoutPayload");
  if (!savedPayload) {
    window.showCgvToast("Không tìm thấy thông tin đơn hàng VNPAY!", "error");
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  let checkoutCache;
  try {
    checkoutCache = JSON.parse(savedPayload);
  } catch (error) {
    console.error("Không đọc được checkoutPayload:", error);
    sessionStorage.removeItem("checkoutPayload");
    window.showCgvToast("Dữ liệu đơn hàng VNPAY bị lỗi!", "error");
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const verifyUrl =
    "http://localhost:8080/api/payment/vnpay/verify?" + params.toString();

  fetch(verifyUrl, { method: "GET" })
    .then(async (response) => {
      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        result = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(result.message || "Không thể xác minh giao dịch VNPAY");
      }

      return result;
    })
    .then((verification) => {
      console.log("VNPAY VERIFY RESPONSE:", verification);

      if (responseCode !== "00" || verification.paymentStatus !== "SUCCESS") {
        throw new Error(
          verification.message || "Thanh toán VNPAY đã bị hủy hoặc thất bại",
        );
      }

      window.currentVnpayReference =
        verification.paymentReference ||
        checkoutCache.vnpayReference ||
        params.get("vnp_TxnRef");

      if (!window.currentVnpayReference) {
        throw new Error("Không tìm thấy mã giao dịch VNPAY");
      }

      window.selectedPaymentGateway = "vnpay";
      window.isVnpayReturn = true;

      window.history.replaceState({}, document.title, window.location.pathname);
      restoreVnpayCheckout(checkoutCache);
    })
    .catch((error) => {
      console.error("Lỗi xác minh VNPAY:", error);
      window.showCgvToast(
        error.message || "Xác minh thanh toán VNPAY thất bại",
        "error",
      );
      sessionStorage.removeItem("checkoutPayload");
      window.isVnpayReturn = false;
      window.history.replaceState({}, document.title, window.location.pathname);
    });
}

function restoreVnpayCheckout(data) {
  console.log("===== RESTORE VNPAY CHECKOUT =====");

  currentPriceTotal = Number(data.originalTotal ?? data.grossAmount) || 0;
  appliedVoucherDiscount = Number(data.discount) || 0;
  window.finalPriceTotal = Number(data.total ?? data.totalMoney) || 0;

  window.currentSelectedShowtimeId = data.showtimeId || data.showtime || null;
  selectedSeats = Array.isArray(data.seats) ? [...data.seats] : [];
  selectedShowtime = data.selectedShowtime || "";
  selectedDateStr = data.date || selectedDateStr || "";
  window.currentVoucher = data.voucher || null;

  const voucherInput = document.getElementById("voucher-input");
  if (voucherInput) voucherInput.value = data.voucherCode || "";

  window.vnpayRestoreFnb = Array.isArray(data.fnb) ? data.fnb : [];

  const restoreVoucherPromise =
    !window.currentVoucher && data.voucherCode
      ? fetch(
          "http://localhost:8080/api/vouchers/" +
            encodeURIComponent(data.voucherCode),
        )
          .then((response) => (response.ok ? response.json() : null))
          .then((voucher) => {
            if (voucher) window.currentVoucher = voucher;
          })
          .catch((error) => {
            console.warn("Không khôi phục được voucher VNPAY:", error);
          })
      : Promise.resolve();

  window.fnbRestorePromise = Promise.all([
    API.getFnbItems(),
    restoreVoucherPromise,
  ])
    .then(([dbItems]) => {
      const oldMenu = window.vnpayRestoreFnb || [];
      window.fnbMenu.length = 0;

      dbItems.forEach((dbItem) => {
        const oldItem = oldMenu.find((item) => {
          const oldId = item.id ?? item.foodItemId;
          return String(oldId) === String(dbItem.foodItemId);
        });

        const oldQuantity = oldItem
          ? Number(oldItem.qty ?? oldItem.quantity ?? 0)
          : 0;

        window.fnbMenu.push({
          id: dbItem.foodItemId,
          name: dbItem.itemName,
          price: Number(dbItem.price) || 0,
          qty: oldQuantity,
        });
      });

      if (typeof renderFnbMenu === "function") renderFnbMenu();
      if (typeof calculateCgvCart === "function") calculateCgvCart();
    })
    .catch((error) => {
      console.error("Không khôi phục được F&B:", error);
      throw new Error("Không thể khôi phục bắp nước của đơn hàng");
    });

  const movieName = data.movie || data.movieName || "";
  let restoreAttempts = 0;

  const restoreMovie = () => {
    restoreAttempts++;

    const combo = document.getElementById("cgv-combo-movie");
    const movieAvailable =
      combo &&
      combo.options.length > 0 &&
      [...combo.options].some((option) => option.value === movieName);

    if (movieAvailable) {
      combo.value = movieName;
      switchCgvTab("panel-booking");

      if (window.currentSelectedShowtimeId) {
        loadSeatMap(window.currentSelectedShowtimeId);
      }

      if (typeof renderCgvInterface === "function") renderCgvInterface();

      Promise.resolve(window.fnbRestorePromise)
        .then(() => executeFinalCheckout())
        .catch((error) => {
          window.showCgvToast(
            error.message || "Không thể khôi phục đơn hàng",
            "error",
          );
        });
      return;
    }

    if (restoreAttempts >= 100) {
      window.showCgvToast("Không thể khôi phục phim của đơn hàng!", "error");
      return;
    }

    setTimeout(restoreMovie, 100);
  };

  restoreMovie();
}

function backToPaymentSelection() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closePaymentModal() {
  showCancelPaymentConfirm();
}

function cancelQrPayment() {
  showCancelPaymentConfirm();
}

function showCancelPaymentConfirm() {
  let overlay = document.getElementById("cancel-payment-confirm-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "cancel-payment-confirm-overlay";
    overlay.className = "cancel-payment-confirm-overlay";

    overlay.innerHTML = `
      <div class="cancel-payment-confirm-box">
        <div class="cancel-payment-confirm-icon">!</div>

        <h3 class="cancel-payment-confirm-title">
          Xác nhận hủy thanh toán
        </h3>

        <p class="cancel-payment-confirm-message">
          Nếu hủy thanh toán, đơn đặt vé và các ghế đang giữ sẽ bị hủy.
          Bạn có chắc chắn muốn hủy không?
        </p>

        <div class="cancel-payment-confirm-actions">
          <button type="button" class="cancel-payment-btn keep-payment-btn" id="btn-keep-payment">
            Không, tiếp tục thanh toán
          </button>

          <button type="button" class="cancel-payment-btn confirm-cancel-payment-btn" id="btn-confirm-cancel-payment">
            Hủy thanh toán
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  overlay.style.display = "flex";

  const keepBtn = document.getElementById("btn-keep-payment");
  const cancelBtn = document.getElementById("btn-confirm-cancel-payment");

  if (keepBtn) {
    keepBtn.onclick = function () {
      overlay.style.display = "none";
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = function () {
      overlay.style.display = "none";
      cancelQrPaymentAndResetAll();
    };
  }
}

function cancelQrPaymentAndResetAll() {
  // Dừng timer giữ ghế
  if (typeof timerInterval !== "undefined") {
    clearInterval(timerInterval);
  }

  // Dừng timer thanh toán
  if (typeof paymentTimerInterval !== "undefined" && paymentTimerInterval) {
    clearInterval(paymentTimerInterval);
    paymentTimerInterval = null;
  }

  // Dừng QR timer + polling
  if (typeof stopVietQRTimer === "function") stopVietQRTimer();
  if (typeof stopQrPaymentPolling === "function") stopQrPaymentPolling();

  // Gọi backend hủy QR nếu có
  const qrRef = window.currentQrRef;

  if (
    qrRef &&
    typeof API !== "undefined" &&
    typeof API.cancelQrPayment === "function"
  ) {
    API.cancelQrPayment(qrRef).catch((err) => {
      console.error("Lỗi hủy QR payment:", err);
    });
  }

  // Reset trạng thái payment
  window.currentQrRef = null;
  window.currentPayOSOrderCode = null;
  window.currentPayOSPaymentLinkId = null;
  window.bookingExpireAt = null;

  if (typeof _qrCheckoutDone !== "undefined") {
    _qrCheckoutDone = false;
  }

  if (typeof bookingTimeoutHandled !== "undefined") {
    bookingTimeoutHandled = false;
  }

  if (typeof paymentPollingErrorCount !== "undefined") {
    paymentPollingErrorCount = 0;
  }

  // Đóng modal thanh toán
  const modal = document.getElementById("payment-redirect-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.style.display = "none";
  }

  // Reset view QR để lần sau tạo lại mã mới
  const genView = document.getElementById("vietqr-generate-view");
  const codeView = document.getElementById("vietqr-code-view");

  if (genView) genView.style.display = "";
  if (codeView) codeView.style.display = "none";

  const qrImg = document.getElementById("bank-qr-img");
  if (qrImg) {
    qrImg.removeAttribute("src");
  }

  const qrStatus = document.getElementById("vietqr-payment-status-text");
  if (qrStatus) {
    qrStatus.innerText = "Đang chờ thanh toán...";
    qrStatus.className = "vietqr-status-wait";
  }

  const qrTimerBox = document.getElementById("vietqr-timer-box");
  if (qrTimerBox) {
    qrTimerBox.classList.remove("vietqr-timer-expired");
    qrTimerBox.innerHTML =
      '<span>⏱</span> Thời gian thanh toán còn lại <strong id="vietqr-timer">10:00</strong>';
  }

  // Reset giữ ghế
  if (typeof isHoldingState !== "undefined") {
    isHoldingState = false;
  }

  // Reset toàn bộ booking
  selectedSeats = [];
  selectedShowtime = "";
  selectedDateStr = "";
  window.currentSelectedShowtimeId = null;
  currentBookingStep = 1;

  // Reset phương thức thanh toán
  selectedPaymentGateway = "qr";
  window.selectedPaymentGateway = "qr";

  // Reset voucher
  window.currentVoucher = null;
  appliedVoucherDiscount = 0;
  currentPriceTotal = 0;
  window.finalPriceTotal = 0;

  const voucherInput = document.getElementById("voucher-input");
  if (voucherInput) voucherInput.value = "";

  // Reset F&B
  if (window.fnbMenu && Array.isArray(window.fnbMenu)) {
    window.fnbMenu.forEach((item) => {
      item.qty = 0;
    });
  }

  // Ẩn timer giữ ghế
  const holdTimer = document.getElementById("hold-timer");
  if (holdTimer) {
    holdTimer.style.display = "none";
  }

  const timerString = document.getElementById("timer-string");
  if (timerString) {
    timerString.innerText = "10:00";
  }

  // Reset invoice UI
  const reviewInvoice = document.getElementById("review-invoice-content");
  if (reviewInvoice) {
    reviewInvoice.innerHTML = "";
  }

  const finalTicket = document.getElementById("final-ticket-result");
  if (finalTicket) {
    finalTicket.innerHTML = "";
  }

  const sumSeats = document.getElementById("sum-seats");
  if (sumSeats) {
    sumSeats.innerText = "Chưa chọn";
  }

  const sumShowtime = document.getElementById("sum-showtime");
  if (sumShowtime) {
    sumShowtime.innerText = "-";
  }

  const sumFnb = document.getElementById("sum-fnb");
  if (sumFnb) {
    sumFnb.innerText = "0 Combo";
  }

  const sumTotal = document.getElementById("sum-total");
  if (sumTotal) {
    sumTotal.innerText = "0 đ";
  }

  const qrTotalPrice = document.getElementById("qr-total-price");
  if (qrTotalPrice) {
    qrTotalPrice.innerText = "0 đ";
  }

  // Clear cache
  sessionStorage.removeItem("pendingBooking");
  sessionStorage.removeItem("checkoutPayload");
  localStorage.removeItem("las_current_booking_cache");

  // Render lại UI
  if (typeof renderFnbMenu === "function") renderFnbMenu();
  if (typeof calculateCgvCart === "function") calculateCgvCart();
  if (typeof renderCgvInterface === "function") renderCgvInterface();

  // Ép booking về bước 1
  if (typeof goToBookingStep === "function") {
    goToBookingStep(1);
  }

  // Về Home
  if (typeof switchCgvTab === "function") {
    switchCgvTab("panel-movies", "now_showing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.location.href = "index.html";
    return;
  }

  setTimeout(() => {
    window.showCgvToast(
      "Thanh toán đã được hủy. Đơn đặt vé và ghế đang giữ đã được xóa. Vui lòng đặt lại từ đầu.",
      "error",
    );
  }, 300);
}

window.closePaymentModal = closePaymentModal;
window.cancelQrPayment = cancelQrPayment;
window.cancelQrPaymentAndResetAll = cancelQrPaymentAndResetAll;

function executeFinalCheckout() {
  if (
    typeof window.isBookingRestrictedRole === "function" &&
    window.isBookingRestrictedRole()
  ) {
    if (typeof showBookingRestrictedModal === "function")
      showBookingRestrictedModal();
    return;
  }
  console.log("BOOKING EXECUTE");
  console.log("currentSelectedShowtimeId =", window.currentSelectedShowtimeId);
  console.log("selectedShowtime =", selectedShowtime);
  console.log("selectedSeats =", selectedSeats);
  let currentMovie =
    document.getElementById("cgv-combo-movie")?.value?.trim() ||
    document.getElementById("detail-movie-title")?.innerText?.trim();
  const targetMovie =
    typeof serverData !== "undefined" && serverData.movies
      ? serverData.movies.find((m) => m.title === currentMovie)
      : null;

  // 3. LẤY ID PHIM AN TOÀN
  const movieId = targetMovie
    ? targetMovie.movieId || targetMovie.movie_id
    : null;
  if (!currentMovie || currentMovie === "-" || currentMovie === "—") {
    window.showCgvToast("Không xác định được phim!");
    return;
  }

  if (!currentMovie || currentMovie.trim() === "") {
    window.showCgvToast("Không xác định được phim!");
    return;
  }

  if (!window.currentSelectedShowtimeId) {
    window.showCgvToast("Không có suất chiếu!");
    return;
  }

  if (!selectedSeats.length) {
    window.showCgvToast("Chưa chọn ghế!");
    return;
  }

  let currentEmail = "";

  const isLoggedIn =
    isUserLoggedInState ||
    !!document.getElementById("profile-field-email")?.value;

  if (isLoggedIn) {
    currentEmail = document.getElementById("profile-field-email")?.value;

    if (!currentEmail) {
      window.showCgvToast("Không lấy được email người dùng!");
      return;
    }
  } else {
    currentEmail = prompt("Vui lòng nhập email:", "");

    if (!currentEmail) {
      window.showCgvToast("Bạn cần nhập Email!");
      return;
    }
  }
  console.log("EMAIL DEBUG:", {
    isLoggedIn,
    isUserLoggedInState,
    email: currentEmail,
  });
  let currentAccountId = Number(sessionStorage.getItem("accountId"));

  if (!currentAccountId) {
    const cachedUser = localStorage.getItem("las_logged_in_user");

    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        currentAccountId = Number(u.accountId || u.account_id);
      } catch (e) {
        console.error("Không đọc được las_logged_in_user:", e);
      }
    }
  }

  console.log("Account ID:", currentAccountId);

  if (!currentAccountId) {
    window.showCgvToast("Bạn chưa đăng nhập!");
    return;
  }

  const showtimeId = window.currentSelectedShowtimeId;

  if (!showtimeId) {
    window.showCgvToast("Bạn chưa chọn suất chiếu!");
    return;
  }

  const paymentReference =
    window.selectedPaymentGateway === "vnpay"
      ? window.currentVnpayReference
      : window.currentQrRef;

  const checkoutPayload = {
    accountId: currentAccountId,
    movieName: currentMovie,
    movieId,
    showtimeId: window.currentSelectedShowtimeId,
    seats: [...selectedSeats],
    email: currentEmail,
    grossAmount: Number(currentPriceTotal) || 0,
    totalMoney: Number(window.finalPriceTotal) || 0,
    voucherCode: document.getElementById("voucher-input")?.value.trim() || "",
    paymentMethod: window.selectedPaymentGateway,
    paymentReference,
    // Giữ field cũ để backend chưa nâng cấp vẫn nhận được mã PayOS.
    qrRef: window.currentQrRef || null,
    fnb: (window.fnbMenu || [])
      .filter((item) => Number(item.qty) > 0)
      .map((item) => ({
        foodItemId: item.id,
        quantity: Number(item.qty) || 0,
      })),
  };

  console.log("PAYMENT METHOD:", checkoutPayload.paymentMethod);
  console.log("PAYMENT REFERENCE:", checkoutPayload.paymentReference);

  if (!checkoutPayload.paymentReference) {
    window.showCgvToast("Không tìm thấy mã giao dịch thanh toán!", "error");
    return;
  }
  console.log("Checkout payload:", checkoutPayload);
  console.log("Showtime:", window.currentSelectedShowtimeId);
  console.log("Selected:", selectedShowtime);
  console.log("Seats:", selectedSeats);
  // 2. Gọi API chuẩn qua api.js
  console.log("window.fnbMenu =", window.fnbMenu);

  console.log("fnbMenu =", fnbMenu);

  console.log("checkout fnb =", checkoutPayload.fnb);
  API.checkoutTickets(checkoutPayload)
    .then((data) => {
      console.log("BACKEND RESPONSE:", data);

      // Đóng modal thanh toán đang xoay xoay
      document
        .getElementById("payment-redirect-modal")
        .classList.remove("open");

      if (data.success) {
        // --- LOGIC XỬ LÝ KHI THÀNH CÔNG ---

        // Bôi đỏ ghế đã bán trong bộ nhớ tạm
        const store =
          serverData.masterSeatStore?.[currentMovie]?.[
            window.currentSelectedShowtimeId
          ];

        if (store) {
          selectedSeats.forEach((seatId) => {
            if (store[seatId]) {
              store[seatId].status = "sold";
            }
          });
        }

        // Ưu tiên mã đơn thật từ backend, vẫn hỗ trợ ticketId của luồng cũ.
        const bookingCode =
          data.orderCode !== undefined && data.orderCode !== null
            ? String(data.orderCode)
            : null;
        const lasTicketId = data.ticketId
          ? String(data.ticketId).replace("CGV-", "LAS-")
          : null;
        const invoiceCode = bookingCode || lasTicketId;

        if (!invoiceCode) {
          window.showCgvToast(
            "Backend không trả về mã đơn hàng hoặc mã vé. Không thể tạo QR vé!",
            "error",
          );
          return;
        }

        const invoiceCodeLabel = bookingCode ? "Mã đơn" : "Mã vé";

        // 🚀 ĐÃ SỬA: Lấy đúng data bắp nước từ database để lưu lịch sử hóa đơn
        const activeFnb = window.fnbMenu;
        console.log("===== BEFORE CREATE INVOICE =====");
        console.log(activeFnb);

        // Lưu lịch sử hóa đơn
        console.log("currentPriceTotal =", currentPriceTotal);
        console.log("appliedVoucherDiscount =", appliedVoucherDiscount);

        const invoiceObj = {
          id: invoiceCode,
          orderCode: bookingCode,
          ticketId: lasTicketId,
          movie: currentMovie,
          date: selectedDateStr,
          time: selectedShowtime,
          seats: [...selectedSeats],
          fnb: activeFnb.filter((i) => i.qty > 0).map((i) => ({ ...i })),
          total: window.finalPriceTotal || 0,
          status: "Đã thanh toán",
        };
        userPastInvoices.unshift(invoiceObj);

        // Chụp hóa đơn xong mới dọn state để đơn kế tiếp không dùng dữ liệu cũ.
        resetHoldState();
        selectedSeats = [];
        selectedShowtime = "";
        selectedDateStr = "";
        window.currentSelectedShowtimeId = null;
        resetPreviousOrderExtras();

        if (typeof calculateCgvCart === "function") calculateCgvCart();
        //renderCgvInterface();

        // Chuẩn bị in vé xịn xò ra màn hình
        let fnbHtml = invoiceObj.fnb
          .map((i) => `<li>${i.name} × ${i.qty}</li>`)
          .join("");
        const seatBadges = invoiceObj.seats
          .map((s) => `<span class="bc-seat-badge">${s}</span>`)
          .join("");
        const beautifulTicketHTML = `
          <div class="bc-confirm">
            <div class="bc-hero">
              <div class="bc-check">✓</div>
              <h2 class="bc-title">Đặt Vé Thành Công!</h2>
              <p class="bc-subtitle">Vé xem phim của bạn đã được đặt thành công.</p>
              <div class="bc-id-pill">${invoiceCodeLabel}: ${invoiceObj.id}</div>
            </div>

            <div class="bc-card">
              <div class="bc-card-head">${ICON_TICKET}Thông tin vé</div>
              <div class="bc-movie">${invoiceObj.movie}</div>
              <div class="bc-meta">
                <span>${ICON_CALENDAR}${invoiceObj.date}</span>
                <span>${ICON_CLOCK}${invoiceObj.time}</span>
                <span>${ICON_SEAT}${invoiceObj.seats.length} ghế</span>
              </div>

              <div class="bc-section-label">Ghế đã chọn</div>
              <div class="bc-seats">${seatBadges}</div>

              <div class="bc-section-label">Bắp nước</div>
              <ul class="bc-fnb">${fnbHtml || "<li>Không có</li>"}</ul>

              <div class="bc-qr-row">
                <img class="bc-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceObj.id)}" alt="QR vé">
                <div class="bc-qr-note">Xuất trình mã QR này tại quầy soát vé.<br>Bản sao đã được gửi vào Email của bạn.</div>
              </div>

              <div class="bc-total-row">
                <span>Đã thanh toán</span>
                <span class="bc-total-amt">${invoiceObj.total.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div class="bc-info-box">
              <div class="bc-info-title">${ICON_INFO}Thông tin quan trọng</div>
              <ul>
                <li>Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút.</li>
                <li>Mang theo giấy tờ tùy thân (CCCD) nếu phim giới hạn độ tuổi.</li>
                <li>Không mang đồ ăn, thức uống bên ngoài vào rạp.</li>
                <li>Vé không hoàn/đổi trong vòng 2 giờ trước suất chiếu.</li>
              </ul>
            </div>

            <div class="bc-actions">
              <button class="bc-btn bc-btn-primary" onclick="window.print()">${ICON_DOWNLOAD}Tải / In vé</button>
              <button class="bc-btn bc-btn-ghost" onclick="goHomeFromBc()">Về trang chủ</button>
            </div>
          </div>
        `;

        const finalResultDiv = document.getElementById("final-ticket-result");
        if (finalResultDiv) {
          finalResultDiv.innerHTML = beautifulTicketHTML;
          // Chuyển sang Bước 4 (Xem vé)
          console.log("Đang chuyển sang bước 4...");

          if (typeof stopQrPaymentPolling === "function")
            stopQrPaymentPolling();
          if (typeof stopVietQRTimer === "function") stopVietQRTimer();
          _qrCheckoutDone = true;

          goToBookingStep(4);
          window.isVnpayReturn = false;
          console.log("Đã gọi goToBookingStep(4)");
        }

        // Nếu đang đăng nhập thì load lại lịch sử giao dịch trong Profile
        if (isUserLoggedInState) renderTransactionHistory();
      } else {
        window.showCgvToast(
          "Rất tiếc, giao dịch không thành công hoặc ghế đã bị đặt. Vui lòng thử lại!",
        );
      }
    })
    .catch((error) => {
      console.error("Lỗi đặt vé:", error);
      window.showCgvToast("Đã xảy ra lỗi kết nối với máy chủ!");
    });

  console.log({
    movie: currentMovie,
    showtime: window.currentSelectedShowtimeId,
    seats: selectedSeats,
  });
}

function selectTime(showtimeId, startTime) {
  console.log("CLICK SHOWTIME:", showtimeId, startTime);

  if (!showtimeId && showtimeId !== 0) {
    window.showCgvToast("showtimeId bị undefined");
    return;
  }

  window.currentSelectedShowtimeId = Number(showtimeId);
  selectedShowtime = startTime;

  selectedSeats = [];

  console.log("SET SHOWTIME OK:", window.currentSelectedShowtimeId); // 👈 thêm log này

  loadSeatMap(showtimeId);
  renderCgvInterface();
}

function cancelCurrentTransaction() {
  if (
    confirm("Bạn có chắc chắn muốn hủy giao dịch và bỏ giữ các ghế này không?")
  ) {
    const currentMovie = document.getElementById("cgv-combo-movie").value;

    API.cancelBooking({
      movie: currentMovie,
      showtime: window.currentSelectedShowtimeId,
      seats: selectedSeats,
    })
      .then(() => {
        resetHoldState();
        selectedSeats = [];
        selectedShowtime = "";
        window.currentSelectedShowtimeId = null;
        window.fnbMenu.forEach((i) => (i.qty = 0));
        renderFnbMenu();
        calculateCgvCart();
        renderCgvInterface();
        window.showCgvToast("Đã hủy giao dịch và giải phóng ghế!", "success");
      })
      .catch((err) => window.showCgvToast("Lỗi hủy ghế: " + err.message));
  }
}

function startCountdown(expiresAt) {
  clearInterval(timerInterval);

  window.bookingExpireAt = expiresAt;
  bookingTimeoutHandled = false;

  timerInterval = setInterval(() => {
    const remain = window.bookingExpireAt - Date.now();

    if (remain <= 0) {
      handleBookingExpired(
        "Hết thời gian giữ ghế 10 phút. Vui lòng chọn lại phim và ghế.",
      );
      return;
    }

    const minutes = Math.floor(remain / 60000);
    const seconds = Math.floor((remain % 60000) / 1000);

    const timerString = document.getElementById("timer-string");
    if (timerString) {
      timerString.innerText = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }, 1000);
}

// BO SUNG: cập nhật ngay chữ đếm ngược VietQR tại thời điểm gọi (thay vì phải
// chờ tick 1 giây đầu tiên của setInterval), tránh nháy "10:00" tĩnh khi vừa mở QR.
function updatePaymentTimerText() {
  const vietQrTimer = document.getElementById("vietqr-timer");
  if (!vietQrTimer || !window.bookingExpireAt) return;

  const remain = window.bookingExpireAt - Date.now();
  if (remain <= 0) {
    vietQrTimer.innerText = "00:00";
    return;
  }

  const minutes = Math.floor(remain / 60000);
  const seconds = Math.floor((remain % 60000) / 1000);
  vietQrTimer.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function startPaymentCountdown() {
  clearInterval(paymentTimerInterval);

  paymentTimerInterval = setInterval(() => {
    const remain = window.bookingExpireAt - Date.now();

    if (remain <= 0) {
      handleBookingExpired(
        "Hết thời gian thanh toán. Đơn vé chưa được ghi nhận, vui lòng thực hiện lại.",
      );
      return;
    }

    updatePaymentTimerText();
  }, 1000);

  updatePaymentTimerText();
}

function resetHoldState() {
  clearInterval(timerInterval);
  isHoldingState = false;

  document.getElementById("hold-timer").style.display = "none";

  document.getElementById("btn-main-action").innerText = "Tiếp tục";
  document.getElementById("btn-main-action").style.background = "#ff6b35";

  currentBookingStep = 1;
}

function applyVoucher() {
  const voucherInput = document.getElementById("voucher-input");
  const code = voucherInput?.value.trim() || "";

  if (code === "") {
    window.currentVoucher = null;
    appliedVoucherDiscount = 0;
    calculateCgvCart();
    window.showCgvToast("Vui lòng nhập mã voucher!");
    return;
  }

  fetch("http://localhost:8080/api/vouchers/" + encodeURIComponent(code))
    .then((res) => {
      if (!res.ok) {
        throw new Error("Voucher không hợp lệ!");
      }
      return res.json();
    })
    .then((voucher) => {
      console.log("Voucher =", voucher);
      window.currentVoucher = voucher;
      calculateCgvCart();
      window.showCgvToast("Áp dụng voucher thành công!", "success");
    })
    .catch((err) => {
      // Không để voucher cũ tiếp tục giảm tiền khi mã mới bị sai.
      window.currentVoucher = null;
      appliedVoucherDiscount = 0;
      calculateCgvCart();
      window.showCgvToast(err.message, "error");
    });
}

function returnHomeWithPopup(message, title = "Thông báo") {
  // Đóng các modal nếu đang mở
  const paymentModal = document.getElementById("payment-redirect-modal");
  if (paymentModal) {
    paymentModal.classList.remove("open");
  }

  const otpModal = document.getElementById("otp-modal");
  if (otpModal) {
    otpModal.classList.remove("open");
  }

  // Clear dữ liệu chọn ghế nếu có
  if (typeof selectedSeats !== "undefined") {
    selectedSeats.clear?.();
  }

  if (typeof window.selectedSeats !== "undefined") {
    if (Array.isArray(window.selectedSeats)) {
      window.selectedSeats = [];
    } else if (window.selectedSeats.clear) {
      window.selectedSeats.clear();
    }
  }

  // Clear cache booking tạm
  sessionStorage.removeItem("pendingBooking");
  localStorage.removeItem("las_current_booking_cache");

  // Đẩy về home / danh sách phim
  if (typeof switchCgvTab === "function") {
    switchCgvTab("panel-movies", "now_showing");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } else {
    window.location.href = "index.html";
    return;
  }

  // Hiện popup theo FE booking(15)
  setTimeout(() => {
    window.showCgvToast(message, "error");
  }, 250);
}

let bookingTimeoutHandled = false;
let paymentTimerInterval = null;
let paymentPollingErrorCount = 0;

function handleBookingExpired(reasonMessage) {
  if (bookingTimeoutHandled) return;
  bookingTimeoutHandled = true;

  // Clear timer giữ ghế
  if (typeof timerInterval !== "undefined") {
    clearInterval(timerInterval);
  }

  // Clear timer thanh toán nếu có
  if (typeof paymentTimerInterval !== "undefined") {
    clearInterval(paymentTimerInterval);
  }

  // Stop polling QR nếu có
  if (typeof stopQrPaymentPolling === "function") {
    stopQrPaymentPolling();
  }

  // Đóng modal thanh toán nếu có
  const paymentModal = document.getElementById("payment-redirect-modal");
  if (paymentModal) {
    paymentModal.classList.remove("open");
    paymentModal.style.display = "none";
  }

  // Reset giữ ghế
  if (typeof resetHoldState === "function") {
    resetHoldState();
  }

  // Reset ghế chọn
  selectedSeats = [];

  if (typeof calculateCgvCart === "function") {
    calculateCgvCart();
  }

  // Ẩn timer giữ ghế
  const holdTimer = document.getElementById("hold-timer");
  if (holdTimer) {
    holdTimer.style.display = "none";
  }

  // Clear cache tạm
  sessionStorage.removeItem("pendingBooking");
  localStorage.removeItem("las_current_booking_cache");

  // Về Home
  if (typeof switchCgvTab === "function") {
    switchCgvTab("panel-movies", "now_showing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.location.href = "index.html";
    return;
  }

  // Popup theo FE booking(15)
  setTimeout(() => {
    window.showCgvToast(
      reasonMessage || "Phiên đặt vé đã hết hạn. Vui lòng thực hiện lại.",
      "error",
    );
  }, 300);
}

function activatePayOSPaymentFlow() {
  window.processToPaymentGateway = processToPaymentGateway;
  window.selectPaymentGatewayType = selectPaymentGatewayType;

  console.log("Đã kích hoạt luồng thanh toán PayOS từ booking.js");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", activatePayOSPaymentFlow);
} else {
  activatePayOSPaymentFlow();
}
window.addEventListener("load", checkVnpayReturn);
