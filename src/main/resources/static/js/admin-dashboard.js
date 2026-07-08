/* =========================================================================
   ADMIN DASHBOARD — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu trong file này là dữ liệu tĩnh dùng để hiển thị
   demo giao diện Dashboard, phỏng theo mẫu tham khảo (LumiAI).
   Khi Back-end có API thống kê thật, chỉ cần thay các hằng số AD_* bên dưới
   bằng dữ liệu fetch() từ server.
   ========================================================================= */

/* --- 1. BỘ DỮ LIỆU TĨNH --- */

const AD_METRICS = [
  { icon: "👥", bg: "rgba(99,102,241,0.16)", fg: "#818cf8", label: "Tổng người dùng", value: "1.248", delta: "+12.5%", sub: "so với tuần trước" },
  { icon: "📈", bg: "rgba(20,184,166,0.16)", fg: "#2dd4bf", label: "Tài khoản mới", value: "142", delta: "+15.3%", sub: "so với tuần trước" },
  { icon: "🔒", bg: "rgba(239,68,68,0.16)", fg: "#f87171", label: "Tài khoản bị khóa", value: "27", delta: "+3.1%", sub: "so với tuần trước" },
  { icon: "📄", bg: "rgba(59,130,246,0.16)", fg: "#60a5fa", label: "Logs hệ thống", value: "8.652", delta: "+18.7%", sub: "so với tuần trước" },
  { icon: "🔗", bg: "rgba(168,85,247,0.16)", fg: "#c084fc", label: "Webhook Logs", value: "1.024", delta: "+9.4%", sub: "so với tuần trước" },
  { icon: "🛡️", bg: "rgba(20,184,166,0.16)", fg: "#2dd4bf", label: "Backup thành công", value: "7", delta: "100%", sub: "so với tuần trước" },
];

// Biểu đồ tổng quan 7 ngày: Người dùng / Tài khoản mới / Tài khoản bị khóa
const AD_TREND_7D = [
  { label: "10/05", users: 1180, newAcc: 300, banned: 300 },
  { label: "11/05", users: 1350, newAcc: 330, banned: 305 },
  { label: "12/05", users: 1520, newAcc: 480, banned: 310 },
  { label: "13/05", users: 1420, newAcc: 470, banned: 315 },
  { label: "14/05", users: 1600, newAcc: 500, banned: 320 },
  { label: "15/05", users: 1650, newAcc: 780, banned: 322 },
  { label: "16/05", users: 1700, newAcc: 790, banned: 325 },
];

// Phân bố vai trò người dùng
const AD_ROLES = [
  { label: "Admin", pct: 8.7, count: 109, color: "#60a5fa" },
  { label: "Editor", pct: 21.6, count: 269, color: "#4ade80" },
  { label: "User", pct: 64.1, count: 800, color: "#a78bfa" },
  { label: "Viewer", pct: 5.6, count: 70, color: "#f59e0b" },
];

// Hoạt động theo ngày: Logs hệ thống & Webhook Logs
const AD_ACTIVITY_7D = [
  { label: "10/05", logs: 1120, webhook: 760 },
  { label: "11/05", logs: 1080, webhook: 810 },
  { label: "12/05", logs: 1300, webhook: 790 },
  { label: "13/05", logs: 1280, webhook: 800 },
  { label: "14/05", logs: 1050, webhook: 720 },
  { label: "15/05", logs: 1180, webhook: 760 },
  { label: "16/05", logs: 1250, webhook: 640 },
];

const AD_SYSTEM_STATUS = [
  { icon: "🗄️", label: "API Server", ok: true },
  { icon: "📄", label: "Database", ok: true },
  { icon: "📦", label: "Storage", ok: true },
  { icon: "🛡️", label: "Backup Service", ok: true },
];

const AD_LATEST_BACKUP = { time: "16/05/2026 02:30:15", type: "Toàn bộ hệ thống", size: "2.45 GB", ok: true };

const AD_WEBHOOK_SUMMARY = { total: 1024, success: 892, fail: 132 };

const AD_LOGS_SUMMARY = { total: 8652, info: 6125, warn: 1842, error: 685 };

const AD_ROLE_BADGE_CLASS = { Admin: "ad-role-admin", Editor: "ad-role-editor", User: "ad-role-user", Viewer: "ad-role-viewer" };

const AD_NEW_ACCOUNTS = [
  { name: "nguyenvana", email: "nguyenvana@example.com", role: "User", time: "16/05/2026 14:32", active: true },
  { name: "tranthib", email: "tranthib@example.com", role: "Editor", time: "16/05/2026 14:18", active: true },
  { name: "leminhc", email: "leminhc@example.com", role: "User", time: "16/05/2026 14:05", active: true },
  { name: "phamduyd", email: "phamduyd@example.com", role: "User", time: "16/05/2026 13:47", active: true },
  { name: "hoanganh", email: "hoanganh@example.com", role: "Viewer", time: "16/05/2026 13:21", active: true },
];

