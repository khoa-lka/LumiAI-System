/* =========================================================================
   MANAGER - TAB "SỰ KIỆN VÀ CHIẾN DỊCH VOUCHER"
   Đồng bộ 100% với Database thực tế qua Spring Boot API
   Mối liên kết: [promotion] -> voucher_id -> [voucher]
   ========================================================================= */

let _mgEventsData = []; // Dữ liệu thật bốc từ SQL Server về qua API
let _mgEventsFiltered = [];
let _mgEventDeleteTargetId = null;

/* --- Tiện ích định dạng hiển thị --- */
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

/* --- 1. Nạp danh sách từ Spring Boot và Render lên bảng --- */
function loadManagerEvents() {
  const tbody = document.getElementById("mp-event-tbody");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px;">Đang quét danh sách chiến dịch sự kiện...</td></tr>';

  // Gọi API Manager lấy toàn bộ danh sách không bộ lọc
  fetch("http://localhost:8080/api/promos/manager/all")
    .then(res => {
      if (!res.ok) throw new Error("Không thể kết nối API danh mục Sự kiện");
      return res.json();
    })
    .then(data => {
      _mgEventsData = data;
      _mgEventsFiltered = data.slice();
      renderManagerEventsTable(_mgEventsFiltered);
    })
    .catch(err => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:15px;">Lỗi kết nối API: ${err.message}</td></tr>`;
    });
}
window.loadManagerEvents = loadManagerEvents;

function renderManagerEventsTable(list) {
  const tbody = document.getElementById("mp-event-tbody");
  if (!tbody) return;

  if (!list || !list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#888;">Không tìm thấy chiến dịch sự kiện nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((ev, idx) => {
      // Bốc mã VoucherCode lồng bên trong đối tượng Voucher ra hiển thị
      let attachedVoucherCode = (ev.voucher && ev.voucher.voucherCode) 
        ? `<span class="mp-badge-code" style="background:#e8f5e9; color:#2e7d32; font-weight:bold; padding:4px 8px; border-radius:4px;">${ev.voucher.voucherCode}</span>`
        : `<span style="color:#777; font-size:12px; font-style:italic;">Không kèm mã</span>`;

      return `
      <tr>
        <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
        <td>
          <div style="width: 50px; height: 35px; background: rgba(255, 107, 53, 0.1); border: 1px solid rgba(255, 107, 53, 0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 0 auto; cursor: pointer;" 
              onclick="openViewEventModal(${ev.id})" 
              title="Bấm để xem chi tiết">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        </td>
        <td>
          <strong style="color:#f4f4f5; cursor:pointer;" onclick="openViewEventModal(${ev.id})">${ev.title}</strong>
        </td>
        <td>${attachedVoucherCode}</td>
        <td>${mgFormatDateVN(ev.startDate)} - ${mgFormatDateVN(ev.endDate)}</td>
        <td style="text-align:center;">
          <span class="mp-status ${mgEventStatusClass(ev.status)}">${mgEventStatusLabel(ev.status)}</span>
        </td>
        <td style="text-align:center;">
          <div class="mp-table-actions">
            <button class="mp-action-btn" title="Xem chi tiết" onclick="openViewEventModal(${ev.id})">
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

/* --- 2. Bộ lọc tìm kiếm Client-side mượt mà --- */
function filterManagerEvents() {
  const kw = (document.getElementById("mp-event-search-input").value || "").trim().toLowerCase();
  const status = document.getElementById("mp-event-filter-status").value;

  _mgEventsFiltered = _mgEventsData.filter((ev) => {
    const vCode = (ev.voucher && ev.voucher.voucherCode) ? ev.voucher.voucherCode.toLowerCase() : "";
    const matchKw = !kw || ev.title.toLowerCase().includes(kw) || vCode.includes(kw);
    const matchStatus = status === "all" || ev.status === status;
    return matchKw && matchStatus;
  });
  renderManagerEventsTable(_mgEventsFiltered);
}
window.filterManagerEvents = filterManagerEvents;

/* --- 3. Điều khiển mở form Thêm / Sửa dữ liệu --- */
function openAddEventModal() {
  document.getElementById("event-modal-title").innerText = "Tạo Chiến Dịch Mới";
  document.getElementById("event-item-id").value = "";
  document.getElementById("event-title").value = "";
  
  // Nạp lại danh sách voucher thật vào dropdown trước khi mở form[cite: 16]
  if (typeof window.loadVouchersToSelectDropdown === "function") {
    window.loadVouchersToSelectDropdown();
  }
  document.getElementById("event-voucher-select").value = "";
  
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

  document.getElementById("event-modal-title").innerText = "Chỉnh Sửa Chiến Dịch";
  document.getElementById("event-item-id").value = ev.id;
  document.getElementById("event-title").value = ev.title;
  
  // Nạp lại danh sách voucher và map trúng ID đang liên kết[cite: 16]
  if (typeof window.loadVouchersToSelectDropdown === "function") {
    window.loadVouchersToSelectDropdown();
  }
  document.getElementById("event-voucher-select").value = (ev.voucher && ev.voucher.voucherId) ? ev.voucher.voucherId : "";

  document.getElementById("event-date-start").value = ev.startDate || "";
  document.getElementById("event-date-end").value = ev.endDate || "";
  document.getElementById("event-image-url").value = ev.imageUrl || "";
  document.getElementById("event-content").value = ev.content || "";
  document.getElementById("event-status").value = ev.status || "ACTIVE";
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

/* --- 4. Đẩy chuỗi dữ liệu kép liên kết lên Spring Boot --- */
function submitEventForm() {
  const idVal = document.getElementById("event-item-id").value;
  const title = document.getElementById("event-title").value.trim();
  const voucherId = document.getElementById("event-voucher-select").value; // Lấy ID của voucher được chọn từ dropdown[cite: 16]
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
    alert("Ngày kết thúc chương trình phải sau ngày bắt đầu.");
    return;
  }

  // Đóng gói JSON payload ăn khớp CamelCase chuẩn Entity Java
  const payload = {
    title: title,
    startDate: startDate,
    endDate: endDate,
    imageUrl: imageUrl,
    content: content,
    status: status
  };

  // Thiết lập đường link cổng API động dựa trên hình thức Thêm mới hoặc Sửa đổi
  let url = "http://localhost:8080/api/promos/manager/add";
  let method = "POST";

  if (idVal) {
    url = `http://localhost:8080/api/promos/manager/update/${idVal}`;
    method = "PUT";
  }

  // Đính kèm tham số voucherId lên chuỗi query string parameters nếu có chọn mã
  if (voucherId) {
    url += `?voucherId=${voucherId}`;
  }

  fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("Server trả về lỗi khi lưu chiến dịch");
      return res.json();
    })
    .then(() => {
      alert(idVal ? " Cập nhật chiến dịch sự kiện thành công!" : " Đã tạo chiến dịch sự kiện truyền thông mới thành công!");
      closeEventModal();
      loadManagerEvents(); // Làm mới lại bảng
    })
    .catch(err => {
      alert("🚨 Thao tác thất bại: " + err.message);
    });
}
window.submitEventForm = submitEventForm;

