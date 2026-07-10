console.log("BOOKING JS LOADED");
window.selectedPaymentGateway = "qr";

// 🚀 THÊM MỚI: Khai báo mảng fnbMenu toàn cục ban đầu trống
window.fnbMenu = [];

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
  const ticket = document.getElementById("final-ticket-result");
  if (ticket) ticket.innerHTML = "";
  if (!isUserLoggedInState) {
    alert("Vui lòng đăng nhập hệ thống để tiếp tục đặt vé!");
    openAuthModal();
  } else {
    const currentMovieTitle =
      document.getElementById("detail-movie-title").innerText;
    switchCgvTab("panel-booking");
    const selectCombo = document.getElementById("cgv-combo-movie");
    if (selectCombo && currentMovieTitle !== "-") {
      if ([...selectCombo.options].some((o) => o.value === currentMovieTitle)) {
        selectCombo.value = currentMovieTitle;
      }
      // 🚀 BỔ SUNG TẠI ĐÂY: Xóa sạch các ghế đang chọn dở trước đó khi chuyển sang phim mới này
      selectedSeats = [];
      if (typeof selectedShowtime !== "undefined") selectedShowtime = "";
      if (typeof window.currentSelectedShowtimeId !== "undefined")
        window.currentSelectedShowtimeId = null;

      onMovieOrTimeChange();
    }
    if (typeof goToBookingStep === "function") goToBookingStep(1);
  }
}

// 🚀 THÊM MỚI: Hàm chịu trách nhiệm gọi API lấy lịch chiếu động từ Database
// ====== TÌM VÀ SỬA LẠI HOÀN CHỈNH HÀM loadShowtimesFromServer() TRONG booking.js ======
function loadShowtimesFromServer() {
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (!selectCombo) return;

  // 1. Giữ nguyên logic bọc lót dropdown cực tốt của em
  let currentComboValue = selectCombo.value;
  console.log("🔥 SHOWTIME RAW:", serverData.showtimes);

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
    (t) => t.showtimeId === window.currentSelectedShowtimeId,
  );

  document.getElementById("sum-showtime").innerText = currentShowtimeObj
    ? currentShowtimeObj.startTime
    : "-";
}