const AD_ACTIVITY_LOG = [
  { icon: "🔑", color: "#4ade80", type: "Đăng nhập", content: "Đăng nhập thành công", time: "16/05/2026 14:32:21", user: "nguyenvana", ip: "192.168.1.10" },
  { icon: "➕", color: "#60a5fa", type: "Tạo tài khoản", content: "Tạo tài khoản mới", time: "16/05/2026 14:18:09", user: "tranthib", ip: "192.168.1.11" },
  { icon: "✏️", color: "#f59e0b", type: "Cập nhật", content: "Cập nhật thông tin người dùng", time: "16/05/2026 14:05:33", user: "leminhc", ip: "192.168.1.12" },
  { icon: "🚪", color: "#c084fc", type: "Đăng xuất", content: "Đăng xuất", time: "16/05/2026 13:59:12", user: "phamduyd", ip: "192.168.1.13" },
  { icon: "🔁", color: "#f87171", type: "Thay đổi vai trò", content: "Thay đổi vai trò người dùng", time: "16/05/2026 13:47:08", user: "hoanganh", ip: "192.168.1.14" },
];

/* --- 2. HÀM TIỆN ÍCH --- */

function adFormatNum(n) {
  return n.toLocaleString("vi-VN");
}

/* --- 3. RENDER: 6 KPI CARDS --- */

function renderAdMetrics() {
  const host = document.getElementById("ad-metrics");
  if (!host) return;
  host.innerHTML = AD_METRICS.map(
    (m) => `
    <div class="ad-metric-card">
      <div class="ad-metric-top">
        <div class="ad-metric-icon" style="background:${m.bg}; color:${m.fg};">${m.icon}</div>
      </div>
      <div class="ad-metric-label">${m.label}</div>
      <div class="ad-metric-value">${m.value}</div>
      <div class="ad-metric-delta"><span class="ad-badge-up">↑ ${m.delta}</span> ${m.sub}</div>
    </div>`
  ).join("");
}

/* --- 4. RENDER: BIỂU ĐỒ TỔNG QUAN (SVG LINE CHART, 3 ĐƯỜNG) --- */

