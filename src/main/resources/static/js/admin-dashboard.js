/* =========================================================================
   ADMIN DASHBOARD — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu trong file này là dữ liệu tĩnh dùng để hiển thị
   demo giao diện Dashboard, phỏng theo mẫu tham khảo (LumiAI).
   Khi Back-end có API thống kê thật, chỉ cần thay các hằng số AD_* bên dưới
   bằng dữ liệu fetch() từ server.
   ========================================================================= */

/* =========================================================
   DỮ LIỆU DASHBOARD ĐƯỢC LẤY TỪ API
   ========================================================= */

const AD_METRICS = [
  {
    icon: "👥",
    bg: "rgba(99,102,241,0.16)",
    fg: "#818cf8",
    label: "Tổng người dùng",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  },
  {
    icon: "📈",
    bg: "rgba(20,184,166,0.16)",
    fg: "#2dd4bf",
    label: "Tài khoản mới",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  },
  {
    icon: "🔒",
    bg: "rgba(239,68,68,0.16)",
    fg: "#f87171",
    label: "Tài khoản bị khóa",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  },
  {
    icon: "📄",
    bg: "rgba(59,130,246,0.16)",
    fg: "#60a5fa",
    label: "Logs hệ thống",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  },
  {
    icon: "🔗",
    bg: "rgba(168,85,247,0.16)",
    fg: "#c084fc",
    label: "Webhook Logs",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  },
  {
    icon: "🛡️",
    bg: "rgba(20,184,166,0.16)",
    fg: "#2dd4bf",
    label: "Backup thành công",
    value: "0",
    delta: "0.0%",
    sub: "so với tuần trước"
  }
];

const AD_TREND_7D = [];
const AD_ROLES = [];
const AD_ACTIVITY_7D = [];

const AD_SYSTEM_STATUS = [
  { icon: "🗄️", label: "API Server", ok: false },
  { icon: "📄", label: "Database", ok: false },
  { icon: "📦", label: "Storage", ok: false },
  { icon: "🛡️", label: "Backup Service", ok: false }
];

const AD_LATEST_BACKUP = {
  time: "Chưa có dữ liệu",
  type: "Không xác định",
  size: "0 MB",
  ok: false
};

const AD_WEBHOOK_SUMMARY = {
  total: 0,
  success: 0,
  fail: 0
};

const AD_LOGS_SUMMARY = {
  total: 0,
  info: 0,
  warn: 0,
  error: 0
};

const AD_ROLE_BADGE_CLASS = {
  Admin: "ad-role-admin",
  Manager: "ad-role-editor",
  Staff: "ad-role-viewer",
  Customer: "ad-role-user"
};

const AD_NEW_ACCOUNTS = [];
const AD_ACTIVITY_LOG = [];

/* --- 2. HÀM TIỆN ÍCH --- */
const AD_ROLE_NAMES = {
  1: "Manager",
  2: "Staff",
  3: "Customer",
  4: "Admin"
};

const AD_ROLE_COLORS = {
  Admin: "#60a5fa",
  Manager: "#4ade80",
  Staff: "#f59e0b",
  Customer: "#a78bfa"
};

function adParseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  // Xử lý ngày dạng dd/MM/yyyy HH:mm:ss của backup
  const viDate = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  );

  if (viDate) {
    return new Date(
      Number(viDate[3]),
      Number(viDate[2]) - 1,
      Number(viDate[1]),
      Number(viDate[4] || 0),
      Number(viDate[5] || 0),
      Number(viDate[6] || 0)
    );
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function adFormatDateTime(value) {
  const date = adParseDate(value);

  if (!date) return "Không xác định";

  const pad = (number) =>
    String(number).padStart(2, "0");

  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/` +
    `${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function adFormatShortDate(date) {
  const pad = (number) =>
    String(number).padStart(2, "0");

  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
  );
}

function adStartOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function adEndOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function adIsDateInRange(date, start, end) {
  return date && date >= start && date <= end;
}

function adIsSameDay(date1, date2) {
  if (!date1 || !date2) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function adCalculateDelta(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue === 0
      ? "0.0%"
      : "+100.0%";
  }

  const percent =
    ((currentValue - previousValue) / previousValue) * 100;

  const prefix = percent > 0 ? "+" : "";

  return `${prefix}${percent.toFixed(1)}%`;
}

function adNormalizeLogLevel(log) {
  const level =
    String(log.level || "").toLowerCase();

  if (["info", "warning", "error"].includes(level)) {
    return level;
  }

  return String(log.status || "").toUpperCase() === "FAILED"
    ? "error"
    : "info";
}

function adNormalizeAction(action) {
  return String(action || "")
    .toLowerCase()
    .replaceAll("_", " ");
}

function adIsBanLog(log) {
  const action = adNormalizeAction(log.action);

  return (
    action.includes("khóa") &&
    action.includes("tài khoản") &&
    !action.includes("mở khóa")
  );
}

function adIsUnbanLog(log) {
  const action = adNormalizeAction(log.action);

  return (
    action.includes("mở khóa") &&
    action.includes("tài khoản")
  );
}

function adGetLogDisplay(log) {
  const level = adNormalizeLogLevel(log);
  const action = String(log.action || "Hoạt động hệ thống");

  if (level === "error") {
    return {
      icon: "❌",
      color: "#f87171",
      type: "Lỗi"
    };
  }

  if (level === "warning") {
    return {
      icon: "⚠️",
      color: "#f59e0b",
      type: action
    };
  }

  return {
    icon: "📄",
    color: "#60a5fa",
    type: action
  };
}

async function loadAdminDashboard() {
  const metricsHost =
    document.getElementById("ad-metrics");

  if (metricsHost) {
    metricsHost.innerHTML = `
      <div class="ad-metric-card"
           style="grid-column:1/-1; text-align:center; padding:30px;">
        Đang tải dữ liệu Dashboard...
      </div>
    `;
  }

  const results = await Promise.allSettled([
    API.getAdminUsers(),
    API.getSysLogs(),
    API.getWebhooks(),
    API.getDbBackups()
  ]);

  const usersResult = results[0];
  const logsResult = results[1];
  const webhooksResult = results[2];
  const backupsResult = results[3];

  const users =
    usersResult.status === "fulfilled" &&
    Array.isArray(usersResult.value)
      ? usersResult.value
      : [];

  const logs =
    logsResult.status === "fulfilled" &&
    Array.isArray(logsResult.value)
      ? logsResult.value
      : [];

  const webhooks =
    webhooksResult.status === "fulfilled" &&
    Array.isArray(webhooksResult.value)
      ? webhooksResult.value
      : [];

  const backups =
    backupsResult.status === "fulfilled" &&
    Array.isArray(backupsResult.value)
      ? backupsResult.value
      : [];

  if (usersResult.status === "rejected") {
    console.error("Lỗi tải users:", usersResult.reason);
  }

  if (logsResult.status === "rejected") {
    console.error("Lỗi tải Syslogs:", logsResult.reason);
  }

  if (webhooksResult.status === "rejected") {
    console.error(
      "Lỗi tải Webhook Logs:",
      webhooksResult.reason
    );
  }

  if (backupsResult.status === "rejected") {
    console.error(
      "Lỗi tải Backups:",
      backupsResult.reason
    );
  }

  const now = new Date();

  const currentStart = adStartOfDay(now);
  currentStart.setDate(currentStart.getDate() - 6);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(-1);

  const normalizedUsers = users.map((user) => ({
    ...user,
    createdAt: adParseDate(user.createdDate)
  }));

  const normalizedLogs = logs.map((log) => ({
    ...log,
    level: adNormalizeLogLevel(log),
    createdAt: adParseDate(log.time)
  }));

  const normalizedWebhooks = webhooks.map((item) => {
    const code = Number(item.code) || 0;

    return {
      ...item,
      code: code,
      status:
        String(item.status || "").toLowerCase() ||
        (code >= 200 && code < 300
          ? "success"
          : "failed"),
      createdAt: adParseDate(item.time)
    };
  });

  const normalizedBackups = backups
    .map((backup) => ({
      ...backup,
      createdAt: adParseDate(backup.date)
    }))
    .sort((a, b) => {
      const timeA = a.createdAt
        ? a.createdAt.getTime()
        : 0;

      const timeB = b.createdAt
        ? b.createdAt.getTime()
        : 0;

      return timeB - timeA;
    });

  const currentLogs = normalizedLogs.filter((log) =>
    adIsDateInRange(log.createdAt, currentStart, now)
  );

  const previousLogs = normalizedLogs.filter((log) =>
    adIsDateInRange(
      log.createdAt,
      previousStart,
      previousEnd
    )
  );

  const currentWebhooks =
    normalizedWebhooks.filter((item) =>
      adIsDateInRange(
        item.createdAt,
        currentStart,
        now
      )
    );

  const previousWebhooks =
    normalizedWebhooks.filter((item) =>
      adIsDateInRange(
        item.createdAt,
        previousStart,
        previousEnd
      )
    );

  const currentBackups =
    normalizedBackups.filter((backup) =>
      adIsDateInRange(
        backup.createdAt,
        currentStart,
        now
      )
    );

  const previousBackups =
    normalizedBackups.filter((backup) =>
      adIsDateInRange(
        backup.createdAt,
        previousStart,
        previousEnd
      )
    );

  const currentNewAccounts =
    normalizedUsers.filter((user) =>
      adIsDateInRange(
        user.createdAt,
        currentStart,
        now
      )
    );

  const previousNewAccounts =
    normalizedUsers.filter((user) =>
      adIsDateInRange(
        user.createdAt,
        previousStart,
        previousEnd
      )
    );

  const bannedUsers = normalizedUsers.filter(
    (user) =>
      String(user.status || "").toLowerCase() ===
      "banned"
  );

  const banEventsThisWeek =
    currentLogs.filter(adIsBanLog).length;

  const unbanEventsThisWeek =
    currentLogs.filter(adIsUnbanLog).length;

  const previousBannedCount = Math.max(
    0,
    bannedUsers.length -
      banEventsThisWeek +
      unbanEventsThisWeek
  );

  const usersBeforeWeek = normalizedUsers.filter(
    (user) =>
      !user.createdAt ||
      user.createdAt < currentStart
  ).length;

  AD_METRICS[0].value =
    normalizedUsers.length.toLocaleString("vi-VN");

  AD_METRICS[0].delta =
    adCalculateDelta(
      normalizedUsers.length,
      usersBeforeWeek
    );

  AD_METRICS[1].value =
    currentNewAccounts.length.toLocaleString("vi-VN");

  AD_METRICS[1].delta =
    adCalculateDelta(
      currentNewAccounts.length,
      previousNewAccounts.length
    );

  AD_METRICS[2].value =
    bannedUsers.length.toLocaleString("vi-VN");

  AD_METRICS[2].delta =
    adCalculateDelta(
      bannedUsers.length,
      previousBannedCount
    );

  AD_METRICS[3].value =
    currentLogs.length.toLocaleString("vi-VN");

  AD_METRICS[3].delta =
    adCalculateDelta(
      currentLogs.length,
      previousLogs.length
    );

  AD_METRICS[4].value =
    currentWebhooks.length.toLocaleString("vi-VN");

  AD_METRICS[4].delta =
    adCalculateDelta(
      currentWebhooks.length,
      previousWebhooks.length
    );

  AD_METRICS[5].value =
    currentBackups.length.toLocaleString("vi-VN");

  AD_METRICS[5].delta =
    adCalculateDelta(
      currentBackups.length,
      previousBackups.length
    );

  // ---------------------------------------------------------
  // Biểu đồ tổng quan 7 ngày
  // ---------------------------------------------------------

  const trendData = [];

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);

    const start = adStartOfDay(day);
    const end = adEndOfDay(day);

    const totalUsersAtDay =
      normalizedUsers.filter((user) =>
        !user.createdAt || user.createdAt <= end
      ).length;

    const newAccountsAtDay =
      normalizedUsers.filter((user) =>
        adIsDateInRange(
          user.createdAt,
          start,
          end
        )
      ).length;

    const bannedAtDay =
      normalizedLogs.filter(
        (log) =>
          adIsBanLog(log) &&
          adIsDateInRange(
            log.createdAt,
            start,
            end
          )
      ).length;

    trendData.push({
      label: adFormatShortDate(day),
      users: totalUsersAtDay,
      newAcc: newAccountsAtDay,
      banned: bannedAtDay
    });
  }

  AD_TREND_7D.splice(
    0,
    AD_TREND_7D.length,
    ...trendData
  );

  // ---------------------------------------------------------
  // Phân bố vai trò
  // ---------------------------------------------------------

  const roleOrder = [
    "Admin",
    "Manager",
    "Staff",
    "Customer"
  ];

  const roleData = roleOrder.map((roleName) => {
    const roleId = Number(
      Object.keys(AD_ROLE_NAMES).find(
        (key) => AD_ROLE_NAMES[key] === roleName
      )
    );

    const count = normalizedUsers.filter(
      (user) => Number(user.roleId) === roleId
    ).length;

    const percent =
      normalizedUsers.length === 0
        ? 0
        : (count / normalizedUsers.length) * 100;

    return {
      label: roleName,
      pct: Number(percent.toFixed(1)),
      count: count,
      color: AD_ROLE_COLORS[roleName]
    };
  });

  AD_ROLES.splice(
    0,
    AD_ROLES.length,
    ...roleData
  );

  // ---------------------------------------------------------
  // Logs và Webhooks theo ngày
  // ---------------------------------------------------------

  const activityData = [];

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);

    const start = adStartOfDay(day);
    const end = adEndOfDay(day);

    activityData.push({
      label: adFormatShortDate(day),

      logs: normalizedLogs.filter((log) =>
        adIsDateInRange(
          log.createdAt,
          start,
          end
        )
      ).length,

      webhook: normalizedWebhooks.filter((item) =>
        adIsDateInRange(
          item.createdAt,
          start,
          end
        )
      ).length
    });
  }

  AD_ACTIVITY_7D.splice(
    0,
    AD_ACTIVITY_7D.length,
    ...activityData
  );

  // ---------------------------------------------------------
  // Trạng thái dịch vụ
  // ---------------------------------------------------------

  const apiOk = results.some(
    (result) => result.status === "fulfilled"
  );

  AD_SYSTEM_STATUS[0].ok = apiOk;

  AD_SYSTEM_STATUS[1].ok =
    usersResult.status === "fulfilled" &&
    logsResult.status === "fulfilled";

  AD_SYSTEM_STATUS[2].ok =
    backupsResult.status === "fulfilled";

  AD_SYSTEM_STATUS[3].ok =
    backupsResult.status === "fulfilled";

  // ---------------------------------------------------------
  // Backup gần nhất
  // ---------------------------------------------------------

  const latestBackup = normalizedBackups[0];

  if (latestBackup) {
    Object.assign(AD_LATEST_BACKUP, {
      time:
        latestBackup.date ||
        adFormatDateTime(latestBackup.createdAt),

      type:
        latestBackup.type || "Thủ công",

      size:
        latestBackup.size || "Không xác định",

      ok: true
    });
  } else {
    Object.assign(AD_LATEST_BACKUP, {
      time: "Chưa có bản sao lưu",
      type: "Không xác định",
      size: "0 MB",
      ok: false
    });
  }

  // ---------------------------------------------------------
  // Tổng quan Webhook
  // ---------------------------------------------------------

  const webhookSuccess =
    currentWebhooks.filter(
      (item) =>
        String(item.status).toLowerCase() ===
        "success"
    ).length;

  Object.assign(AD_WEBHOOK_SUMMARY, {
    total: currentWebhooks.length,
    success: webhookSuccess,
    fail: currentWebhooks.length - webhookSuccess
  });

  // ---------------------------------------------------------
  // Tổng quan Syslogs
  // ---------------------------------------------------------

  Object.assign(AD_LOGS_SUMMARY, {
    total: currentLogs.length,

    info: currentLogs.filter(
      (log) => log.level === "info"
    ).length,

    warn: currentLogs.filter(
      (log) => log.level === "warning"
    ).length,

    error: currentLogs.filter(
      (log) => log.level === "error"
    ).length
  });

  // ---------------------------------------------------------
  // 5 tài khoản mới nhất
  // ---------------------------------------------------------

  const newestAccounts = [...normalizedUsers]
    .sort((a, b) => {
      const timeA = a.createdAt
        ? a.createdAt.getTime()
        : 0;

      const timeB = b.createdAt
        ? b.createdAt.getTime()
        : 0;

      return timeB - timeA;
    })
    .slice(0, 5)
    .map((user) => ({
      name:
        user.fullname ||
        user.email?.split("@")[0] ||
        "Không xác định",

      email:
        user.email || "Không xác định",

      role:
        AD_ROLE_NAMES[Number(user.roleId)] ||
        "Không xác định",

      time:
        adFormatDateTime(user.createdAt),

      active:
        String(user.status || "").toLowerCase() ===
        "active"
    }));

  AD_NEW_ACCOUNTS.splice(
    0,
    AD_NEW_ACCOUNTS.length,
    ...newestAccounts
  );

  // ---------------------------------------------------------
  // 5 hoạt động hệ thống gần nhất
  // ---------------------------------------------------------

  const newestLogs = [...normalizedLogs]
    .sort((a, b) => {
      const timeA = a.createdAt
        ? a.createdAt.getTime()
        : 0;

      const timeB = b.createdAt
        ? b.createdAt.getTime()
        : 0;

      return timeB - timeA;
    })
    .slice(0, 5)
    .map((log) => {
      const display = adGetLogDisplay(log);

      return {
        icon: display.icon,
        color: display.color,
        type: display.type,

        content:
          log.detail ||
          log.action ||
          "Không có nội dung",

        time:
          adFormatDateTime(log.createdAt),

        user:
          log.user || "system",

        ip:
          log.ip || "Không xác định"
      };
    });

  AD_ACTIVITY_LOG.splice(
    0,
    AD_ACTIVITY_LOG.length,
    ...newestLogs
  );

  renderAdminDashboard();
}