/* --- 5. Luồng xử lý Xóa Chiến dịch ưu đãi --- */
function openDeleteEventModal(id) {
  const ev = _mgEventsData.find((e) => e.id === id);
  if (!ev) return;
  _mgEventDeleteTargetId = id;
  document.getElementById("event-delete-item-name").innerText = `Bạn có chắc chắn muốn gỡ bỏ hoàn toàn chiến dịch "${ev.title}" không?`;
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

  fetch(`http://localhost:8080/api/promos/manager/delete/${_mgEventDeleteTargetId}`, {
    method: "DELETE"
  })
    .then(res => {
      if (!res.ok) throw new Error("Không thể xóa chiến dịch trên server");
      closeDeleteEventModal();
      loadManagerEvents();
      alert(" Đã gỡ chiến dịch ưu đãi thành công!");
    })
    .catch(err => {
      alert("🚨 Lỗi gỡ dữ liệu: " + err.message);
      closeDeleteEventModal();
    });
}
window.confirmDeleteEvent = confirmDeleteEvent;

/* --- 6. Modal Xem trước chi tiết (Preview) --- */
function openViewEventModal(id) {
  const ev = _mgEventsData.find((e) => e.id === id);
  if (!ev) return;

  document.getElementById("ev-preview-image").src = ev.imageUrl || 'img/default-poster.jpg';
  document.getElementById("ev-preview-title").innerText = ev.title;
  document.getElementById("ev-preview-dates").innerText = `Áp dụng: ${mgFormatDateVN(ev.startDate)} - ${mgFormatDateVN(ev.endDate)}`;
  document.getElementById("ev-preview-content").innerText = ev.content;
  
  // Hiển thị mã code nếu chiến dịch có liên kết voucher đi kèm
  document.getElementById("ev-preview-code").innerText = (ev.voucher && ev.voucher.voucherCode) ? ev.voucher.voucherCode : "Không có";
  
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