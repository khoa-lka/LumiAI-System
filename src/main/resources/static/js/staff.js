function getLoggedUser() {
  try {
    const raw = localStorage.getItem("las_logged_in_user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Không đọc được thông tin đăng nhập:", error);
    return null;
  }
}

function getUserRoleId(user) {
  if (user) {
    const roleId =
      user.roleId ?? user.role_id ?? user.role?.roleId ?? user.role?.role_id;
    if (roleId !== undefined && roleId !== null) return Number(roleId);
  }
  const sessionRoleId = sessionStorage.getItem("roleId");
  return sessionRoleId ? Number(sessionRoleId) : null;
}

const selectedSeats = new Set();
let bookedSeats = new Set();
let currentSeatMap = [];
let lastOrder = null;
let selectedFoods = {};
let appliedVoucher = null;
let pendingCheckoutData = null;

function formatMoney(value) {
  return Number(value).toLocaleString("vi-VN") + "đ";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

async function readJsonResponse(response, label = "Lỗi API") {
  const rawBody = await response.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      data = rawBody;
    }
  }

  if (!response.ok) {
    let serverMessage = "";

    if (typeof data === "string") {
      serverMessage = data;
    } else if (data && typeof data === "object") {
      serverMessage =
        data.message || data.error || data.detail || data.title || "";
    }

    const error = new Error(
      `${label} (${response.status})${serverMessage ? `: ${serverMessage}` : ""}`,
    );
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function fetchJson(url, options = {}, label = "Lỗi API") {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  return readJsonResponse(response, label);
}

function renderPosLoadError(element, error, fallbackMessage) {
  if (!element) return;

  const isForbidden = Number(error?.status) === 403;
  element.innerHTML = `
    <p style="color: #ce628f; line-height: 1.6;">
      ${
        isForbidden
          ? "Máy chủ đang chặn quyền truy cập API POS (403). Hãy thêm /api/pos/** vào SecurityConfig."
          : fallbackMessage
      }
    </p>
  `;
}

window.openTab = function (tabId, button) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active");
  if (button) button.classList.add("active");

  const title = document.getElementById("pageTitle");
  if (tabId === "buy-ticket") title.textContent = "Mua vé tại quầy";
  else if (tabId === "print-ticket") title.textContent = "In vé";
  else if (tabId === "feedback") title.textContent = "Phản hồi khách hàng";
};

// Popup xác nhận đăng xuất (thay cho confirm() mặc định của trình duyệt) —
// theo bản chỉnh sửa của bạn cùng nhóm.
window.logout = function () {
  document.getElementById("confirmModal").style.display = "flex";
};
window.closeConfirmModal = function () {
  document.getElementById("confirmModal").style.display = "none";
};
window.executeLogout = function () {
  sessionStorage.clear();
  localStorage.removeItem("las_logged_in_user");
  window.location.href = "index.html";
};

// ======================= F&B & VOUCHER =======================
async function loadFood() {
  const foodList = document.getElementById("foodList");

  try {
    const foods = await fetchJson(
      "/api/pos/food",
      {},
      "Không thể tải danh sách F&B",
    );

    if (!Array.isArray(foods)) {
      throw new Error("Dữ liệu F&B từ máy chủ không phải là một danh sách.");
    }

    if (!foodList) return;

    foodList.innerHTML = "";
    selectedFoods = {};

    foods.forEach((f) => {
      const foodId = f.foodItemId ?? f.food_item_id ?? f.id;

      if (foodId === undefined || foodId === null) return;

      selectedFoods[foodId] = {
        id: foodId,
        name: f.itemName || f.item_name || f.name || "Sản phẩm",
        price: Number(f.price || 0),
        qty: 0,
      };

      const itemDiv = document.createElement("div");
      itemDiv.className = "fb-item";
      itemDiv.innerHTML = `
        <div class="fb-info">
          <b>${selectedFoods[foodId].name}</b>
          <span>${formatMoney(selectedFoods[foodId].price)}</span>
        </div>
        <div class="fb-action">
          <button type="button" onclick="changeFoodQty(${foodId}, -1)">-</button>
          <span class="fb-qty" id="qty-${foodId}">0</span>
          <button type="button" onclick="changeFoodQty(${foodId}, 1)">+</button>
        </div>
      `;
      foodList.appendChild(itemDiv);
    });

    if (foods.length === 0) {
      foodList.innerHTML =
        "<p style='color: #9b9ba5;'>Hiện chưa có sản phẩm F&B.</p>";
    }
  } catch (error) {
    console.error("LOAD FOOD ERROR:", error);
    renderPosLoadError(
      foodList,
      error,
      "Không thể tải danh sách F&B từ máy chủ.",
    );
  }
}

window.changeFoodQty = function (id, change) {
  const food = selectedFoods[id];
  if (!food) return;
  let newQty = food.qty + change;
  if (newQty < 0) newQty = 0;
  food.qty = newQty;
  document.getElementById(`qty-${id}`).textContent = newQty;
  updateSummary();
};

window.applyVoucher = async function () {
  const codeInput = document.getElementById("voucherInput");
  const code = codeInput.value.trim().toUpperCase();
  if (!code) {
    alert("Vui lòng nhập mã giảm giá.");
    return;
  }

  try {
    const response = await fetch(`/api/pos/vouchers/validate?code=${code}`);
    if (!response.ok) {
      alert(await response.text());
      appliedVoucher = null;
      updateSummary();
      return;
    }
    appliedVoucher = await response.json();
    alert("Áp dụng mã giảm giá thành công!");
    updateSummary();
  } catch (error) {
    alert("Lỗi kết nối đến máy chủ.");
  }
};

