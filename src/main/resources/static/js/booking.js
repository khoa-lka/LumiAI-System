console.log("BOOKING JS LOADED");
let selectedPaymentGateway = "qr";
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
    timeGrid.innerHTML = "<p style='color:#666'>Không có suất chiếu.</p>";
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
    .then((bookedSeatsList = []) => {
      const currentMovie = document.getElementById("cgv-combo-movie").value;

      // đảm bảo structure tồn tại
      if (!serverData.masterSeatStore[currentMovie]) {
        serverData.masterSeatStore[currentMovie] = {};
      }

      // init template nếu chưa có
      if (!serverData.masterSeatStore[currentMovie][showtimeId]) {
        serverData.masterSeatStore[currentMovie][showtimeId] =
          initSeatTemplate();
      }

      // clone để tránh mutate trực tiếp object gốc
      const baseMap = serverData.masterSeatStore[currentMovie][showtimeId];

      const activeSeatMap = JSON.parse(JSON.stringify(baseMap));

      // normalize bookedSeatsList
      const bookedSet = new Set(bookedSeatsList || []);

      Object.keys(activeSeatMap).forEach((id) => {
        activeSeatMap[id].status = bookedSet.has(id) ? "sold" : "available";
      });

      serverData.masterSeatStore[currentMovie][showtimeId] = activeSeatMap;

      calculateCgvCart();
      renderCgvInterface();
    })
    .catch((err) => {
      console.error("🚨 Lỗi đồng bộ dữ liệu ghế từ Server:", err);

      calculateCgvCart();
      renderCgvInterface();
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
  document.getElementById("sum-seats").innerText =
    selectedSeats.join(", ") || "Chưa chọn";
  let total = 0;
  let totalFnbItems = 0;

  // 🚀 ĐÃ SỬA: Tính tiền động theo đúng Loại Ghế bốc từ Database lên
  selectedSeats.forEach((seatId) => {
    // Tìm thông tin chi tiết của chiếc ghế này trong danh sách ghế Back-end trả về
    // Giao diện vẽ dựa trên backendSeats nên ta tìm trong bộ nhớ hoặc query qua DOM element
    const seatEl = Array.from(document.querySelectorAll('.cgv-seat')).find(el => el.innerText.trim() === seatId);
    
    if (seatEl) {
      if (seatEl.classList.contains('vip')) {
        total += 110000; // 🔴 Giá ghế VIP của nhóm em
      } else if (seatEl.classList.contains('sweetbox')) {
        total += 250000; // 💗 Giá ghế đôi Sweetbox của nhóm em
      } else {
        total += 90000;  // 🟢 Giá ghế Standard thường
      }
    } else {
      total += 90000; // Bọc lót giá mặc định nếu không tìm thấy ô DOM
    }
  });

  fnbMenu.forEach((item) => {
    total += item.qty * item.price;
    totalFnbItems += item.qty;
  });

  document.getElementById("sum-fnb").innerText = totalFnbItems + " Combo";
  currentPriceTotal = total;
  let finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
  document.getElementById("sum-total").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";
}

function goToBookingStep(step) {
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
      mainBtn.style.background = "#e71a0f";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "goHomeFromBc()");
    }
  } else if (step === 2) {
    if (mainBtn) {
      mainBtn.innerText = "Đến Thanh Toán";
      mainBtn.style.background = "#e71a0f";
    }
    if (backBtn) {
      backBtn.innerText = "← Quay Lại";
      backBtn.setAttribute("onclick", "goToBookingStep(1)");
    }
  } else if (step === 3) {
    if (mainBtn) {
      mainBtn.innerText = "Thanh Toán Ngay";
      mainBtn.style.background = "#10B981";
    }
    if (backBtn) {
      backBtn.innerText = "← Chọn F&B";
      backBtn.setAttribute("onclick", "goToBookingStep(2)");
    }

    const currentMovie = document.getElementById("cgv-combo-movie").value;
    let fnbHtml = fnbMenu
      .filter((i) => i.qty > 0)
      .map(
        (i) =>
          `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString("vi-VN")} đ</p>`,
      )
      .join("");
    document.getElementById("review-invoice-content").innerHTML = `
            <p><strong>Phim:</strong> ${currentMovie}</p>
            <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
            <p><strong>Ghế:</strong> ${selectedSeats.join(", ")}</p>
            <p><strong>Bắp nước:</strong></p>${fnbHtml || "<p>Không có</p>"}
            <hr style="margin: 10px 0;">
            <p style="font-size: 16px;"><strong>Tổng cộng (Chưa giảm): <span style="color:#e71a0f;">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></strong></p>
        `;
    document.getElementById("review-final-total").innerText =
      currentPriceTotal.toLocaleString("vi-VN") + " đ";
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

    const circle = row.querySelector(".option-check-circle");
    if (circle) {
      circle.style.borderColor = "#ccc";
      circle.style.color = "transparent";
    }
  });

  element.classList.add("active");

  const circle = element.querySelector(".option-check-circle");
  if (circle) {
    circle.style.borderColor = "#e71a0f";
    circle.style.color = "#e71a0f";
  }
}

