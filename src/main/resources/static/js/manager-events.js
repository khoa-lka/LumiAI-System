/* =========================================================================
   MANAGER - TAB "SỰ KIỆN VÀ ƯU ĐÃI"
   Cấu trúc dữ liệu khớp với bảng [promotion] trong DB:
   title, start_date, end_date, image_url, content, promo_code, status
   Hiện đang dùng dữ liệu tĩnh (mock) để dựng giao diện; khi Back-end có
   API tương ứng (VD: GET/POST/PUT/DELETE /api/manager/promotions), chỉ cần
   thay các hàm loadManagerEvents()/submitEventForm()/confirmDeleteEvent()
   bằng lệnh gọi API thật, giữ nguyên toàn bộ phần render bên dưới.
   ========================================================================= */

let _mgEventsData = [
  {
    id: 1,
    title: "Đẹo Phone Chắc Tay - Nhận Quà Khủng Liền Tay",
    start_date: "2026-06-05",
    end_date: "2026-06-10",
    image_url: "img/case.jpg",
    content:
      "Chào mừng quý khách đến với ngày hội phụ kiện tại LAS Cinemas! Chỉ cần mang theo điện thoại có ốp lưng độc lạ đến quầy vé, quý khách sẽ nhận ngay ưu đãi hấp dẫn cùng cơ hội trúng quà tặng giá trị từ chương trình.",
    promo_code: "PHONE2026",
    status: "ACTIVE",
  },
  {
    id: 2,
    title: "Combo Bắp Nước Siêu Ưu Đãi Cuối Tuần",
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    image_url: "img/popcorn.png",
    content:
      "Mỗi cuối tuần, khách hàng mua combo bắp nước size L sẽ được giảm ngay 20% khi xuất trình mã ưu đãi tại quầy F&B. Áp dụng cho tất cả các suất chiếu trong ngày Thứ 7 và Chủ Nhật.",
    promo_code: "WEEKENDCOMBO",
    status: "ACTIVE",
  },
  {
    id: 3,
    title: "Ưu Đãi Thẻ Tín Dụng - Giảm 45K Mỗi Vé",
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    image_url: "img/creditcard.png",
    content:
      "Thanh toán vé xem phim bằng thẻ tín dụng liên kết, khách hàng được giảm ngay 45,000đ cho mỗi vé, áp dụng tối đa 4 vé/giao dịch/tài khoản trong suốt thời gian khuyến mãi.",
    promo_code: "CARD45K",
    status: "EXPIRED",
  },
  {
    id: 4,
    title: "Sự Kiện Ra Mắt Phim Mới - Tặng Poster Giới Hạn",
    start_date: "2026-07-15",
    end_date: "2026-07-20",
    image_url: "img/poster.jpg",
    content:
      "Nhân dịp ra mắt phim bom tấn mùa hè, 100 khách hàng đặt vé sớm nhất mỗi ngày sẽ nhận được poster phiên bản giới hạn kèm chữ ký đoàn làm phim.",
    promo_code: "PREMIERE26",
    status: "INACTIVE",
  },
];

let _mgEventsFiltered = _mgEventsData.slice();
let _mgEventDeleteTargetId = null;