function quickBookMovie(movieTitle) {
  switchCgvTab("panel-booking");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    onMovieOrTimeChange();
  }
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
    if (currentVoucher.discountType === "PERCENT") {
      discount = (currentPriceTotal * currentVoucher.discountValue) / 100;

      if (currentVoucher.maxDiscount != null) {
        discount = Math.min(discount, Number(currentVoucher.maxDiscount));
      }
    } else {
      discount = Number(currentVoucher.discountValue);
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

    // 🚀 Ép hàm tính toán lại giỏ hàng chạy trước để đảm bảo tính đúng
    if (typeof calculateCgvCart === "function") {
      calculateCgvCart();
    }

    const currentMovie = document.getElementById("cgv-combo-movie").value;

    const verifiedInvoiceTotal = currentPriceTotal;
    const activeFnbReview = window.fnbMenu || fnbMenu || [];

    const fnbItems = activeFnbReview.filter((i) => i.qty > 0);
    let fnbHtml = fnbItems
      .filter((i) => i.qty > 0)
      .map(
        (i) =>
          `<div class="inv-fnb"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString("vi-VN")} đ</span></div>`,
      )
      .join("");

    document.getElementById("review-invoice-content").innerHTML = `
            <div class="inv-review">
              <div class="inv-line"><span class="inv-k">🎬 Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">🕐 Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
              <div class="inv-line"><span class="inv-k">💺 Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">🍿 Bắp nước</span><span class="inv-v">${window.fnbMenu.length ? "" : "Không có"}</span></div>
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

function handleMainAction() {
  if (!isUserLoggedInState) {
    alert(
      "Bạn phải đăng nhập tài khoản thành viên mới có thể tiến hành đặt vé!",
    );
    openAuthModal();
    return;
  }

  if (!window.currentSelectedShowtimeId) {
    alert("Vui lòng chọn suất chiếu!");
    return;
  }

  if (currentBookingStep === 1) {
    if (!window.currentSelectedShowtimeId) {
      alert("Vui lòng chọn suất chiếu!");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ghế!");
      return;
    }

    if (!isHoldingState) {
      isHoldingState = true;
      document.getElementById("hold-timer").style.display = "flex";
      startCountdown(Date.now() + 5 * 60 * 1000);
    }

    goToBookingStep(2);
  } else if (currentBookingStep === 2) {
    goToBookingStep(3);
  } else if (currentBookingStep === 3) {
    processToPaymentGateway();
  }
}

function selectPaymentGatewayType(type, element) {
  selectedPaymentGateway = type;
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
          <div class="inv-line"><span class="inv-k">🎬 Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
          <div class="inv-line"><span class="inv-k">🕐 Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
          <div class="inv-line"><span class="inv-k">💺 Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
          <div class="inv-line"><span class="inv-k">🍿 Bắp nước</span><span class="inv-v">${fnbItems.length ? "" : "Không có"}</span></div>
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

function processToPaymentGateway() {
  closeCheckoutReview();

  const finalTotal = window.finalPriceTotal;
  if (!selectedPaymentGateway) {
    alert("Vui lòng chọn phương thức thanh toán!");
    return;
  }
  if (selectedPaymentGateway === "qr") {
    openQrPayment(finalTotal);
  } else if (selectedPaymentGateway === "vnpay") {
    openVnpayPayment(finalTotal);
  }
}

function openQrPayment(finalTotal) {
  _qrCheckoutDone = false;

  document.getElementById("qr-total-price").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";

  const genView = document.getElementById("vietqr-generate-view");
  const codeView = document.getElementById("vietqr-code-view");

  if (genView) genView.style.display = "";
  if (codeView) codeView.style.display = "none";

  stopVietQRTimer();
  stopQrPaymentPolling();

  document.getElementById("payment-redirect-modal").classList.add("open");

  API.createPayOSPayment(finalTotal)
    .then((res) => {
      console.log("PAYOS CREATE RESPONSE:", res);

      if (res.code !== "00") {
        alert("Không tạo được thanh toán payOS: " + res.desc);
        return;
      }

      const data = res.data;

      window.currentQrRef = String(data.orderCode);
      window.currentPayOSOrderCode = data.orderCode;
      window.currentPayOSPaymentLinkId = data.paymentLinkId;

      const qrImg = document.getElementById("bank-qr-img");

      qrImg.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" +
        encodeURIComponent(data.qrCode);

      document.getElementById("qr-total-price").innerText =
        Number(data.amount).toLocaleString("vi-VN") + " đ";

      if (genView) genView.style.display = "none";
      if (codeView) codeView.style.display = "";

      generateVietQR();
      startQrPaymentPolling();
    })
    .catch((err) => {
      console.error("Lỗi tạo thanh toán payOS:", err);
      alert("Lỗi tạo thanh toán payOS!");
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
  if (genView) genView.style.display = "none";
  if (codeView) codeView.style.display = "";

  // Bắt đầu đếm ngược 10 phút
  stopVietQRTimer();
  let remaining = 10 * 60;
  const timerEl = document.getElementById("vietqr-timer");
  const timerBox = document.getElementById("vietqr-timer-box");
  const render = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (timerEl) timerEl.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
  };
  render();
  startQrPaymentPolling();
  _vietqrTimerId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      stopVietQRTimer();
      if (timerBox) {
        timerBox.classList.add("vietqr-timer-expired");
        timerBox.innerHTML = `⚠ Mã QR đã hết hạn. <span class="vietqr-regen" onclick="generateVietQR()">Tạo lại mã</span>`;
      }
      return;
    }
    render();
  }, 1000);
}
window.generateVietQR = generateVietQR;
window.stopVietQRTimer = stopVietQRTimer;

function startQrPaymentPolling() {
  stopQrPaymentPolling();

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

          stopQrPaymentPolling();
          stopVietQRTimer();

          document
            .getElementById("payment-redirect-modal")
            .classList.remove("open");

          executeFinalCheckout();
        }

        if (data.paymentStatus === "CANCELLED") {
          stopQrPaymentPolling();
          stopVietQRTimer();
        }
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra trạng thái QR:", err);
      });
  }, 3000);
}

function openVnpayPayment(finalTotal) {
  const safeAmount = Math.round(finalTotal);

  fetch(
    `http://localhost:8080/api/payment/create-vnpay-url?amount=${safeAmount}`,
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.paymentUrl) {
        // Lưu thông tin checkout trước khi sang VNPAY
        console.log("===== SAVE BEFORE VNPAY =====");
        console.log({
          movie: document.getElementById("cgv-combo-movie").value,
          showtime: window.currentSelectedShowtimeId,
          seats: [...selectedSeats],
        });
        sessionStorage.setItem(
          "checkoutPayload",
          JSON.stringify({
            movie: document.getElementById("cgv-combo-movie").value,
            showtime: window.currentSelectedShowtimeId,
            seats: [...selectedSeats],
            email: document.getElementById("profile-field-email").value,
            total: window.finalPriceTotal,
            originalTotal: currentPriceTotal,
            discount: appliedVoucherDiscount,
            voucherCode: document.getElementById("voucher-input").value.trim(),
            voucher: window.currentVoucher,
            fnb: window.fnbMenu.map((i) => ({ ...i })),
          }),
        );

        window.location.href = data.paymentUrl;
      } else {
        alert("Không tạo được link VNPAY");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Không kết nối được VNPAY");
    });
}