window.loadAdminDashboard = loadAdminDashboard;
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
const maxVal = Math.max(
  1,
  ...data.map((d) =>
    Math.max(d.users, d.newAcc, d.banned)
  )
) * 1.15;  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

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
const maxVal = Math.max(
  1,
  ...AD_ACTIVITY_7D.map((d) =>
    Math.max(d.logs, d.webhook)
  )
);
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
const pct =
  w.total === 0
    ? "0.0"
    : ((w.success / w.total) * 100).toFixed(1);

const failPct =
  w.total === 0
    ? "0.0"
    : ((w.fail / w.total) * 100).toFixed(1);
  host.innerHTML = `
    <div class="ad-kv-row"><i class="ad-kv-icon">🔗</i><span class="ad-kv-label">Tổng số</span><span class="ad-kv-val">${adFormatNum(w.total)}</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-green">✅</i><span class="ad-kv-label">Thành công</span><span class="ad-kv-val">${adFormatNum(w.success)} (${pct}%)</span></div>
    <div class="ad-kv-row"><i class="ad-kv-icon ad-kv-red">❌</i><span class="ad-kv-label">Thất bại</span><span class="ad-kv-val">${adFormatNum(w.fail)} (${failPct}%)</span></div>`;
}

function renderAdLogsBox() {
  const host = document.getElementById("ad-logs-box");
  if (!host) return;
  const l = AD_LOGS_SUMMARY;
 const infoPct =
  l.total === 0
    ? "0.0"
    : ((l.info / l.total) * 100).toFixed(1);

const warnPct =
  l.total === 0
    ? "0.0"
    : ((l.warn / l.total) * 100).toFixed(1);

const errPct =
  l.total === 0
    ? "0.0"
    : ((l.error / l.total) * 100).toFixed(1);
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
<td>
  <span class="md-tx-status ${a.active ? "ok" : "failed"}">
    ${a.active ? "Hoạt động" : "Bị khóa"}
  </span>
</td>        </tr>`
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