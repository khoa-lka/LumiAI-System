const BASE_URL = "http://localhost:8080/api";

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Lỗi không xác định" }));
    throw new Error(errorData.message || `Lỗi API: ${res.status}`);
  }
  return res.json();
};

const API = {
  // 1. AUTH & PROFILE
  login: (credentials) =>
    fetch(`${BASE_URL}/login/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  register: (userData) =>
    fetch(`${BASE_URL}/register/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    }).then(handleResponse),

  verifyOtp: (otpData) =>
    fetch(`${BASE_URL}/register/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otpData),
    }).then(handleResponse),

  updateProfile: (profileData) =>
    fetch(`${BASE_URL}/profile/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    }).then(handleResponse),

  getProfile: (accountId) =>
    fetch(`${BASE_URL}/profile/${accountId}`).then(handleResponse),

  // 2. MOVIES
  getMovies: () => fetch(`${BASE_URL}/movies`).then(handleResponse),

  addMovie: (movieData) =>
    fetch(`${BASE_URL}/movies/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movieData),
    }).then(handleResponse),

  updateMovie: (movieData) =>
    fetch(`${BASE_URL}/movies/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movieData),
    }).then(handleResponse),

  deleteMovie: (movieId) =>
    fetch(`${BASE_URL}/movies/delete/${movieId}`, {
      method: "DELETE",
    }).then(handleResponse),

  // 3. EVENTS & BANNERS
  getEvents: () => fetch(`${BASE_URL}/events`).then(handleResponse),

  getBanners: () => fetch(`${BASE_URL}/banners`).then(handleResponse),

  // 4. BOOKING
  getShowtimes: (movieId, date) =>
    fetch(
      `${BASE_URL}/showtimes/matrix?movieId=${encodeURIComponent(
        movieId,
      )}&date=${encodeURIComponent(date)}`,
    ).then(handleResponse),

  getSeatsByShowtime: (showtimeId) =>
    fetch(
      `${BASE_URL}/seats/matrix?showtimeId=${encodeURIComponent(showtimeId)}`,
    ).then(handleResponse),

  checkoutTickets: (checkoutData) =>
    fetch(`${BASE_URL}/seats/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutData),
    }).then(handleResponse),

  cancelBooking: (cancelData) =>
    fetch(`${BASE_URL}/seats/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cancelData),
    }).then(handleResponse),

  addShowtime: (showtimeData) =>
    fetch(`${BASE_URL}/showtimes/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showtimeData),
    }).then(handleResponse),

  // 5. PAYMENT QR / PAYOS
  createQrPayment: (amount) =>
    fetch(
      `${BASE_URL}/payment/qr/create?amount=${encodeURIComponent(amount)}`,
    ).then(handleResponse),

  getQrPaymentStatus: (qrRef) =>
    fetch(`${BASE_URL}/payment/qr/status/${encodeURIComponent(qrRef)}`).then(
      handleResponse,
    ),

  cancelQrPayment: (qrRef) =>
    fetch(`${BASE_URL}/payment/qr/cancel/${encodeURIComponent(qrRef)}`, {
      method: "POST",
    }).then(handleResponse),

  createPayOSPayment: (amount) =>
    fetch(`${BASE_URL}/payment/payos/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).then(handleResponse),

  // 6. ADMIN / MANAGER
  getAdminUsers: () => fetch(`${BASE_URL}/admin/users`).then(handleResponse),

  getSysLogs: () => fetch(`${BASE_URL}/admin/syslogs`).then(handleResponse),

  getFaqs: () => fetch(`${BASE_URL}/admin/faqs`).then(handleResponse),

  getWebhooks: () => fetch(`${BASE_URL}/admin/webhooks`).then(handleResponse),

  getDbBackups: () => fetch(`${BASE_URL}/admin/backups`).then(handleResponse),

  banUser: (userId) =>
    fetch(`${BASE_URL}/admin/users/ban/${encodeURIComponent(userId)}`, {
      method: "PUT",
    }).then(handleResponse),

  getOrderHistory: (accountId) =>
    fetch(`${BASE_URL}/orders/history/${encodeURIComponent(accountId)}`).then(
      handleResponse,
    ),

  // 7. VOUCHER
  // Giữ endpoint đúng của booking 15: /vouchers/{code}
  checkVoucher: (code) =>
    fetch(`${BASE_URL}/vouchers/${encodeURIComponent(code)}`).then(
      handleResponse,
    ),

  getManagerVouchers: () =>
    fetch(`${BASE_URL}/vouchers/manager/all`).then(handleResponse),

  addVoucher: (voucherData) =>
    fetch(`${BASE_URL}/vouchers/manager/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voucherData),
    }).then(handleResponse),

  updateVoucher: (id, voucherData) =>
    fetch(`${BASE_URL}/vouchers/manager/update/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voucherData),
    }).then(handleResponse),

  deleteVoucher: (id) =>
    fetch(`${BASE_URL}/vouchers/manager/delete/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        return handleResponse(res);
      }
      return true;
    }),

  // 8. F&B
  getFnbItems: () => fetch(`${BASE_URL}/fnb`).then(handleResponse),

  addFnbItem: (data) =>
    fetch(`${BASE_URL}/fnb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateFnbItem: (id, data) =>
    fetch(`${BASE_URL}/fnb/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteFnbItem: (id) =>
    fetch(`${BASE_URL}/fnb/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        return handleResponse(res);
      }
      return true;
    }),

  // 9. DASHBOARD
  getManagerDashboard: () =>
    fetch(`${BASE_URL}/manager/dashboard`).then(handleResponse),

  getDashboardOverviewData: () =>
    fetch(`${BASE_URL}/dashboard/overview`).then(handleResponse),

  // 10. AUDIT
  getAuditReportData: (dateStr) =>
    fetch(`${BASE_URL}/audit/report?date=${encodeURIComponent(dateStr)}`).then(
      handleResponse,
    ),
};

// Đưa API ra window để các file JS khác như booking.js sử dụng ổn định.
window.API = API;