window.changePaymentMethod = function (radioElem) {
  document
    .querySelectorAll(".payment-method-card")
    .forEach((card) => card.classList.remove("active"));
  radioElem.closest(".payment-method-card").classList.add("active");
};

// ======================= SEAT & SHOWTIME =======================
async function loadMovies() {
  const movieSelect = document.getElementById("movie");

  try {
    const movies = await fetchJson(
      "/api/pos/movies",
      {},
      "Không thể tải danh sách phim",
    );

    if (!Array.isArray(movies)) {
      throw new Error("Dữ liệu phim từ máy chủ không phải là một danh sách.");
    }

    if (!movieSelect) return;

    movieSelect.innerHTML = '<option value="">Chọn phim</option>';

    movies.forEach((movie) => {
      const movieId = movie.movieId ?? movie.movie_id ?? movie.id;
      if (movieId === undefined || movieId === null) return;

      const option = document.createElement("option");
      option.value = movieId;
      option.textContent = movie.title || movie.movieTitle || "Phim";
      movieSelect.appendChild(option);
    });
  } catch (error) {
    console.error("LOAD MOVIES ERROR:", error);

    if (movieSelect) {
      movieSelect.innerHTML = '<option value="">Không thể tải phim</option>';
      movieSelect.disabled = true;
    }

    if (Number(error?.status) === 403) {
      showToast(
        "Backend đang chặn /api/pos/**. Hãy sửa SecurityConfig rồi tải lại trang.",
        false,
      );
    }
  }
}