/* --- Tiện ích --- */
function mgFormatDateVN(iso) {
  if (!iso) return "--";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function mgEventStatusLabel(status) {
  if (status === "ACTIVE") return "Đang diễn ra";
  if (status === "INACTIVE") return "Tạm ẩn";
  return "Đã kết thúc";
}
function mgEventStatusClass(status) {
  if (status === "ACTIVE") return "active";
  if (status === "INACTIVE") return "inactive";
  return "expired";
}

/* --- 1. Nạp & Render bảng danh sách --- */
function loadManagerEvents() {
  // TODO (Back-end thật): thay đoạn dưới bằng fetch("/api/manager/promotions")
  //   .then(res => res.json()).then(data => { _mgEventsData = data; renderManagerEventsTable(_mgEventsData); });
  renderManagerEventsTable(_mgEventsData);
}
window.loadManagerEvents = loadManagerEvents;

function renderManagerEventsTable(list) {
  const tbody = document.getElementById("mp-event-tbody");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#888;">Không tìm thấy sự kiện phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((ev, idx) => {
      return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>
          <img src="${ev.image_url}" alt="${ev.title}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; cursor:pointer;" onclick="openViewEventModal(${ev.id})" onerror="this.style.opacity=0.3;" />
        </td>
        <td>
          <strong style="color:#f4f4f5; cursor:pointer;" onclick="openViewEventModal(${ev.id})">${ev.title}</strong>
        </td>
        <td><span style="font-family:monospace; letter-spacing:0.5px; color:var(--cgv-red, #ff6b35); font-weight:700;">${ev.promo_code}</span></td>
        <td>${mgFormatDateVN(ev.start_date)} - ${mgFormatDateVN(ev.end_date)}</td>
        <td style="text-align:center;">
          <span class="mp-status ${mgEventStatusClass(ev.status)}">${mgEventStatusLabel(ev.status)}</span>
        </td>
        <td style="text-align:center;">
          <div class="mp-table-actions">
            <button class="mp-action-btn" title="Xem trước" onclick="openViewEventModal(${ev.id})">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="mp-action-btn" title="Sửa" onclick="openEditEventModal(${ev.id})">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="mp-action-btn" title="Xóa" onclick="openDeleteEventModal(${ev.id})">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

/* --- 2. Lọc theo từ khóa + trạng thái --- */
function filterManagerEvents() {
  const kw = (document.getElementById("mp-event-search-input").value || "").trim().toLowerCase();
  const status = document.getElementById("mp-event-filter-status").value;

  _mgEventsFiltered = _mgEventsData.filter((ev) => {
    const matchKw = !kw || ev.title.toLowerCase().includes(kw) || ev.promo_code.toLowerCase().includes(kw);
    const matchStatus = status === "all" || ev.status === status;
    return matchKw && matchStatus;
  });
  renderManagerEventsTable(_mgEventsFiltered);
}
window.filterManagerEvents = filterManagerEvents;

/* --- 3. Modal Thêm / Sửa --- */
function openAddEventModal() {
  document.getElementById("event-modal-title").innerText = "Tạo Sự Kiện Mới";
  document.getElementById("event-item-id").value = "";
  document.getElementById("event-title").value = "";
  document.getElementById("event-promo-code").value = "";
  document.getElementById("event-date-start").value = "";
  document.getElementById("event-date-end").value = "";
  document.getElementById("event-image-url").value = "";
  document.getElementById("event-content").value = "";
  document.getElementById("event-status").value = "ACTIVE";
  updateEventImagePreview();
  document.getElementById("mp-create-event-modal").classList.add("open");
}
window.openAddEventModal = openAddEventModal;

function openEditEventModal(id) {
  const ev = _mgEventsData.find((e) => e.id === id);
  if (!ev) return;
  document.getElementById("event-modal-title").innerText = "Chỉnh Sửa Sự Kiện";
  document.getElementById("event-item-id").value = ev.id;
  document.getElementById("event-title").value = ev.title;
  document.getElementById("event-promo-code").value = ev.promo_code;
  document.getElementById("event-date-start").value = ev.start_date;
  document.getElementById("event-date-end").value = ev.end_date;
  document.getElementById("event-image-url").value = ev.image_url;
  document.getElementById("event-content").value = ev.content;
  document.getElementById("event-status").value = ev.status;
  updateEventImagePreview();
  document.getElementById("mp-create-event-modal").classList.add("open");
}
window.openEditEventModal = openEditEventModal;

function closeEventModal() {
  document.getElementById("mp-create-event-modal").classList.remove("open");
}
window.closeEventModal = closeEventModal;

function updateEventImagePreview() {
  const url = document.getElementById("event-image-url").value.trim();
  const img = document.getElementById("event-image-preview");
  if (url) {
    img.src = url;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }
}
window.updateEventImagePreview = updateEventImagePreview;

function submitEventForm() {
  const idVal = document.getElementById("event-item-id").value;
  const title = document.getElementById("event-title").value.trim();
  const promoCode = document.getElementById("event-promo-code").value.trim().toUpperCase();
  const startDate = document.getElementById("event-date-start").value;
  const endDate = document.getElementById("event-date-end").value;
  const imageUrl = document.getElementById("event-image-url").value.trim();
  const content = document.getElementById("event-content").value.trim();
  const status = document.getElementById("event-status").value;

  if (!title || !startDate || !endDate) {
    alert("Vui lòng nhập đầy đủ Tiêu đề, Ngày bắt đầu và Ngày kết thúc.");
    return;
  }
  if (new Date(endDate) < new Date(startDate)) {
    alert("Ngày kết thúc phải sau ngày bắt đầu.");
    return;
  }

  const payload = { title, start_date: startDate, end_date: endDate, image_url: imageUrl, content, promo_code: promoCode, status };

  // TODO (Back-end thật): thay đoạn dưới bằng fetch PUT/POST tới /api/manager/promotions
  if (idVal) {
    const idx = _mgEventsData.findIndex((e) => e.id === Number(idVal));
    if (idx !== -1) _mgEventsData[idx] = { ..._mgEventsData[idx], ...payload };
  } else {
    const newId = _mgEventsData.length ? Math.max(..._mgEventsData.map((e) => e.id)) + 1 : 1;
    _mgEventsData.push({ id: newId, ...payload });
  }

  closeEventModal();
  filterManagerEvents();
}
window.submitEventForm = submitEventForm;

/* --- 4. Modal Xóa --- */
function openDeleteEventModal(id) {
  const ev = _mgEventsData.find((e) => e.id === id);
  if (!ev) return;
  _mgEventDeleteTargetId = id;
  document.getElementById("event-delete-item-name").innerText = `Bạn có chắc chắn muốn xóa sự kiện "${ev.title}" không?`;
  document.getElementById("mp-event-delete-modal").classList.add("open");
}
window.openDeleteEventModal = openDeleteEventModal;

function closeDeleteEventModal() {
  document.getElementById("mp-event-delete-modal").classList.remove("open");
  _mgEventDeleteTargetId = null;
}
window.closeDeleteEventModal = closeDeleteEventModal;

function confirmDeleteEvent() {
  if (_mgEventDeleteTargetId == null) return;
  // TODO (Back-end thật): thay đoạn dưới bằng fetch DELETE tới /api/manager/promotions/{id}
  _mgEventsData = _mgEventsData.filter((e) => e.id !== _mgEventDeleteTargetId);
  closeDeleteEventModal();
  filterManagerEvents();
}
window.confirmDeleteEvent = confirmDeleteEvent;

/* --- 5. Modal Xem trước (Preview) --- */
function openViewEventModal(id) {
  const ev = _mgEventsData.find((e) => e.id === id);
  if (!ev) return;
  document.getElementById("ev-preview-image").src = ev.image_url;
  document.getElementById("ev-preview-title").innerText = ev.title;
  document.getElementById("ev-preview-dates").innerText = `Áp dụng: ${mgFormatDateVN(ev.start_date)} - ${mgFormatDateVN(ev.end_date)}`;
  document.getElementById("ev-preview-content").innerText = ev.content;
  document.getElementById("ev-preview-code").innerText = ev.promo_code;
  const statusEl = document.getElementById("ev-preview-status");
  statusEl.innerText = mgEventStatusLabel(ev.status);
  statusEl.className = "mp-status " + mgEventStatusClass(ev.status);
  document.getElementById("mp-view-event-modal").classList.add("open");
}
window.openViewEventModal = openViewEventModal;

function closeViewEventModal() {
  document.getElementById("mp-view-event-modal").classList.remove("open");
}
window.closeViewEventModal = closeViewEventModal;