function checkVnpayReturn() {
  console.log("===== CHECK VNPAY =====");
  console.log("URL =", window.location.href);
  console.log("SEARCH =", window.location.search);
  const params = new URLSearchParams(window.location.search);
  const responseCode = params.get("vnp_ResponseCode");
  if (!responseCode) {
    return;
  }
  if (responseCode !== "00") {
    alert("Thanh toán đã bị hủy hoặc thất bại.");

    sessionStorage.removeItem("checkoutPayload");

    window.history.replaceState({}, document.title, window.location.pathname);

    return;
  }

  if (!responseCode) return;

  const payload = sessionStorage.getItem("checkoutPayload");

  if (!payload) return;

  const data = JSON.parse(payload);

  currentPriceTotal = data.originalTotal;
  appliedVoucherDiscount = data.discount;
  window.finalPriceTotal = data.total;

  document.getElementById("voucher-input").value = data.voucherCode || "";

  window.currentVoucher = data.voucher || null;
  console.log("Voucher restored:", window.currentVoucher);

  console.log("window.fnbMenu =", window.fnbMenu);
  console.log("data.fnb =", data.fnb);
  window.vnpayRestoreFnb = data.fnb || [];
  // 🚀 FIX RACE CONDITION: lưu lại promise để executeFinalCheckout có thể
  // "chờ" cho việc restore qty FnB hoàn tất trước khi build payload gửi server.
  // Trước đây promise này không được lưu lại, nên restoreMovie() (chạy độc lập,
  // chỉ đợi dropdown phim) có thể gọi executeFinalCheckout() TRƯỚC KHI qty
  // được gán vào window.fnbMenu -> server nhận toàn bộ fnb với qty=0.
  window.fnbRestorePromise = API.getFnbItems().then((dbItems) => {
    const oldMenu = data.fnb || [];

    // Không tạo Array mới nữa
    window.fnbMenu.length = 0;

    dbItems.forEach((item) => {
      const old = oldMenu.find((x) => String(x.id) === String(item.foodItemId));

      window.fnbMenu.push({
        id: item.foodItemId,
        name: item.itemName,
        price: Number(item.price) || 0,
        qty: old ? old.qty : 0,
      });
    });

    renderFnbMenu();
    calculateCgvCart();
    console.log("Sau restore:", JSON.stringify(window.fnbMenu, null, 2));
  });
  console.log("restoreFnb =", window.vnpayRestoreFnb);

  console.log("===== VNPAY RETURN =====");
  console.log(data);

  window.history.replaceState({}, document.title, window.location.pathname);
  window.isVnpayReturn = true;

  window.currentSelectedShowtimeId = data.showtime;
  selectedSeats = data.seats;
  selectedShowtime = "";
  renderFnbMenu();
  calculateCgvCart();
  // Đợi dropdown phim load xong mới gán
  const restoreMovie = () => {
    const combo = document.getElementById("cgv-combo-movie");

    if (
      combo &&
      combo.options.length > 0 &&
      [...combo.options].some((o) => o.value === data.movie)
    ) {
      combo.value = data.movie;

      console.log("✔ Restore movie:", combo.value);
      switchCgvTab("panel-booking");
      loadSeatMap(data.showtime);
      renderCgvInterface();

      console.log("showtime =", window.currentSelectedShowtimeId);
      console.log("movie =", combo.value);
      console.log("seats =", selectedSeats);
      console.log(serverData.movies);
      console.log(serverData.showtimes);
      console.log(document.getElementById("cgv-combo-movie").value);
      console.log(window.currentSelectedShowtimeId);

      // 🚀 FIX RACE CONDITION: đợi restore FnB (qty bắp nước) xong hẳn
      // rồi mới build & gửi payload checkout, tránh gửi qty=0 lên server
      Promise.resolve(window.fnbRestorePromise).then(() => {
        executeFinalCheckout();
      });
    } else {
      setTimeout(restoreMovie, 100);
    }
  };

  restoreMovie();
}