async function loadShowtimes() {
  const movieId = document.getElementById("movie").value;
  const date = document.getElementById("date").value;
  const showtimeContainer = document.querySelector(".showtime-list");
  bookedSeats.clear();
  drawSeatMap();
  if (!movieId || !date) {
    showtimeContainer.innerHTML =
      "<p style='color: #5c5c62;'>Vui lòng chọn phim và ngày chiếu.</p>";
    return;
  }

  try {
    const response = await fetch(
      `/api/pos/movies/${movieId}/showtimes?date=${date}`,
    );
    if (!response.ok) throw new Error("Lỗi tải suất chiếu");
    const showtimes = await response.json();
    showtimeContainer.innerHTML = "";

    if (showtimes.length === 0) {
      showtimeContainer.innerHTML =
        "<p style='color: #ce628f;'>Không có suất chiếu nào cho ngày này.</p>";
      return;
    }

    showtimes.forEach((st) => {
      const timeString = new Date(st.startTime).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "showtime-btn";
      btn.dataset.showtime = timeString;
      btn.dataset.showtimeId = st.showtimeId;
      btn.innerHTML = `<b>${timeString}</b><small>${st.roomName}</small>`;

      btn.addEventListener("click", function () {
        document
          .querySelectorAll(".showtime-btn")
          .forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("showtime").value = timeString;
        loadSeatMapForShowtime(st.showtimeId);
      });
      showtimeContainer.appendChild(btn);
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadBookedSeats(showtimeId) {
  try {
    const response = await fetch(
      `/api/pos/showtimes/${showtimeId}/booked-seats`,
    );
    const soldSeats = await response.json();
    bookedSeats.clear();
    soldSeats.forEach((seat) => bookedSeats.add(seat));
    drawSeatMap();
  } catch (error) {
    console.error(error);
  }
}

async function loadSeatMapForShowtime(showtimeId) {
  try {
    const response = await fetch(`/api/pos/showtimes/${showtimeId}/seats`);
    if (!response.ok) throw new Error("Lỗi tải sơ đồ ghế");
    currentSeatMap = await response.json();
    await loadBookedSeats(showtimeId);
  } catch (error) {
    console.error(error);
  }
}

function drawSeatMap() {
  const seatMap = document.getElementById("seatMap");
  if (!seatMap) return;
  seatMap.innerHTML = "";
  updateSummary();
  if (currentSeatMap.length === 0) return;

  // Đồng bộ y hệt cách chia lưới ghế của luồng khách hàng (xem js/ui.js
  // renderCgvInterface): phòng nhiều cột (IMAX) thì thu nhỏ ghế + gap lại.
  const maxCols = Math.max(...currentSeatMap.map((s) => s.colIndex));
  const isImaxRoom = maxCols > 10;
  seatMap.style.display = "grid";
  seatMap.style.gridTemplateColumns = `repeat(${maxCols}, 1fr)`;
  seatMap.style.gap = isImaxRoom ? "4px" : "6px";
  seatMap.classList.toggle("imax-room", isImaxRoom);

  currentSeatMap.forEach((s) => {
    const seatBtn = document.createElement("button");
    seatBtn.type = "button";
    seatBtn.className = "seat";
    const seatName = s.seatRow + s.seatNumber;
    seatBtn.textContent = seatName;
    seatBtn.dataset.seat = seatName;

    seatBtn.style.gridRow = s.rowIndex;
    seatBtn.style.gridColumn = s.colIndex;

    if (s.seatType === "VIP") seatBtn.classList.add("vip");
    if (s.seatType === "SWEETBOX") seatBtn.classList.add("sweetbox");

    if (bookedSeats.has(seatName)) {
      seatBtn.classList.add("booked");
      seatBtn.disabled = true;
    } else if (selectedSeats.has(seatName)) {
      seatBtn.classList.add("selected");
    }

    seatBtn.addEventListener("click", function () {
      if (seatBtn.disabled) return;
      if (selectedSeats.has(seatName)) {
        selectedSeats.delete(seatName);
        seatBtn.classList.remove("selected");
      } else {
        selectedSeats.add(seatName);
        seatBtn.classList.add("selected");
      }
      updateSummary();
    });
    seatMap.appendChild(seatBtn);
  });
}

// ======================= SUMMARY & CHECKOUT =======================
function updateSummary() {
  const seats = Array.from(selectedSeats);
  const quantity = seats.length;
  let ticketTotal = 0;
  let fbTotal = 0;

  seats.forEach((seatName) => {
    const seatElement = document.querySelector(
      `.seat[data-seat='${seatName}']`,
    );
    if (seatElement) {
      if (seatElement.classList.contains("vip")) ticketTotal += 110000;
      else if (seatElement.classList.contains("sweetbox"))
        ticketTotal += 250000;
      else ticketTotal += 90000;
    }
  });

  for (const key in selectedFoods) {
    if (selectedFoods[key].qty > 0)
      fbTotal += selectedFoods[key].price * selectedFoods[key].qty;
  }

  let discountAmount = 0;
  let tempTotal = ticketTotal + fbTotal;

  if (appliedVoucher) {
    const minOrder =
      appliedVoucher.minimumOrder || appliedVoucher.minimum_order || 0;
    const type = appliedVoucher.discountType || appliedVoucher.discount_type;
    const value =
      appliedVoucher.discountValue || appliedVoucher.discount_value || 0;
    const maxDiscount =
      appliedVoucher.maxDiscount || appliedVoucher.max_discount;

    if (tempTotal >= minOrder) {
      if (type === "PERCENT") {
        discountAmount = tempTotal * (value / 100);
        if (maxDiscount && discountAmount > maxDiscount)
          discountAmount = maxDiscount;
      } else if (type === "FIXED") {
        discountAmount = value;
      }
    } else {
      alert(`Mã giảm giá yêu cầu đơn tối thiểu ${formatMoney(minOrder)}.`);
      appliedVoucher = null;
      document.getElementById("voucherInput").value = "";
    }
  }

  let finalTotal = tempTotal - discountAmount;
  if (finalTotal < 0) finalTotal = 0;

  setText("ticketQuantity", quantity);
  setText("selectedSeats", quantity ? seats.join(", ") : "Chưa chọn ghế");
  setText("subtotalPrice", formatMoney(tempTotal));
  setText("discountPrice", "-" + formatMoney(discountAmount));
  setText("totalPrice", formatMoney(finalTotal));
}

function readMoneyValue(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return 0;

  return Number(String(element.textContent || "").replace(/[^\d]/g, "")) || 0;
}

function getLoggedAccountId() {
  const loggedUser = getLoggedUser();

  const accountId = Number(
    loggedUser?.accountId ||
      loggedUser?.account_id ||
      loggedUser?.id ||
      sessionStorage.getItem("accountId"),
  );

  return Number.isFinite(accountId) && accountId > 0 ? accountId : null;
}

window.createOrder = async function () {
  const movieSelect = document.getElementById("movie");
  const movieId = Number(movieSelect?.value);
  const movieName =
    movieSelect?.options?.[movieSelect.selectedIndex]?.textContent?.trim() ||
    "";
  const date = document.getElementById("date")?.value || "";
  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value || "";

  const activeShowtimeBtn = document.querySelector(".showtime-btn.active");
  const showtimeId = Number(activeShowtimeBtn?.dataset?.showtimeId);
  const seats = Array.from(selectedSeats);

  if (!movieId || !date || !showtimeId) {
    showToast("Vui lòng chọn đầy đủ Phim, Ngày và Suất chiếu.", false);
    return;
  }

  if (seats.length === 0) {
    showToast("Vui lòng chọn ít nhất một ghế để tiếp tục.", false);
    return;
  }

  const accountId = getLoggedAccountId();

  if (!accountId) {
    showToast(
      "Không tìm thấy accountId của tài khoản Staff. Vui lòng đăng nhập lại.",
      false,
    );
    return;
  }

  const loggedUser = getLoggedUser() || {};
  const foodItems = [];

  for (const key in selectedFoods) {
    const food = selectedFoods[key];

    if (Number(food?.qty) > 0) {
      foodItems.push({
        foodItemId: Number(food.id),
        quantity: Number(food.qty),
        subtotal: Number(food.price || 0) * Number(food.qty),
      });
    }
  }

  const fnb = foodItems.map((item) => ({
    foodItemId: item.foodItemId,
    quantity: item.quantity,
  }));

  const grossAmount = readMoneyValue("subtotalPrice");
  const totalAmount = readMoneyValue("totalPrice");

  const voucherInputCode =
    document.getElementById("voucherInput")?.value?.trim()?.toUpperCase() || "";

  const voucherCode =
    appliedVoucher?.voucherCode ||
    appliedVoucher?.voucher_code ||
    voucherInputCode ||
    "";

  const voucherId =
    appliedVoucher?.voucherId ?? appliedVoucher?.voucher_id ?? null;

  /*
   * Giữ cả field cũ của /api/pos/checkout và field mới của
   * PaymentController/CheckoutRequest. Việc dùng cùng một dữ liệu ở lúc tạo
   * PayOS và lúc checkout giúp checkoutHash không bị lệch.
   */
  pendingCheckoutData = {
    // Field cũ của POS
    showtimeId,
    seats,
    foodItems,
    totalAmount,
    staffId: accountId,
    paymentMethod,
    voucherId,

    // Field đầy đủ cho PaymentController tạo PayOS
    accountId,
    movieId,
    movieName,
    email: loggedUser.email || "",
    grossAmount,
    totalMoney: totalAmount,
    voucherCode,
    fnb,

    // Được gắn sau khi PayOS tạo giao dịch thành công
    paymentReference: null,
    qrRef: null,
  };

  console.log("STAFF CHECKOUT DATA:", pendingCheckoutData);

  if (paymentMethod === "CASH" || totalAmount === 0) {
    executeCheckoutAPI();
  } else {
    startVietQRPayOSFlow(totalAmount);
  }
};

let qrCountdownInterval = null;
let staffPayOSOrderCode = null;
let staffQrPollInterval = null;
let staffQrPollErrorCount = 0;

function setStepTexts(t1, d1, t2, d2, t3, d3) {
  setText("qrStep1Title", t1);
  setText("qrStep1Desc", d1);
  setText("qrStep2Title", t2);
  setText("qrStep2Desc", d2);
  setText("qrStep3Title", t3);
  setText("qrStep3Desc", d3);
}

// Đếm ngược 15:00 giống hệt luồng khách hàng (vietqr-timer).
function startQrCountdown(seconds) {
  if (qrCountdownInterval) clearInterval(qrCountdownInterval);
  let remaining = seconds;
  const render = () => {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    setText("qrCountdown", `${m}:${s}`);
  };
  render();
  qrCountdownInterval = setInterval(() => {
    remaining--;
    if (remaining < 0) {
      clearInterval(qrCountdownInterval);
      return;
    }
    render();
  }, 1000);
}

// ======================= VIETQR (PayOS thật) =======================
// Dùng đúng API PayOS mà luồng khách hàng (booking.js: API.createPayOSPayment /
// API.getQrPaymentStatus) đang gọi — /api/payment/payos/create + /api/payment/qr/status/{orderCode}
// (là các endpoint chung trong PaymentController, không gắn với session khách hàng nên
// POS gọi thẳng được). Nhờ vậy mã QR là thật (Napas thật, đúng số tiền) và có thể tự
// nhận diện thanh toán qua webhook giống hệt bên khách hàng — nếu server public/webhook
// không tới được (ví dụ chạy localhost khi test), nhân viên vẫn bấm nút xác nhận thủ công
// như bình thường, không bị chặn.
async function startVietQRPayOSFlow(amount) {
  const modal = document.getElementById("qrModal");

  if (!pendingCheckoutData) {
    showToast("Không tìm thấy dữ liệu đơn hàng để tạo PayOS.", false);
    return;
  }

  const accountId = Number(
    pendingCheckoutData.accountId || pendingCheckoutData.staffId,
  );

  if (!accountId) {
    showToast(
      "Thiếu accountId của Staff. Vui lòng đăng nhập lại trước khi thanh toán.",
      false,
    );
    return;
  }

  modal.style.display = "flex";
  document.getElementById("qrTitle").textContent = "Đang tạo mã VietQR...";
  setText("qrSubtitle", "Đang kết nối PayOS, vui lòng đợi...");
  setText("qrStatusText", "Đang tạo mã thanh toán...");

  /*
   * PaymentController hiện nhận CheckoutRequest, không còn chỉ nhận { amount }.
   * Vì backend tự tính tiền và tạo checkoutHash, phải gửi nguyên dữ liệu đơn.
   */
  const payOSRequest = {
    accountId,
    movieId: pendingCheckoutData.movieId,
    movieName: pendingCheckoutData.movieName,
    showtimeId: Number(pendingCheckoutData.showtimeId),
    seats: [...pendingCheckoutData.seats],
    email: pendingCheckoutData.email || "",

    // Giữ amount để tương thích controller cũ, nhưng backend mới sẽ tự tính lại.
    amount: Math.round(Number(amount) || 0),
    grossAmount: Number(pendingCheckoutData.grossAmount) || 0,
    totalMoney: Math.round(
      Number(pendingCheckoutData.totalMoney ?? amount) || 0,
    ),

    voucherCode: pendingCheckoutData.voucherCode || "",
    paymentMethod: "QR",
    fnb: Array.isArray(pendingCheckoutData.fnb)
      ? pendingCheckoutData.fnb.map((item) => ({
          foodItemId: Number(item.foodItemId),
          quantity: Number(item.quantity),
        }))
      : [],
  };

  console.log("STAFF PAYOS CREATE REQUEST:", payOSRequest);

  try {
    const data = await fetchJson(
      "/api/payment/payos/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payOSRequest),
      },
      "Không thể tạo giao dịch PayOS",
    );

    if (data?.code && String(data.code) !== "00") {
      throw new Error(
        data.desc || data.message || "PayOS từ chối tạo giao dịch thanh toán.",
      );
    }

    const payload = data?.data || data || {};

    const paymentReference =
      data?.paymentReference ||
      payload.paymentReference ||
      payload.transactionCode ||
      payload.qrRef ||
      payload.orderCode;

    const orderCode = payload.orderCode || data?.orderCode || paymentReference;

    const qrCode = payload.qrCode || payload.qrData || data?.qrCode;

    if (!paymentReference || !orderCode || !qrCode) {
      console.error("PAYOS RESPONSE KHÔNG ĐỦ DỮ LIỆU:", data);
      throw new Error(
        "Backend không trả về đủ orderCode, paymentReference hoặc qrCode.",
      );
    }

    staffPayOSOrderCode = String(orderCode);

    // Giữ mã giao dịch để bước checkout sau thanh toán có thể đối chiếu.
    pendingCheckoutData.paymentReference = String(paymentReference);
    pendingCheckoutData.qrRef = String(paymentReference);

    console.log("STAFF PAYOS CREATE RESPONSE:", data);
    console.log("STAFF PAYOS PAYMENT REFERENCE:", paymentReference);

    showQRModal(Number(payload.amount || amount), qrCode);
    startVietQRPolling();
  } catch (error) {
    console.error("Lỗi tạo thanh toán PayOS:", error);
    showToast(error.message || "Không thể kết nối đến PayOS.", false);
    closeQRModal();
  }
}

function startVietQRPolling() {
  stopVietQRPolling();
  staffQrPollErrorCount = 0;
  const statusEl = document.getElementById("qrStatusText");

  staffQrPollInterval = setInterval(async () => {
    if (!staffPayOSOrderCode) return;
    try {
      const data = await fetchJson(
        `/api/payment/qr/status/${encodeURIComponent(staffPayOSOrderCode)}`,
        {},
        "Không thể kiểm tra trạng thái PayOS",
      );

      if (data.paymentStatus === "SUCCESS") {
        if (statusEl) {
          statusEl.textContent = "Thanh toán thành công!";
          statusEl.className = "qr-status qr-status-success";
        }
        stopVietQRPolling();
        closeQRModal();
        executeCheckoutAPI();
      } else if (data.paymentStatus === "CANCELLED") {
        if (statusEl) {
          statusEl.textContent = "Giao dịch đã bị hủy.";
          statusEl.className = "qr-status";
        }
        stopVietQRPolling();
      } else {
        if (statusEl) {
          statusEl.textContent = "Đang chờ thanh toán...";
          statusEl.className = "qr-status qr-status-wait";
        }
      }
    } catch (error) {
      staffQrPollErrorCount++;
      console.error("Lỗi kiểm tra trạng thái QR:", error);
    }
  }, 3000);
}

function stopVietQRPolling() {
  if (staffQrPollInterval) {
    clearInterval(staffQrPollInterval);
    staffQrPollInterval = null;
  }
}

function showQRModal(amount, payOSQrCode = null) {
  const modal = document.getElementById("qrModal");
  const qrImage = document.getElementById("qrImage");
  const qrCaption = document.getElementById("qrCaption");
  const bankBadges = document.getElementById("qrBankBadges");
  const banksLabel = document.getElementById("qrBanksLabel");
  const statusText = document.getElementById("qrStatusText");
  document.getElementById("qrAmountDisplay").textContent = formatMoney(amount);

  document.getElementById("qrTitle").textContent = "Chuyển khoản QR Quốc Gia";
  setText("qrSubtitle", "Thanh toán an toàn qua VietQR - Napas 247");
  if (qrCaption) qrCaption.textContent = "Mã QR VietQR — Napas 247";
  if (bankBadges) bankBadges.style.display = "flex";
  if (banksLabel) banksLabel.style.display = "block";
  if (statusText) {
    statusText.style.display = "block";
    statusText.textContent = "Đang chờ thanh toán...";
    statusText.className = "qr-status qr-status-wait";
  }
  setStepTexts(
    "Mở app ngân hàng",
    "Chọn quét mã QR",
    "Quét mã QR",
    "Kiểm tra số tiền",
    "Xác nhận",
    "Hoàn tất thanh toán",
  );
  if (payOSQrCode) {
    // QR thật từ PayOS (đúng số tiền, đúng nội dung, quét ra ngân hàng thật) —
    // y hệt cách booking.js render bank-qr-img cho khách hàng.
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payOSQrCode)}`;
  } else {
    // Fallback hiếm khi dùng tới (PayOS lỗi nhưng vẫn muốn hiển thị gì đó).
    const BANK_BIN = "970422";
    const ACCOUNT_NO = "0123456789";
    const ACCOUNT_NAME = "CINEMA LUMI AI";
    qrImage.src = `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=Thanh toan ve phim&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  }
  startQrCountdown(15 * 60);
  modal.style.display = "flex";
}

window.closeQRModal = function () {
  document.getElementById("qrModal").style.display = "none";
  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }
  stopVietQRPolling();
  staffPayOSOrderCode = null;
};
window.confirmQRPayment = function () {
  closeQRModal();
  executeCheckoutAPI();
};

