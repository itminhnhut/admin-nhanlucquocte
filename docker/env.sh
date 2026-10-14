#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Runtime Environment Variable Injection for admin-nhanlucquocte
#
# Script này chạy khi Nginx container khởi động.
# Nó inject file env-config.js chứa window.__ENV__ vào index.html.
#
# Các env sử dụng trên EasyPanel:
#   VITE_API_URL=https://api.yoursite.com
#   VITE_APP_URL=https://admin.yoursite.com
#   VITE_SITEMAP_REFRESH_URL=https://landing.yoursite.com/sitemap/refresh?key=<SITEMAP_KEY>
# ─────────────────────────────────────────────────────────────────────────────

set -e

HTML_FILE="/usr/share/nginx/html/index.html"
JS_ENV_FILE="/usr/share/nginx/html/env-config.js"

echo "[env-inject] Injecting runtime environment variables..."

# ── Giá trị mặc định (fallback nếu EasyPanel không set) ──────────────────────
# API của trường. EasyPanel set biến môi trường thì giá trị đó thắng.
VITE_API_URL="${VITE_API_URL:-https://api.trungcapnhanlucquocte.vn/api/}"
VITE_APP_URL="${VITE_APP_URL:-https://admin.trungcapnhanlucquocte.vn}"
VITE_SITEMAP_REFRESH_URL="${VITE_SITEMAP_REFRESH_URL:-}"

# ── Ghi file JS chứa window.__ENV__ ──────────────────────────────────────────
cat > "$JS_ENV_FILE" <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_APP_URL: "${VITE_APP_URL}",
  VITE_SITEMAP_REFRESH_URL: "${VITE_SITEMAP_REFRESH_URL}"
};
EOF

echo "[env-inject] Generated env-config.js:"
cat "$JS_ENV_FILE"

# ── Inject <script> tag vào index.html nếu chưa có ──────────────────────────
if ! grep -q "env-config.js" "$HTML_FILE"; then
  sed -i 's|</head>|  <script src="/env-config.js"></script>\n  </head>|' "$HTML_FILE"
  echo "[env-inject] Injected env-config.js script tag into index.html"
else
  echo "[env-inject] env-config.js already present in index.html, skipping."
fi

echo "[env-inject] Done."