function backToPaymentSelection() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closePaymentModal() {
  cancelQrPayment();
}

function cancelQrPayment() {
  stopVietQRTimer();
  stopQrPaymentPolling();

  const qrRef = window.currentQrRef;

  if (qrRef && typeof API.cancelQrPayment === "function") {
    API.cancelQrPayment(qrRef).catch((err) => {
      console.error("Lỗi hủy QR payment:", err);
    });
  }

  window.currentQrRef = null;

  const modal = document.getElementById("payment-redirect-modal");
  if (modal) modal.classList.remove("open");

  // Quay lại bước 3
  goToBookingStep(3);
}

window.cancelQrPayment = cancelQrPayment;

function executeFinalCheckout() {
  console.log("BOOKING EXECUTE");
  console.log("currentSelectedShowtimeId =", window.currentSelectedShowtimeId);
  console.log("selectedShowtime =", selectedShowtime);
  console.log("selectedSeats =", selectedSeats);
  let currentMovie =
    document.getElementById("cgv-combo-movie")?.value?.trim() ||
    document.getElementById("detail-movie-title")?.innerText?.trim();

  if (!currentMovie || currentMovie === "-" || currentMovie === "—") {
    alert("Không xác định được phim!");
    return;
  }

  if (!currentMovie || currentMovie.trim() === "") {
    alert("Không xác định được phim!");
    return;
  }

  if (!window.currentSelectedShowtimeId) {
    alert("Không có suất chiếu!");
    return;
  }

  if (!selectedSeats.length) {
    alert("Chưa chọn ghế!");
    return;
  }

  let currentEmail = "";

  const isLoggedIn =
    isUserLoggedInState ||
    !!document.getElementById("profile-field-email")?.value;

  if (isLoggedIn) {
    currentEmail = document.getElementById("profile-field-email")?.value;

    if (!currentEmail) {
      alert("Không lấy được email người dùng!");
      return;
    }
  } else {
    currentEmail = prompt("Vui lòng nhập email:", "");

    if (!currentEmail) {
      alert("Bạn cần nhập Email!");
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
    alert("Bạn chưa đăng nhập!");
    return;
  }

  const showtimeId = window.currentSelectedShowtimeId;

  if (!showtimeId) {
    alert("Bạn chưa chọn suất chiếu!");
    return;
  }

  const checkoutPayload = {
    accountId: currentAccountId,
    movieName: currentMovie,
    showtimeId: window.currentSelectedShowtimeId,
    seats: [...selectedSeats],
    email: currentEmail,
    grossAmount: currentPriceTotal, // thêm
    totalMoney: window.finalPriceTotal, // sau giảm
    voucherCode: document.getElementById("voucher-input")?.value.trim() || "",
    paymentMethod: window.selectedPaymentGateway,
    fnb: window.fnbMenu
      .filter((i) => i.qty > 0)
      .map((i) => ({
        foodItemId: i.id,
        quantity: i.qty,
      })),
  };
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

        // Tạo mã ID vé (Nếu Java không trả về thì tự gen ngẫu nhiên)
        const lasTicketId = data.ticketId
          ? data.ticketId.replace("CGV-", "LAS-")
          : "LAS-" + Math.floor(Math.random() * 1000000);

        // 🚀 ĐÃ SỬA: Lấy đúng data bắp nước từ database để lưu lịch sử hóa đơn
        const activeFnb = window.fnbMenu;
        console.log("===== BEFORE CREATE INVOICE =====");
        console.log(activeFnb);

        // Lưu lịch sử hóa đơn
        console.log("currentPriceTotal =", currentPriceTotal);
        console.log("appliedVoucherDiscount =", appliedVoucherDiscount);

        const invoiceObj = {
          id: lasTicketId,
          movie: currentMovie,
          date: selectedDateStr,
          time: selectedShowtime,
          seats: [...selectedSeats],
          fnb: activeFnb.filter((i) => i.qty > 0).map((i) => ({ ...i })),
          total: window.finalPriceTotal || 0,
          status: "Đã thanh toán",
        };
        userPastInvoices.unshift(invoiceObj);

        // Reset trạng thái chọn ghế & giỏ hàng
        resetHoldState();
        selectedSeats = [];

        // 🚀 ĐÃ SỬA CHỖ 2: Đưa số lượng combo động về lại 0 sau khi thanh toán xong
        window.fnbMenu.forEach((i) => (i.qty = 0));

        renderFnbMenu();
        calculateCgvCart();
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
              <div class="bc-id-pill">Mã vé: ${invoiceObj.id}</div>
            </div>

            <div class="bc-card">
              <div class="bc-card-head">🎫 Thông tin vé</div>
              <div class="bc-movie">${invoiceObj.movie}</div>
              <div class="bc-meta">
                <span>📅 ${invoiceObj.date}</span>
                <span>🕐 ${invoiceObj.time}</span>
                <span>💺 ${invoiceObj.seats.length} ghế</span>
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
              <div class="bc-info-title">ℹ️ Thông tin quan trọng</div>
              <ul>
                <li>Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút.</li>
                <li>Mang theo giấy tờ tùy thân (CCCD) nếu phim giới hạn độ tuổi.</li>
                <li>Không mang đồ ăn, thức uống bên ngoài vào rạp.</li>
                <li>Vé không hoàn/đổi trong vòng 2 giờ trước suất chiếu.</li>
              </ul>
            </div>

            <div class="bc-actions">
              <button class="bc-btn bc-btn-primary" onclick="window.print()">⬇ Tải / In vé</button>
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
        alert(
          "Rất tiếc, giao dịch không thành công hoặc ghế đã bị đặt. Vui lòng thử lại!",
        );
      }
    })
    .catch((error) => {
      console.error("Lỗi đặt vé:", error);
      alert("Đã xảy ra lỗi kết nối với máy chủ!");
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
    alert("showtimeId bị undefined");
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
        alert("Đã hủy giao dịch và giải phóng ghế!");
      })
      .catch((err) => alert("Lỗi hủy ghế: " + err.message));
  }
}

function startCountdown(expiresAt) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remain = expiresAt - Date.now();
    if (remain <= 0) {
      clearInterval(timerInterval);
      alert("Hết thời gian giữ ghế 5 phút!");
      resetHoldState();
      selectedSeats = [];
      calculateCgvCart();
    } else {
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      document.getElementById("timer-string").innerText =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
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
  const code = document.getElementById("voucher-input").value.trim();

  if (code === "") {
    alert("Vui lòng nhập mã voucher!");
    return;
  }

  fetch("http://localhost:8080/api/vouchers/" + code)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Voucher không hợp lệ!");
      }
      return res.json();
    })
    .then((voucher) => {
      console.log("Voucher =", voucher);
      console.log("discountValue =", voucher.discountValue);
      console.log("discountType =", voucher.discountType);
      console.log("maxDiscount =", voucher.maxDiscount);
      window.currentVoucher = voucher;

      calculateCgvCart();

      alert("Áp dụng voucher thành công!");
    })
    .catch((err) => {
      appliedVoucherDiscount = 0;

      calculateCgvCart();

      alert(err.message);
    });
}

window.addEventListener("load", checkVnpayReturn);