async function executeCheckoutAPI() {
  try {
    if (!pendingCheckoutData) {
      throw new Error("Không tìm thấy dữ liệu checkout.");
    }

    console.log("STAFF POS CHECKOUT REQUEST:", pendingCheckoutData);

    const response = await fetch("/api/pos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingCheckoutData),
    });

    const rawResponse = await response.text();

    if (!response.ok) {
      let message = rawResponse;

      try {
        const errorData = rawResponse ? JSON.parse(rawResponse) : {};
        message =
          errorData.message ||
          errorData.error ||
          errorData.detail ||
          rawResponse;
      } catch (error) {
        // Giữ nguyên response text.
      }

      throw new Error(message || "Backend không thể hoàn tất đơn POS.");
    }

    let orderCode = rawResponse;

    try {
      const result = rawResponse ? JSON.parse(rawResponse) : {};
      orderCode =
        result.orderCode || result.code || result.message || rawResponse;
    } catch (error) {
      // Endpoint POS cũ trả plain text nên giữ nguyên.
    }

    // 1. Lấy dữ liệu tên phim, ngày, giờ từ HTML
    const movieSelect = document.getElementById("movie");
    const movieName = movieSelect.options[movieSelect.selectedIndex].text;
    const date = document.getElementById("date").value;
    const time = document.getElementById("showtime").value;
    const seats = Array.from(selectedSeats);
    const totalPaid = pendingCheckoutData.totalAmount;
    const orderInfoForPrint = {
      orderCode: orderCode,
      movie:
        document.getElementById("movie").options[
          document.getElementById("movie").selectedIndex
        ].text,
      date: document.getElementById("date").value,
      showtime: document.getElementById("showtime").value,
      seats: Array.from(selectedSeats),
      ticketCode: "TIX-" + orderCode, // Giả định ticketCode theo mã đơn để hiển thị
    };
    localStorage.setItem(
      "las_last_pos_order",
      JSON.stringify(orderInfoForPrint),
    );
    // 2. Mở Popup Vé Thành Công
    showTicketSuccessModal(
      orderCode,
      movieName,
      date,
      time,
      seats,
      selectedFoods,
      totalPaid,
    );

    // 3. Xóa trắng giỏ hàng (Để sẵn sàng cho khách tiếp theo)
    selectedSeats.clear();
    for (const key in selectedFoods) {
      selectedFoods[key].qty = 0;
      document.getElementById(`qty-${key}`).textContent = 0;
    }
    appliedVoucher = null;
    document.getElementById("voucherInput").value = "";

    const activeShowtimeBtn = document.querySelector(".showtime-btn.active");
    if (activeShowtimeBtn)
      loadSeatMapForShowtime(activeShowtimeBtn.dataset.showtimeId);
    else drawSeatMap();

    updateSummary();
  } catch (error) {
    alert("Thanh toán thất bại: " + error.message);
  }
}
function showTicketSuccessModal(
  orderCode,
  movieName,
  date,
  time,
  seats,
  foodsObj,
  totalPaid,
) {
  document.getElementById("successMovieName").textContent = movieName;
  document.getElementById("successDate").textContent = date;
  document.getElementById("successTime").textContent = time;
  document.getElementById("successSeatCount").textContent = seats.length;

  // Nạp danh sách ghế
  const seatsContainer = document.getElementById("successSeats");
  seatsContainer.innerHTML = seats
    .map((s) => `<span class="seat-badge">${s}</span>`)
    .join("");

  // Nạp danh sách Bắp nước
  const foodsContainer = document.getElementById("successFoodList");
  const foodArr = [];
  for (const k in foodsObj) {
    if (foodsObj[k].qty > 0)
      foodArr.push(`${foodsObj[k].name} (x${foodsObj[k].qty})`);
  }
  if (foodArr.length === 0) {
    foodsContainer.innerHTML = `<li>Không có</li>`;
  } else {
    foodsContainer.innerHTML = foodArr.map((f) => `<li>${f}</li>`).join("");
  }

  // Nạp mã đơn, giá tiền và vẽ mã QR bằng API
  document.getElementById("successOrderCode").textContent = orderCode;
  document.getElementById("successTotalPaid").textContent =
    formatMoney(totalPaid);
  document.getElementById("successQrImg").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderCode)}`;

  // Bật Popup
  document.getElementById("ticketSuccessModal").style.display = "flex";
}

// Hàm tắt Popup Vé khi nhân viên bấm "Về trang chủ"
window.closeTicketSuccessModal = function () {
  document.getElementById("ticketSuccessModal").style.display = "none";
};
// ======================= TOOLS (SEARCH, FEEDBACK) =======================
// Tra cứu đơn hàng/vé thật trong DB qua /api/pos/orders/search — trước đây
// hàm này chỉ so khớp với đơn vừa bán gần nhất lưu trong localStorage của
// đúng trình duyệt đó (không tra được đơn cũ / đơn từ máy POS khác).
window.searchTicket = async function () {
  const input = document.getElementById("ticketSearch");

  const ticketResult = document.getElementById("ticketResult");

  const orderCode = input?.value?.trim().toUpperCase() || "";

  if (!orderCode) {
    ticketResult?.classList.remove("show");

    showToast("Vui lòng nhập mã đơn hàng.", false);

    input?.focus();
    return;
  }

  try {
    const response = await fetch(
      `/api/pos/orders/search?code=${encodeURIComponent(orderCode)}`,
    );

    if (!response.ok) {
      const errorText = await response.text();

      ticketResult?.classList.remove("show");

      showToast(errorText || "Không tìm thấy đơn hàng.", false);

      return;
    }

    const order = await response.json();

    console.log("ORDER SEARCH RESULT:", order);

    setText("resultOrderCode", order.orderCode || "N/A");

    setText("resultTicketCode", order.ticketCode || "N/A");

    setText("resultMovie", order.movie || "N/A");

    const showtimeText = [order.showtime, order.date]
      .filter(Boolean)
      .join(" - ");

    setText("resultShowtime", showtimeText || "N/A");

    setText(
      "resultSeats",
      Array.isArray(order.seats) && order.seats.length > 0
        ? order.seats.join(", ")
        : "N/A",
    );

    ticketResult?.classList.add("show");

    showToast("Đã tìm thấy đơn hàng.", true);
  } catch (error) {
    console.error("Lỗi tìm đơn hàng:", error);

    ticketResult?.classList.remove("show");

    showToast("Không thể kết nối đến máy chủ.", false);
  }
};

window.printTicket = function () {
  if (!document.getElementById("ticketResult").classList.contains("show")) {
    alert("Vui lòng tìm vé trước khi in.");
    return;
  }
  window.print();
};

window.replyFeedback = async function (textareaId, statusId) {
  const content = document.getElementById(textareaId).value.trim();
  if (!content) {
    alert("Vui lòng nhập nội dung.");
    return;
  }

  const loggedUser = getLoggedUser();
  // Đảm bảo account_staff_id được gửi đúng tên biến mà Entity của bạn quy định
  const feedbackData = {
    content: content,
    title: "Đánh giá từ nhân viên", // Bạn có thể sửa thành title thực tế
    ratingStars: 5, // Có thể làm thêm ô nhập sao nếu muốn
    accountStaffId: loggedUser ? loggedUser.accountId || 1 : 1,
    createdAt: new Date().toISOString(), // Định dạng chuẩn cho Java
  };

  try {
    const response = await fetch("/api/pos/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackData),
    });
    if (response.ok) {
      alert("Gửi thành công!");
      document.getElementById(textareaId).value = "";
      loadFeedbacks(); // Tự động load lại danh sách phản hồi mới nhất
    } else {
      alert("Lỗi: " + (await response.text()));
    }
  } catch (error) {
    alert("Lỗi kết nối server.");
  }
};

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", function () {
  const loggedUser = getLoggedUser();
  if (!loggedUser) {
    alert("Vui lòng đăng nhập để truy cập máy POS.");
    window.location.replace("index.html");
    return;
  }
  const userRoleId = getUserRoleId(loggedUser);
  if (userRoleId !== 2) {
    alert("Chỉ tài khoản Staff mới được truy cập máy POS.");
    window.location.replace("index.html");
    return;
  }
  const fullName =
    loggedUser.fullName ||
    loggedUser.name ||
    loggedUser.username ||
    "Nhân viên";
  setText("pageTitle", "Xin chào, " + fullName);
  setText("staffName", fullName);

  document.getElementById("movie").addEventListener("change", loadShowtimes);

  document.querySelectorAll(".date-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".date-btn")
        .forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById("date").value = button.dataset.date;
      loadShowtimes();
    });
  });
  loadFeedbacks();
  renderDates();
  loadMovies();
  drawSeatMap();
  loadFood();
});

// Hàm tự động sinh 14 ngày chiếu kể từ hôm nay
function renderDates() {
  const container = document.getElementById("dateListContainer");
  if (!container) return;
  container.innerHTML = "";

  const today = new Date();
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    // Chuẩn hóa ngày tháng năm (YYYY-MM-DD) để gửi xuống API
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateString = `${yyyy}-${mm}-${dd}`;

    // Chuẩn hóa hiển thị (T6, 10, Th07)
    const dow = dayNames[d.getDay()];
    const day = d.getDate();
    const month = `Th${String(d.getMonth() + 1).padStart(2, "0")}`;

    // Tạo nút bấm
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `date-btn ${i === 0 ? "active" : ""}`;
    btn.dataset.date = dateString;
    btn.innerHTML = `<span class="dow">${dow}</span><span class="day">${day}</span><span class="month">${month}</span>`;

    // Bắt sự kiện click
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".date-btn")
        .forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("date").value = dateString;

      loadShowtimes(); // Gọi API load suất chiếu khi đổi ngày
    });

    container.appendChild(btn);
  }

  // Gán value mặc định cho ô input ẩn là ngày hôm nay
  const fY = today.getFullYear();
  const fM = String(today.getMonth() + 1).padStart(2, "0");
  const fD = String(today.getDate()).padStart(2, "0");
  document.getElementById("date").value = `${fY}-${fM}-${fD}`;
}

// Icon outline trắng dùng chung cho khu vực feedback (đồng bộ với style icon
// của toàn bộ giao diện POS).
const FB_ICON_USER =
  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
const FB_ICON_SEND =
  '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>';

// Vẽ 5 ngôi sao đánh giá, tô màu cam theo số sao thực tế (ratingStars).
function renderFbStars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(rating || 0)));
  let html = "";
  for (let i = 1; i <= 5; i++) {
    const cls = i <= filled ? "filled" : "empty";
    html += `<svg class="${cls}" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  }
  return html;
}