function applyVoucher() {
  const code = document
    .getElementById("voucher-input")
    .value.trim()
    .toUpperCase();
  if (code === "LAS20") {
    appliedVoucherDiscount = 0.2;
    alert("Áp dụng thành công Voucher giảm 20%!");
  } else {
    appliedVoucherDiscount = 0;
    alert("Mã Voucher không hợp lệ hoặc đã hết hạn!");
  }
  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
  document.getElementById("review-final-total").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";
  calculateCgvCart();
}

function openCheckoutReview() {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  let fnbHtml = fnbMenu
    .filter((i) => i.qty > 0)
    .map(
      (i) =>
        `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString("vi-VN")} đ</p>`,
    )
    .join("");

  document.getElementById("review-invoice-content").innerHTML = `
        <p><strong>Phim:</strong> ${currentMovie}</p>
        <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
        <p><strong>Ghế:</strong> ${selectedSeats.join(", ")}</p>
        <p><strong>Bắp nước:</strong></p>
        ${fnbHtml || "<p>Không có</p>"}
        <hr style="margin: 10px 0;">
        <p><strong>Tổng cộng (Chưa giảm):</strong> ${currentPriceTotal.toLocaleString("vi-VN")} đ</p>
    `;

  appliedVoucherDiscount = 0;
  document.getElementById("voucher-input").value = "";
  document.getElementById("review-final-total").innerText =
    currentPriceTotal.toLocaleString("vi-VN") + " đ";
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closeCheckoutReview() {
  document.getElementById("checkout-review-modal").classList.remove("open");
  appliedVoucherDiscount = 0;
  calculateCgvCart();
}

function processToPaymentGateway() {
  closeCheckoutReview();

  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
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
  document.getElementById("qr-total-price").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";

  const bankId = "ICB";
  const accountNo = "101879388698";
  const accountName = "NGUYEN BAO HOANG";

  const qrData = "LAS CINEMAS THANH TOAN";

  document.getElementById("bank-qr-img").src =
    `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;

  document.getElementById("payment-redirect-modal").classList.add("open");
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
  currentPriceTotal = data.total || 0;
  appliedVoucherDiscount = data.discount || 0;
  if (data.fnb) {
    fnbMenu.forEach((item) => {
      const old = data.fnb.find((x) => x.name === item.name);
      item.qty = old ? old.qty : 0;
    });
  }

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
      executeFinalCheckout();
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
  document.getElementById("payment-redirect-modal").classList.remove("open");
}

function executeFinalCheckout() {
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
  const showtimeId = window.currentSelectedShowtimeId;

  if (!showtimeId) {
    alert("Bạn chưa chọn suất chiếu!");
    return;
  }
  // 1. Tạo gói dữ liệu chuẩn bị gửi
  const checkoutPayload = {
    movie: currentMovie,
    showtime: showtimeId,
    seats: selectedSeats,
    email: currentEmail,
    total: currentPriceTotal,
    discount: appliedVoucherDiscount,
    fnb: fnbMenu.map((item) => ({ ...item })),
  };
  console.log("Checkout payload:", checkoutPayload);
  console.log("Showtime:", window.currentSelectedShowtimeId);
  console.log("Selected:", selectedShowtime);
  console.log("Seats:", selectedSeats);
  // 2. Gọi API chuẩn qua api.js
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

        // Lưu lịch sử hóa đơn
        console.log("currentPriceTotal =", currentPriceTotal);
        console.log("appliedVoucherDiscount =", appliedVoucherDiscount);
        const invoiceObj = {
          id: lasTicketId,
          movie: currentMovie,
          date: selectedDateStr,
          time: selectedShowtime,
          seats: [...selectedSeats],
          fnb: fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i })),
          total: currentPriceTotal * (1 - appliedVoucherDiscount),
          status: "Đã thanh toán",
        };
        userPastInvoices.unshift(invoiceObj);

        // Reset trạng thái chọn ghế & giỏ hàng
        resetHoldState();
        selectedSeats = [];
        fnbMenu.forEach((i) => (i.qty = 0));
        renderFnbMenu();
        calculateCgvCart();
        //renderCgvInterface();

        // Chuẩn bị in vé xịn xò ra màn hình
        let fnbHtml = invoiceObj.fnb
          .map((i) => `<li>${i.name} x${i.qty}</li>`)
          .join("");
        const beautifulTicketHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #10B981; margin-bottom: 10px; font-size: 28px;">ĐẶT VÉ THÀNH CÔNG!</h2>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${invoiceObj.id}" style="border: 1px solid #ccc; padding: 5px;">
                <p style="color: #222; font-weight: bold; font-size: 13px; margin-top: 10px;">Hệ thống cũng đã gửi 1 bản sao vào Email của bạn.</p>
            </div>
            <div style="background: #fdfcf7; padding: 25px 40px; border: 2px dashed #ccc; border-radius: 8px; text-align: left; display: inline-block; min-width: 90%; margin: 0 auto; box-sizing: border-box;">
                <p><strong>Mã vé:</strong> <span style="color:red; font-size: 22px;">${invoiceObj.id}</span></p>
                <p><strong>Phim:</strong> ${invoiceObj.movie}</p>
                <p><strong>Suất chiếu:</strong> ${invoiceObj.time} ngày ${invoiceObj.date}</p>
                <hr style="margin: 15px 0;"><p><strong>🎟️ Ghế:</strong> ${invoiceObj.seats.join(", ")}</p>
                <p><strong>🍿 F&B:</strong></p><ul>${fnbHtml || "<li>Không có</li>"}</ul>
                <hr style="margin: 15px 0;">
                <p style="font-size: 20px; text-align: right; margin: 0;"><strong>Đã thanh toán: <span style="color:red;">${invoiceObj.total.toLocaleString("vi-VN")} đ</span></strong></p>
            </div>
            <div style="margin-top: 30px; text-align: center;">
                <button class="btn-cgv-submit" style="width: auto; padding: 12px 30px; background: #555;" onclick="document.getElementById('history-detail-modal').classList.remove('open'); goHomeFromBc()">VỀ TRANG CHỦ</button>
            </div>
        `;

        const finalResultDiv = document.getElementById("final-ticket-result");
        if (finalResultDiv) {
          finalResultDiv.innerHTML = beautifulTicketHTML;
          // Chuyển sang Bước 4 (Xem vé)
          console.log("Đang chuyển sang bước 4...");
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
        fnbMenu.forEach((i) => (i.qty = 0));
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
  document.getElementById("btn-main-action").style.background = "#e71a0f";

  currentBookingStep = 1;
}

window.addEventListener("load", checkVnpayReturn);