function renderAdTrendChart() {
  const host = document.getElementById("ad-trend-chart");
  if (!host) return;
  const data = AD_TREND_7D;

  const W = 640, H = 230, padL = 10, padR = 10, padT = 15, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxVal = Math.max(...data.map((d) => Math.max(d.users, d.newAcc, d.banned))) * 1.15;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const xAt = (i) => padL + stepX * i;
  const yAt = (v) => padT + innerH - (v / maxVal) * innerH;

  const toPath = (key) =>
    data.map((d, i) => (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + "," + yAt(d[key]).toFixed(1)).join(" ");

  const usersLine = toPath("users");
  const newAccLine = toPath("newAcc");
  const bannedLine = toPath("banned");
  const usersArea = usersLine + ` L${xAt(data.length - 1).toFixed(1)},${padT + innerH} L${padL},${padT + innerH} Z`;

  let gridLines = "";
  for (let i = 0; i <= 3; i++) {
    const y = padT + (innerH / 3) * i;
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" class="ad-grid"></line>`;
  }

  const axisLabels = data
    .map((d, i) => `<text x="${xAt(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ad-axis">${d.label}</text>`)
    .join("");

  const dotsFor = (key, color, r) =>
    data.map((d, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(d[key]).toFixed(1)}" r="${r}" fill="${color}"><title>${d.label}: ${adFormatNum(d[key])}</title></circle>`).join("");

  host.innerHTML = `
    <div style="display:flex; gap:16px; margin-bottom:6px; font-size:11px; color:#9a9aa3;">
      <span style="display:flex;align-items:center;gap:6px;"><i class="ad-dot" style="background:#60a5fa;"></i> Người dùng</span>
      <span style="display:flex;align-items:center;gap:6px;"><i class="ad-dot" style="background:#4ade80;"></i> Tài khoản mới</span>
      <span style="display:flex;align-items:center;gap:6px;"><i class="ad-dot" style="background:#f87171;"></i> Tài khoản bị khóa</span>
    </div>
    <svg class="ad-svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="adUsersFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.30"></stop>
          <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${usersArea}" fill="url(#adUsersFill)" stroke="none"></path>
      <path d="${usersLine}" fill="none" stroke="#60a5fa" stroke-width="2.5"></path>
      <path d="${newAccLine}" fill="none" stroke="#4ade80" stroke-width="2"></path>
      <path d="${bannedLine}" fill="none" stroke="#f87171" stroke-width="2"></path>
      ${dotsFor("users", "#60a5fa", 4)}
      ${dotsFor("newAcc", "#4ade80", 3.5)}
      ${dotsFor("banned", "#f87171", 3.5)}
      ${axisLabels}
    </svg>`;
}

/* --- 5. RENDER: DONUT PHÂN BỐ VAI TRÒ --- */

function renderAdRoleDonut() {
  const host = document.getElementById("ad-role-chart");
  const legendHost = document.getElementById("ad-role-legend");
  const totalHost = document.getElementById("ad-role-total");
  if (!host || !legendHost) return;

  const size = 160, cx = 80, cy = 80, r = 58, strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;
  const totalCount = AD_ROLES.reduce((s, g) => s + g.count, 0);

  const segments = AD_ROLES.map((g) => {
    const segLen = (g.pct / 100) * circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${g.color}" stroke-width="${strokeW}"
        stroke-dasharray="${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}"
        stroke-dashoffset="${(-offsetAcc).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
        <title>${g.label}: ${g.pct}%</title>
      </circle>`;
    offsetAcc += segLen;
    return seg;
  }).join("");

  host.innerHTML = `
    <svg class="ad-donut-svg" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"></circle>
      ${segments}
    </svg>`;

  if (totalHost) totalHost.innerHTML = `<span>Tổng</span><b>${adFormatNum(totalCount)}</b>`;

  legendHost.innerHTML = AD_ROLES.map(
    (g) => `
    <div class="ad-legend-row">
      <span class="ad-legend-left"><i class="ad-dot" style="background:${g.color};"></i>${g.label}</span>
      <b>${g.pct}% <span class="ad-legend-count">(${adFormatNum(g.count)})</span></b>
    </div>`
  ).join("");
}

/* --- 6. RENDER: BAR CHART HOẠT ĐỘNG THEO NGÀY (GROUPED, 2 SERIES) --- */

function renderAdActivityBars() {
  const host = document.getElementById("ad-activity-bars");
  if (!host) return;
  const maxVal = Math.max(...AD_ACTIVITY_7D.map((d) => Math.max(d.logs, d.webhook)));

  host.innerHTML = `
    <div class="ad-bars">
      ${AD_ACTIVITY_7D.map((d) => {
        const logsPct = Math.max(4, Math.round((d.logs / maxVal) * 100));
        const webhookPct = Math.max(4, Math.round((d.webhook / maxVal) * 100));
        return `
        <div class="ad-bar-col">
          <div class="ad-bar-wrap">
            <div class="ad-bar-fill ad-bar-logs" style="height:${logsPct}%;" title="Logs hệ thống - ${d.label}: ${adFormatNum(d.logs)}"></div>
            <div class="ad-bar-fill ad-bar-webhook" style="height:${webhookPct}%;" title="Webhook Logs - ${d.label}: ${adFormatNum(d.webhook)}"></div>
          </div>
          <span class="ad-bar-x">${d.label}</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* --- 7. RENDER: 4 Ô TỔNG QUAN TRẠNG THÁI --- */

function renderAdSystemStatus() {
  const host = document.getElementById("ad-system-status");
  if (!host) return;
  host.innerHTML = AD_SYSTEM_STATUS.map(
    (s) => `
    <div class="ad-status-row">
      <span class="ad-status-left"><i class="ad-status-icon">${s.icon}</i>${s.label}</span>
      <span class="ad-pill ${s.ok ? "ad-pill-green" : "ad-pill-red"}">${s.ok ? "Hoạt động" : "Lỗi"}</span>
    </div>`
  ).join("");
}

function renderAdBackupBox() {
  const host = document.getElementById("ad-backup-box");
  if (!host) return;
  const b = AD_LATEST_BACKUP;
  host.innerHTML = `
    <div class="ad-kv-row"><i class="ad-kv-icon">🕐</i><span class="ad-kv-label">Thời gian</span><span class="ad-kv-val">${b.time}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon">📁</i><span class="ad-kv-label">Loại</span><span class="ad-kv-val">${b.type}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon">💾</i><span class="ad-kv-label">Dung lượng</span><span class="ad-kv-val">${b.size}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon">✅</i><span class="ad-kv-label">Trạng thái</span><span class="ad-kv-val ad-kv-ok">✓ Thành công</span></div>`;
}

function renderAdWebhookBox() {
  const host = document.getElementById("ad-webhook-box");
  if (!host) return;
  const w = AD_WEBHOOK_SUMMARY;
  const pct = ((w.success / w.total) * 100).toFixed(1);
  const failPct = ((w.fail / w.total) * 100).toFixed(1);
  host.innerHTML = `
    <div class="ad-kv-row"><i class="ad-kv-icon">🔗</i><span class="ad-kv-label">Tổng số</span><span class="ad-kv-val">${adFormatNum(w.total)}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-green">✅</i><span class="ad-kv-label">Thành công</span><span class="ad-kv-val">${adFormatNum(w.success)} (${pct}%)</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-red">❌</i><span class="ad-kv-label">Thất bại</span><span class="ad-kv-val">${adFormatNum(w.fail)} (${failPct}%)</span></div>`;
}

function renderAdLogsBox() {
  const host = document.getElementById("ad-logs-box");
  if (!host) return;
  const l = AD_LOGS_SUMMARY;
  const infoPct = ((l.info / l.total) * 100).toFixed(1);
  const warnPct = ((l.warn / l.total) * 100).toFixed(1);
  const errPct = ((l.error / l.total) * 100).toFixed(1);
  host.innerHTML = `
    <div class="ad-kv-row"><i class="ad-kv-icon">📄</i><span class="ad-kv-label">Tổng số</span><span class="ad-kv-val">${adFormatNum(l.total)}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-blue">🔵</i><span class="ad-kv-label">Thông báo</span><span class="ad-kv-val">${adFormatNum(l.info)} (${infoPct}%)</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-warn">⚠️</i><span class="ad-kv-label">Cảnh báo</span><span class="ad-kv-val">${adFormatNum(l.warn)} (${warnPct}%)</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-red">🔴</i><span class="ad-kv-label">Lỗi</span><span class="ad-kv-val">${adFormatNum(l.error)} (${errPct}%)</span></div>`;
}

/* --- 8. RENDER: BẢNG TÀI KHOẢN MỚI NHẤT --- */

function renderAdNewAccountsTable() {
  const host = document.getElementById("ad-new-accounts");
  if (!host) return;
  host.innerHTML = `
    <table class="md-tx-table">
      <thead>
        <tr><th>Tên người dùng</th><th>Email</th><th>Vai trò</th><th>Thời gian tạo</th><th>Trạng thái</th></tr>
      </thead>
      <tbody>
        ${AD_NEW_ACCOUNTS.map(
          (a) => `
        <tr>
          <td class="md-tx-amt">${a.name}</td>
          <td>${a.email}</td>
          <td><span class="ad-role-badge ${AD_ROLE_BADGE_CLASS[a.role] || ""}">${a.role}</span></td>
          <td>${a.time}</td>
          <td><span class="md-tx-status ok">Hoạt động</span></td>
        </tr>`
        ).join("")}
      </tbody>
    </table>`;
}

/* --- 9. RENDER: BẢNG HOẠT ĐỘNG HỆ THỐNG GẦN ĐÂY --- */

function renderAdActivityTable() {
  const host = document.getElementById("ad-activity-log");
  if (!host) return;
  host.innerHTML = `
    <table class="md-tx-table">
      <thead>
        <tr><th>Loại</th><th>Nội dung</th><th>Thời gian</th><th>Người thực hiện</th><th>IP</th></tr>
      </thead>
      <tbody>
        ${AD_ACTIVITY_LOG.map(
          (l) => `
        <tr>
          <td><span style="color:${l.color};">${l.icon}</span> ${l.type}</td>
          <td>${l.content}</td>
          <td>${l.time}</td>
          <td class="md-tx-amt">${l.user}</td>
          <td style="font-family:monospace; color:#9a9aa3;">${l.ip}</td>
        </tr>`
        ).join("")}
      </tbody>
    </table>`;
}

/* --- 10. KHỞI TẠO TOÀN BỘ ADMIN DASHBOARD --- */

function renderAdminDashboard() {
  try { renderAdMetrics(); } catch (e) { console.error("Lỗi render AD metrics:", e); }
  try { renderAdTrendChart(); } catch (e) { console.error("Lỗi render AD trend chart:", e); }
  try { renderAdRoleDonut(); } catch (e) { console.error("Lỗi render AD role donut:", e); }
  try { renderAdActivityBars(); } catch (e) { console.error("Lỗi render AD activity bars:", e); }
  try { renderAdSystemStatus(); } catch (e) { console.error("Lỗi render AD system status:", e); }
  try { renderAdBackupBox(); } catch (e) { console.error("Lỗi render AD backup box:", e); }
  try { renderAdWebhookBox(); } catch (e) { console.error("Lỗi render AD webhook box:", e); }
  try { renderAdLogsBox(); } catch (e) { console.error("Lỗi render AD logs box:", e); }
  try { renderAdNewAccountsTable(); } catch (e) { console.error("Lỗi render AD new accounts:", e); }
  try { renderAdActivityTable(); } catch (e) { console.error("Lỗi render AD activity log:", e); }
}
window.renderAdminDashboard = renderAdminDashboard;