// Escape text hiển thị để tránh vỡ layout khi nội dung khách chứa ký tự đặc biệt.
function escapeFbText(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// Hàm load danh sách phản hồi từ DB
// BO SUNG: nạp kèm danh sách phim (/api/movies) để gắn badge tên phim lên mỗi
// card phản hồi, giúp nhân viên biết ngay phản hồi đó thuộc phim nào.
async function loadFeedbacks() {
  const fbList = document.getElementById("feedbackList");

  try {
    const [feedbackData, movieData] = await Promise.all([
      fetchJson("/api/pos/feedbacks", {}, "Không thể tải phản hồi khách hàng"),
      fetchJson("/api/movies", {}, "Không thể tải danh sách phim").catch(
        () => [],
      ),
    ]);

    if (!Array.isArray(feedbackData)) {
      throw new Error(
        "Dữ liệu feedback từ máy chủ không phải là một danh sách.",
      );
    }

    const feedbacks = feedbackData;
    const movieList = Array.isArray(movieData) ? movieData : [];

    if (!fbList) return;
    fbList.innerHTML = "";

    // Map tra cứu tên phim theo movieId
    const movieMap = {};
    (movieList || []).forEach((m) => {
      movieMap[m.movieId || m.id] = m.title;
    });

    const parents = feedbacks.filter((fb) => !fb.title.includes("Phản hồi"));
    const replies = feedbacks.filter((fb) => fb.title.includes("Phản hồi"));

    if (parents.length === 0) {
      fbList.innerHTML = `<div class="fb-empty-state">Chưa có phản hồi nào từ khách hàng.</div>`;
      return;
    }

    parents.forEach((p) => {
      const myReplies = replies.filter((r) =>
        r.title.includes(`ID: ${p.feedbackId}`),
      );
      const movieName = movieMap[p.movieId] || null;
      const div = document.createElement("div");
      div.className = "fb-review-card";

      div.innerHTML = `
                <div class="fb-review-head">
                    <div class="fb-review-avatar">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FB_ICON_USER}</svg>
                    </div>
                    <div class="fb-review-headtext">
                        <b class="fb-review-name">Khách: ${escapeFbText(p.title)}</b>
                        <span class="fb-review-meta">Phản hồi khách hàng</span>
                    </div>
                    <div class="fb-review-stars">${renderFbStars(p.ratingStars || 5)}</div>
                </div>
                ${movieName ? `<div style="display: inline-block; background: rgba(255, 107, 53, 0.12); border: 1px solid rgba(255, 107, 53, 0.4); color: #ff6b35; font-size: 11.5px; font-weight: bold; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">PHIM: ${escapeFbText(movieName)}</div>` : ""}
                <p class="fb-review-content">${escapeFbText(p.content)}</p>
                ${
                  myReplies.length > 0
                    ? `
                <div class="fb-review-replies">
                    ${myReplies
                      .map(
                        (r) => `
                        <div class="fb-reply-bubble"><b>Nhân viên:</b> ${escapeFbText(r.content.replace("Phản hồi: ", ""))}</div>
                    `,
                      )
                      .join("")}
                </div>`
                    : ""
                }
                <button class="fb-respond-btn" onclick="openReplyModal(${p.feedbackId}, '${escapeFbText(p.title).replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FB_ICON_SEND}</svg>
                    Phản hồi
                </button>
            `;
      fbList.appendChild(div);
    });
  } catch (error) {
    console.error("LOAD FEEDBACK ERROR:", error);

    renderPosLoadError(
      fbList,
      error,
      "Không thể tải danh sách phản hồi từ máy chủ.",
    );
  }
}

// Hàm phản hồi riêng biệt
window.replySpecificFeedback = async function (feedbackId) {
  const content = document.getElementById(`reply-${feedbackId}`).value.trim();
  if (!content) {
    alert("Vui lòng nhập nội dung phản hồi!");
    return;
  }

  const loggedUser = getLoggedUser();
  try {
    const response = await fetch("/api/pos/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Phản hồi: " + content,
        title: "Phản hồi cho feedback ID: " + feedbackId,
        ratingStars: 5,
        accountStaffId: loggedUser ? loggedUser.accountId || 1 : 1,
      }),
    });

    if (response.ok) {
      alert("Đã gửi phản hồi thành công!");
      loadFeedbacks();
    } else {
      alert("Lỗi khi gửi phản hồi.");
    }
  } catch (error) {
    alert("Lỗi kết nối server.");
  }
};
// Mở popup
window.openReplyModal = function (feedbackId, customerName) {
  document.getElementById("modalFeedbackId").value = feedbackId;
  document.getElementById("replyTargetInfo").textContent =
    "Phản hồi cho: " + customerName;
  document.getElementById("modalReplyText").value = ""; // Xóa trắng ô nhập cũ
  document.getElementById("replyModal").style.display = "flex";
};

