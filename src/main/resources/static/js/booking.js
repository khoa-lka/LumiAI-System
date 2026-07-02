// 🚀 THÊM MỚI: Khai báo mảng fnbMenu toàn cục ban đầu trống
window.fnbMenu = [];

// Hàm tự động gọi lên Spring Boot lấy toàn bộ bắp nước thật bốc từ Database
function initFnbMenuFromServer() {
  if (typeof API !== "undefined" && typeof API.getFnbItems === "function") {
    API.getFnbItems()
      .then((dbItems) => {
        // Map chuyển đổi cấu trúc DB sang cấu trúc mảng cũ của em để không lỗi logic tính tiền
        window.fnbMenu = dbItems.map(item => ({
          id: item.foodItemId,
          name: item.itemName,      // Đổi itemName sang name để khớp code cũ
          price: item.price,
          qty: 0                    // Khởi tạo số lượng đặt mua ban đầu bằng 0
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

// Tự động kích hoạt nạp F&B ngay khi Front-end khởi động
document.addEventListener("DOMContentLoaded", initFnbMenuFromServer);

function handleBookNowClick() {
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
      if (typeof window.currentSelectedShowtimeId !== "undefined") window.currentSelectedShowtimeId = null;
      
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
  
  const detailTitleEl = document.getElementById("detail-movie-title");
  if ((!currentComboValue || currentComboValue === "-") && detailTitleEl && detailTitleEl.innerText !== "-") {
    currentComboValue = detailTitleEl.innerText;
    selectCombo.value = currentComboValue; 
  }

  if ((!currentComboValue || currentComboValue === "-") && selectCombo.options.length > 0) {
    currentComboValue = selectCombo.options[0].value;
    selectCombo.value = currentComboValue;
  }
  
  if (!currentComboValue || currentComboValue === "-") {
    console.warn("⚠️ Không thể tải suất chiếu vì chưa có bộ phim nào được chọn!");
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
    timeGrid.innerHTML = "<p style='color:#666; font-size:13px;'>Hôm nay phim chưa có lịch chiếu. Vui lòng chọn ngày khác!</p>";
    return;
  }

  serverData.showtimes.forEach((t) => {
    // t lúc này là Object từ Backend trả về, ví dụ: { showtimeId: 1, startTime: "19:00", roomId: 2 }
    const isActive = t.showtimeId === selectedShowtime ? "active" : "";
    
    // Khi click chọn suất chiếu, ta truyền t.showtimeId (hoặc t.startTime tùy thuộc luồng ghế của bạn)
    timeGrid.innerHTML += `
      <div class="showtime-btn ${isActive}" onclick="selectTime('${t.showtimeId}', '${t.startTime}')">
        ${t.startTime} <span style="font-size:9px; display:block; opacity:0.6;">Phòng ${t.roomId}</span>
      </div>
    `;
  });
  
  // Cập nhật text hiển thị tổng quan hóa đơn ở cột phải
  const currentShowtimeObj = serverData.showtimes.find(t => t.showtimeId === selectedShowtime);
  document.getElementById("sum-showtime").innerText = currentShowtimeObj ? currentShowtimeObj.startTime : "-";
}

function quickBookMovie(movieTitle) {
  switchCgvTab("panel-booking");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    onMovieOrTimeChange();
  }
}

function selectTime(showtimeId, startTime) {
  if (isHoldingState) return alert("Hóa đơn đã khóa thanh toán!");
  
  selectedShowtime = showtimeId; // Lưu ID suất chiếu để phục vụ đặt vé/lấy ghế xuống DB
  selectedSeats = [];
  
  // Hiển thị giờ chiếu lên hóa đơn bên phải
  document.getElementById("sum-showtime").innerText = startTime || "-";
  
  // Gọi hàm load sơ đồ ghế của suất chiếu này từ Server về
  loadSeatMap(showtimeId);
}

function loadSeatMap(showtimeId) {
  // Biến hiển thị trạng thái chờ cho người dùng (nếu cần)
  const seatGrid = document.getElementById("cgv-seat-grid");
  if (seatGrid) seatGrid.innerHTML = "<p style='color:#fff; padding:20px;'>Đang tải sơ đồ ghế thực tế...</p>";

  // Gọi sang hàm API.getSeatsByShowtime đã thêm trong api.js
  API.getSeatsByShowtime(showtimeId)
    .then((bookedSeatsList) => {
      // bookedSeatsList nhận về từ Spring Boot sẽ là mảng các ghế đã bán, ví dụ: ["A1", "C3", "C4"]
      
      // Lấy tên bộ phim hiện tại đang chọn trong dropdown combo
      const currentMovie = document.getElementById("cgv-combo-movie").value;
      
      // Kiểm tra nếu bộ nhớ tạm serverData chưa khởi tạo cấu trúc, ta tự tạo cho đỡ lỗi
      if (!serverData.masterSeatStore[currentMovie]) {
        serverData.masterSeatStore[currentMovie] = {};
      }
      
      // Lấy sơ đồ ghế cố định sẵn có trong local state ra
      const activeSeatMap = serverData.masterSeatStore[currentMovie][showtimeId] || {};
      
      // Duyệt qua toàn bộ các ghế cố định trên màn hình để đồng bộ trạng thái
      Object.keys(activeSeatMap).forEach((id) => {
        // Nếu mã ghế (id) nằm trong danh sách ghế đã bán từ DB gửi lên -> Đổi status thành "sold"
        if (bookedSeatsList.includes(id)) {
          activeSeatMap[id].status = "sold";
        } else {
          // Ngược lại, nếu không có ai mua thì trả lại trạng thái trống "available"
          activeSeatMap[id].status = "available";
        }
      });
      
      // Lưu lại sơ đồ đã đồng bộ vào state tổng
      serverData.masterSeatStore[currentMovie][showtimeId] = activeSeatMap;

      // Chạy tính toán lại giỏ hàng và render giao diện chuẩn lên màn hình
      calculateCgvCart();
      renderCgvInterface();
    })
    .catch((err) => {
      console.error("🚨 Lỗi đồng bộ dữ liệu ghế từ Server:", err);
      // Nếu lỗi mạng hoặc server chưa viết API, vẫn cho render giao diện mặc định để không chết App
      calculateCgvCart();
      renderCgvInterface();
    });
}

function onMovieOrTimeChange() {
  resetHoldState();
  selectedShowtime = ""; // Xóa suất chiếu cũ đang chọn
  selectedSeats = [];
  
  // Gọi hàm kéo lịch chiếu mới nhất từ Database về
  loadShowtimesFromServer();
}

function selectCgvBookingDate(dateStr) {
  if (isHoldingState) return alert("Hóa đơn đã khóa thanh toán!");
  selectedDateStr = dateStr; // Gán ngày được chọn (YYYY-MM-DD)
  
  // Vẽ lại thanh slider ngày để hiển thị trạng thái active màu đen
  if (typeof generateCgvDateSlider === "function") generateCgvDateSlider();
  
  // Kích hoạt nạp lại lịch chiếu của ngày mới này
  onMovieOrTimeChange();
}
// Đưa hàm selectCgvBookingDate ra phạm vi toàn cục window để nút bấm ở ui.js click được
window.selectCgvBookingDate = selectCgvBookingDate;

function calculateCgvCart() {
  // 🚀 ĐÓNG ĐINH TOÀN CỤC: Ép trình duyệt luôn luôn găm hàm này vào window ngay khi kích hoạt
  window.calculateCgvCart = calculateCgvCart;

  document.getElementById("sum-seats").innerText =
    selectedSeats.join(", ") || "Chưa chọn";
  let total = 0;
  let totalFnbItems = 0;

  // 1. Tính tiền ghế dựa theo các class trên giao diện DOM của em
  selectedSeats.forEach((seatId) => {
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
      // 🚀 ĐÃ SỬA TẠI ĐÂY: Bảo toàn giá ghế khi sang Bước 3 bằng mảng dữ liệu gốc từ database của ui.js
      let seatPriceFound = 90000;
      
      if (window.currentBackendSeats && Array.isArray(window.currentBackendSeats)) {
        const seatData = window.currentBackendSeats.find(s => {
          const row = s.seatRow || s.seat_row || "";
          const num = s.seatNumber || s.seat_number || "";
          return `${row}${num}`.trim().toUpperCase() === seatId.toUpperCase();
        });
        
        if (seatData) {
          const type = (seatData.seatType || seatData.seat_type || "STANDARD").toUpperCase();
          if (type === "VIP") {
            seatPriceFound = 110000;
          } else if (type === "SWEETBOX") {
            seatPriceFound = 250000;
          }
        }
      }
      
      total += seatPriceFound;
    }
  });

  // 2. Tính tiền F&B động từ database mẫu
  const activeFnbMenu = window.fnbMenu || fnbMenu || [];
  activeFnbMenu.forEach((item) => {
    // Ép kiểu Number để chặn đứng lỗi cộng chuỗi text (ví dụ: "65000" + "38000") từ CSDL
    const itemQty = Number(item.qty) || 0;
    const itemPrice = Number(item.price) || 0;
    
    total += itemQty * itemPrice;
    totalFnbItems += itemQty;
  });

  // 3. Đổ dữ liệu thành tiền ra giao diện hóa đơn bên phải
  const sumFnbEl = document.getElementById("sum-fnb");
  if (sumFnbEl) sumFnbEl.innerText = totalFnbItems + " Combo";

  currentPriceTotal = total;
  console.log("calculateCgvCart total =", total);
  console.log("currentPriceTotal =", currentPriceTotal);
  let finalTotal = currentPriceTotal * (1 - (typeof appliedVoucherDiscount !== "undefined" ? appliedVoucherDiscount : 0));
  
  const sumTotalEl = document.getElementById("sum-total");
  if (sumTotalEl) {
    sumTotalEl.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
  }
}

// Chạy mồi một lần ngay lập tức để window nhận diện hàm này toàn cục
window.calculateCgvCart = calculateCgvCart;

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
    // 🚀 NÂNG CẤP BẤT TỬ: Đồng bộ dữ liệu từ DB nhưng bảo toàn số lượng qty cực kỳ nghiêm ngặt
    if (typeof API !== "undefined" && typeof API.getFnbItems === "function") {
      API.getFnbItems()
        .then((dbItems) => {
          const oldMenu = window.fnbMenu || [];
          
          window.fnbMenu = dbItems.map(item => {
            // So khớp chuẩn xác theo foodItemId
            const matchedOldItem = oldMenu.find(o => String(o.id) === String(item.foodItemId));
            return {
              id: item.foodItemId,
              name: item.itemName,
              // Khóa ép kiểu số đề phòng Database trả về chuỗi text gây lỗi NaN khi tính tiền
              price: Number(item.price) || 0,
              qty: matchedOldItem ? matchedOldItem.qty : 0 
            };
          });
          
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

    // 🚀 Ép hàm tính toán lại giỏ hàng chạy trước để đảm bảo tính đúng
    if (typeof calculateCgvCart === "function") {
      calculateCgvCart();
    }

    const currentMovie = document.getElementById("cgv-combo-movie").value;
    
    // 🚀 TÍNH LẠI GIÁ GHẾ CHUẨN XỊN: Không phụ thuộc vào biến currentPriceTotal bị lỗi ẩn DOM
    let verifiedSeatsTotal = 0;
    selectedSeats.forEach((seatId) => {
      let price = 90000;
      if (window.currentBackendSeats && Array.isArray(window.currentBackendSeats)) {
        const seatData = window.currentBackendSeats.find(s => {
          const row = s.seatRow || s.seat_row || "";
          const num = s.seatNumber || s.seat_number || "";
          return `${row}${num}`.trim().toUpperCase() === seatId.toUpperCase();
        });
        if (seatData) {
          const type = (seatData.seatType || seatData.seat_type || "STANDARD").toUpperCase();
          if (type === "VIP") price = 110000;
          else if (type === "SWEETBOX") price = 250000;
        }
      }
      verifiedSeatsTotal += price;
    });

    // Tính tiền F&B hiện tại
    let verifiedFnbTotal = 0;
    const activeFnbReview = window.fnbMenu || fnbMenu || [];
    activeFnbReview.forEach(i => {
      verifiedFnbTotal += (Number(i.qty) || 0) * (Number(i.price) || 0);
    });

    // Tổng số tiền thực tế không lo bị nhảy bậy
    let verifiedInvoiceTotal = verifiedSeatsTotal + verifiedFnbTotal;
    currentPriceTotal = verifiedInvoiceTotal; // Cập nhật lại biến toàn cục chuẩn

    let fnbHtml = activeFnbReview
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
            <p style="font-size: 16px;"><strong>Tổng cộng (Chưa giảm): <span style="color:#e71a0f;">${verifiedInvoiceTotal.toLocaleString("vi-VN")} đ</span></strong></p>
        `;
        
    let finalTotal = verifiedInvoiceTotal * (1 - (typeof appliedVoucherDiscount !== "undefined" ? appliedVoucherDiscount : 0));
    console.log("Step3 currentPriceTotal =", currentPriceTotal);
    document.getElementById("review-final-total").innerText = finalTotal.toLocaleString("vi-VN") + " đ";
    
    // Cập nhật luôn thanh sidebar bên phải cho đồng bộ
    const sumTotalEl = document.getElementById("sum-total");
    if (sumTotalEl) sumTotalEl.innerText = finalTotal.toLocaleString("vi-VN") + " đ";

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

  if (currentBookingStep === 1) {
    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ghế trước!");
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
  document
    .querySelectorAll(".payment-option-row")
    .forEach((row) => row.classList.remove("active"));
  element.classList.add("active");
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

  if (selectedPaymentGateway === "qr") {
    document.getElementById("qr-total-price").innerText =
      finalTotal.toLocaleString("vi-VN") + " đ";
    const bankId = "ICB";
    const accountNo = "101879388698";
    const accountName = "NGUYEN BAO HOANG";
    const qrData = `LAS CINEMAS THANH TOAN`;
    document.getElementById("bank-qr-img").src =
      `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;
    document.getElementById("payment-redirect-modal").classList.add("open");
  } else {
    alert(
      `Đang kết nối đến cổng giao dịch an toàn của ${selectedPaymentGateway.toUpperCase()}... Vui lòng không đóng trình duyệt.`,
    );
    executeFinalCheckout();
  }
}

function backToPaymentSelection() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closePaymentModal() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
}

function executeFinalCheckout() {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  let currentEmail = "";

  if (isUserLoggedInState) {
    currentEmail = document.getElementById("profile-field-email").value;
  } else {
    currentEmail = prompt(
      "Vui lòng nhập địa chỉ Email để nhận mã vé điện tử:",
      "",
    );
    if (!currentEmail) {
      alert("Bạn cần nhập Email để hoàn tất giao dịch!");
      return;
    }
  }

  // 1. Tạo gói dữ liệu chuẩn bị gửi
  const checkoutPayload = {
    movie: currentMovie,
    showtime: selectedShowtime,
    seats: selectedSeats,
    email: currentEmail,
  };

  // 2. Gọi API chuẩn qua api.js
  API.checkoutTickets(checkoutPayload)
    .then((data) => {
      // Đóng modal thanh toán đang xoay xoay
      document
        .getElementById("payment-redirect-modal")
        .classList.remove("open");

      if (data.success) {
        // --- LOGIC XỬ LÝ KHI THÀNH CÔNG ---

        // Bôi đỏ ghế đã bán trong bộ nhớ tạm
        selectedSeats.forEach((seatId) => {
          if (
            serverData.masterSeatStore[currentMovie] &&
            serverData.masterSeatStore[currentMovie][selectedShowtime]
          ) {
            serverData.masterSeatStore[currentMovie][selectedShowtime][
              seatId
            ].status = "sold";
          }
        });

        // Tạo mã ID vé (Nếu Java không trả về thì tự gen ngẫu nhiên)
        const lasTicketId = data.ticketId
          ? data.ticketId.replace("CGV-", "LAS-")
          : "LAS-" + Math.floor(Math.random() * 1000000);

        // 🚀 ĐÃ SỬA CHỖ 1: Lấy đúng data bắp nước từ database để lưu lịch sử hóa đơn
        const activeFnb = window.fnbMenu || fnbMenu || [];
        const invoiceObj = {
          id: lasTicketId,
          movie: currentMovie,
          date: selectedDateStr,
          time: selectedShowtime,
          seats: [...selectedSeats],
          fnb: activeFnb.filter((i) => i.qty > 0).map((i) => ({ ...i })),
          total: currentPriceTotal * (1 - appliedVoucherDiscount),
          status: "Đã thanh toán",
        };
        userPastInvoices.unshift(invoiceObj);

        // Reset trạng thái chọn ghế & giỏ hàng
        resetHoldState();
        selectedSeats = [];
        
        // 🚀 ĐÃ SỬA CHỖ 2: Đưa số lượng combo động về lại 0 sau khi thanh toán xong
        activeFnb.forEach((i) => (i.qty = 0));
        
        renderFnbMenu();
        calculateCgvCart();
        renderCgvInterface();

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
          goToBookingStep(4);
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
}

function cancelCurrentTransaction() {
  if (
    confirm("Bạn có chắc chắn muốn hủy giao dịch và bỏ giữ các ghế này không?")
  ) {
    const currentMovie = document.getElementById("cgv-combo-movie").value;

    API.cancelBooking({
      movie: currentMovie,
      showtime: selectedShowtime,
      seats: selectedSeats,
    })
      .then(() => {
        resetHoldState();
        selectedSeats = [];
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
