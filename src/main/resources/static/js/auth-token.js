// Tự động đính kèm JWT vào mọi request gọi tới /api của mình
(function () {
  const originalFetch = window.fetch;
  window.fetch = function (url, options = {}) {
    try {
      const u = typeof url === "string" ? url : (url && url.url) || "";
      if (u.includes("/api/")) {
        const user = JSON.parse(localStorage.getItem("las_logged_in_user") || "{}");
        const token = user && user.token;
        if (token) {
          const headers = new Headers(options.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", "Bearer " + token);
          }
          options = { ...options, headers };
        }
      }
    } catch (e) { /* bỏ qua */ }
    return originalFetch(url, options);
  };
})();