// Đóng popup
window.closeModal = function () {
  const modal = document.getElementById("replyModal");
  if (modal) {
    modal.style.display = "none";
  } else {
    console.warn("Không tìm thấy phần tử replyModal");
  }
};

// Gửi phản hồi từ popup
window.submitModalReply = async function () {
  const feedbackId = document.getElementById("modalFeedbackId").value;
  const content = document.getElementById("modalReplyText").value.trim();

  if (!content) {
    showToast(
      "Vui lòng nhập nội dung phản hồi!",
      false,
      "VUI LÒNG NHẬP PHẢN HỒI",
    );
    return;
  }

  try {
    // Gọi API (tương tự như hàm replySpecificFeedback cũ của bạn)
    const response = await fetch("/api/pos/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Phản hồi: " + content,
        title: "Phản hồi cho feedback ID: " + feedbackId,
        ratingStars: 5,
        accountStaffId: 1,
      }),
    });

    if (response.ok) {
      showToast("Đã gửi phản hồi thành công!", true);
      document.getElementById("modalReplyText").value = "";
      closeModal();
      loadFeedbacks(); // Load lại danh sách
    } else {
      alert("Có lỗi xảy ra khi gửi phản hồi.");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Không thể kết nối đến máy chủ.");
  }
};

// Popup thông báo góc màn hình (thay cho alert() ở một số chỗ) — theo bản
// chỉnh sửa của bạn cùng nhóm.
// Icon outline trắng đổi theo trạng thái: dấu tick tròn khi thành công,
// dấu chấm than tròn khi cảnh báo/lỗi.
const TOAST_ICON_CHECK =
  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
const TOAST_ICON_WARNING =
  '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';

let toastHideTimer = null;
window.showToast = function (message, isSuccess = false, title = null) {
  const toast = document.getElementById("toastNotification");
  const titleElement = document.getElementById("toastTitle");
  const messageElement = document.getElementById("toastMessage");
  const iconSvg = document.getElementById("toastIconSvg");
  if (!toast || !titleElement || !messageElement) return;

  titleElement.textContent = title || (isSuccess ? "THÀNH CÔNG" : "CẢNH BÁO");
  messageElement.textContent = message;
  if (iconSvg)
    iconSvg.innerHTML = isSuccess ? TOAST_ICON_CHECK : TOAST_ICON_WARNING;

  if (isSuccess) {
    toast.classList.add("success");
  } else {
    toast.classList.remove("success");
  }

  toast.style.display = "flex";
  // Popup tự ẩn sau 3s; nếu gọi liên tiếp thì reset lại giờ đếm thay vì
  // để timer cũ tắt sớm popup mới.
  if (toastHideTimer) clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
};
