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

  // 🚀 ĐÃ SỬA: Khớp chuẩn xác Path Variable dạng /delete/{id} với MovieController.java của bạn
  deleteMovie: (movieId) =>
    fetch(`${BASE_URL}/movies/delete/${movieId}`, { method: "DELETE" }).then(
      handleResponse,
    ),

  // 3. EVENTS & BANNERS
  getEvents: () => fetch(`${BASE_URL}/events`).then(handleResponse),
  getBanners: () => fetch(`${BASE_URL}/banners`).then(handleResponse),

  // 4. BOOKING
  getShowtimes: (movieId, date) =>
    fetch(`${BASE_URL}/showtimes/matrix?movieId=${movieId}&date=${date}`).then(
      handleResponse,
    ),

  // 🚀 ĐÃ THÊM: Gọi API lấy trạng thái danh sách ghế thực tế của suất chiếu
  getSeatsByShowtime: (showtimeId) =>
    fetch(`${BASE_URL}/seats/matrix?showtimeId=${showtimeId}`).then(
      handleResponse,
    ),

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
    // 🚀 THÊM MỚI: Gọi API gửi yêu cầu tạo suất chiếu xuống Spring Boot
  addShowtime: (showtimeData) =>
    fetch(`${BASE_URL}/showtimes/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showtimeData),
    }).then(handleResponse),

  // 5. ADMIN/MANAGER
  getAdminUsers: () => fetch(`${BASE_URL}/admin/users`).then(handleResponse),
  getSysLogs: () => fetch(`${BASE_URL}/admin/syslogs`).then(handleResponse),
  getFaqs: () => fetch(`${BASE_URL}/admin/faqs`).then(handleResponse),
  getWebhooks: () => fetch(`${BASE_URL}/admin/webhooks`).then(handleResponse),
  getDbBackups: () => fetch(`${BASE_URL}/admin/backups`).then(handleResponse),
  banUser: (userId) =>
    fetch(`${BASE_URL}/admin/users/ban/${userId}`, { method: "PUT" }).then(
      handleResponse,
    ),
  // Voucher
  checkVoucher: (code) =>
    fetch(`${BASE_URL}/voucher/${code}`).then(handleResponse),

  // 🍿 Kho F&B
  // Manager Dashboard analytics (TỔNG HỢP) — backend cần trả về JSON theo spec.
  getManagerDashboard: () =>
    fetch(`${BASE_URL}/manager/dashboard`).then(handleResponse),

  getFnbItems: () => fetch(`${BASE_URL}/fnb`).then(handleResponse),
  addFnbItem: (data) => fetch(`${BASE_URL}/fnb`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateFnbItem: (id, data) => fetch(`${BASE_URL}/fnb/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteFnbItem: (id) => fetch(`${BASE_URL}/fnb/${id}`, { method: "DELETE" }).then(res => res.ok ? true : Promise.reject(res))
};