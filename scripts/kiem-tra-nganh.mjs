// E2E luồng Ngành đào tạo: danh sách -> thêm mới -> lưu -> sửa.
// Chặn API ở tầng trình duyệt và KIỂM LUÔN DỮ LIỆU GỬI LÊN, không chỉ kiểm giao diện.
// Chạy: node scripts/kiem-tra-nganh.mjs [rộng] [cao]
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 820);
const base = 'http://127.0.0.1:9222';
const t = await (await fetch(`${base}/json/new?about:blank`, { method: 'PUT' })).json();
const closeTab = async () => { try { await fetch(`${base}/json/close/${t.id}`); } catch {} };
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const handlers = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) handlers.forEach((h) => h(m)); });
await new Promise((r) => ws.addEventListener('open', r));
const send = (m, p = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const js = (e) => send('Runtime.evaluate', { expression: e, returnByValue: true }).then((r) => r.result?.result?.value ?? r.result?.exceptionDetails?.text);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const type = async (s) => { for (const ch of s) { await send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch }); await wait(20); } };
const clickSel = async (sel) => { const b = await js(`(() => { const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null; const r=el.getClientRects()[0]||el.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}; })()`); if (!b) return false; for (const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent', { type, x:b.x, y:b.y, button:'left', clickCount:1 }); await wait(250); return true; };

let pass = 0, fail = 0, planned = 0;
const check = (name, ok, detail = '') => { planned++; (ok ? pass++ : fail++); console.log(`  ${ok ? 'ĐẠT ' : 'HỎNG'} ${name.padEnd(44)} ${detail}`); };

const PROGRAMS = [
    { id: 7, title: 'Chuyên ngành Điều dưỡng hệ Trung cấp', slug: 'chuyen-nganh-dieu-duong-he-trung-cap', description: 'Khai giảng 16/03/2026', image: '', content: '<p>Gioi thieu nganh dieu duong.</p>', active: true, createdAt: '2026-03-01' },
    { id: 9, title: 'Chăm sóc sắc đẹp', slug: 'cham-soc-sac-dep', description: '', image: 'https://example.com/a.webp', content: '<p>Noi dung.</p>', active: false, createdAt: '2026-02-01' },
];
let saved = null; // dữ liệu mà trang gửi lên khi bấm Lưu

await send('Page.enable'); await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message));const oe=console.error;console.error=(...a)=>{window.__errs.push(String(a[0]).slice(0,160));oe(...a)}" });
await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
handlers.push(async (m) => {
    if (m.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = m.params;
    if (!/easypanel\.host/.test(request.url)) { await send('Fetch.continueRequest', { requestId }); return; }
    // Trả giả lập cho tên miền khác => phải có header CORS, nếu không trình duyệt chặn
    const CORS = [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: '*' },
    ];
    if (request.method === 'OPTIONS') {
        await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: CORS });
        return;
    }
    if (/\/admin\/programs$/.test(request.url) && request.method === 'POST') {
        try { saved = JSON.parse(request.postData || '{}'); } catch { saved = { loi: 'không đọc được body' }; }
        await send('Fetch.fulfillRequest', { requestId, responseCode: 201, body: Buffer.from(JSON.stringify({ data: { id: 99 } })).toString('base64'), responseHeaders: [...CORS, { name: 'Content-Type', value: 'application/json' }] });
        return;
    }
    const body = Buffer.from(JSON.stringify({ data: PROGRAMS, meta: {} })).toString('base64');
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, body, responseHeaders: [...CORS, { name: 'Content-Type', value: 'application/json' }] });
});
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4344/auth/cover-login' });
await wait(1800);
await js("document.cookie='auth_token=x; path=/'; localStorage.removeItem('content-editor-draft:program-new')");

console.log(`\n── Ngành đào tạo · ${W}×${H} ──`);

// 1. Danh sách
await send('Page.navigate', { url: 'http://localhost:4344/programs' });
await wait(3000);
check('danh sách mở được', await js("location.pathname") === '/programs');
check('bảng hiện đủ ngành', await js("document.querySelectorAll('table tbody tr').length") === 2, `${await js("document.querySelectorAll('table tbody tr').length")} dòng`);
check('cột Ảnh báo "chưa có" khi thiếu ảnh', await js("document.body.textContent.includes('chưa có')"));
check('không còn dấu vết Quill', await js("!document.querySelector('.ql-toolbar, .ql-editor')"));

// 2. Thêm mới -> sang TRANG RIÊNG, không phải modal
await clickSel('[data-testid=them-nganh]');
await wait(2500);
check('bấm Thêm ngành sang trang riêng', await js("location.pathname") === '/programs/create', await js('location.pathname'));
check('không phải modal', await js("!document.querySelector('[role=dialog]')"));
check('có ô ảnh ngành', await js("!!document.querySelector('[data-testid=cover-image]')"));
check('có trình soạn Lexical', await js("!!document.querySelector('.lexical-toolbar')"));

// 3. Nhập liệu
await clickSel('input[name=title]');
await type('Nganh Duoc si he Trung cap');
await wait(400);
check('đường dẫn tự sinh theo tên', (await js("document.querySelector('[data-testid=slug-preview]')?.textContent || ''")).includes('/nganh-dao-tao/nganh-duoc-si-he-trung-cap'), await js("document.querySelector('[data-testid=slug-preview]')?.textContent || ''"));

await clickSel('textarea[name=description]');
await type('Khai giang 20/04/2026');

await js(`(() => { const root=document.querySelector('.lexical-content-editable'); root.focus(); const p=root.querySelector('p'); const r=document.createRange(); r.selectNodeContents(p); r.collapse(false); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); })()`);
await wait(300);
await type('Chuong trinh dao tao duoc si.');
await wait(600);
check('gõ được nội dung', (await js("document.querySelector('.lexical-content-editable').textContent")).includes('duoc si'));

// 4. Lưu -> kiểm DỮ LIỆU GỬI LÊN
await clickSel('button[type=submit]');
await wait(2500);
check('đã gửi dữ liệu lên API', !!saved && !saved.loi);
if (saved && !saved.loi) {
    check('gửi đúng tên ngành', saved.title === 'Nganh Duoc si he Trung cap', saved.title);
    check('gửi kèm slug', saved.slug === 'nganh-duoc-si-he-trung-cap', saved.slug);
    check('gửi kèm mô tả', saved.description === 'Khai giang 20/04/2026', saved.description);
    check('gửi kèm nội dung bài', String(saved.content).includes('duoc si'), String(saved.content).slice(0, 48));
    check('có trường ảnh (API đã hỗ trợ)', Object.prototype.hasOwnProperty.call(saved, 'image'), JSON.stringify(saved.image));
    check('gửi trạng thái hiển thị', saved.active === true, String(saved.active));
} else {
    planned += 6; fail += 6;
}
check('lưu xong quay về danh sách', await js("location.pathname") === '/programs', await js('location.pathname'));

// 5. Sửa -> phải điền sẵn dữ liệu cũ
await send('Page.navigate', { url: 'http://localhost:4344/programs/7/edit' });
await wait(3200);
check('trang sửa điền sẵn tên ngành', (await js("document.querySelector('input[name=title]')?.value || ''")) === 'Chuyên ngành Điều dưỡng hệ Trung cấp', await js("document.querySelector('input[name=title]')?.value || ''"));
check('trang sửa điền sẵn mô tả', (await js("document.querySelector('textarea[name=description]')?.value || ''")) === 'Khai giảng 16/03/2026');
check('trang sửa nạp sẵn nội dung', (await js("document.querySelector('.lexical-content-editable')?.textContent || ''")).includes('dieu duong'));

const errs = await js("(window.__errs||[]).filter(e=>!/Network Error/i.test(e))");
check('không có lỗi JS', Array.isArray(errs) && errs.length === 0, (errs || []).slice(0, 2).join(' | '));
console.log(`\n  Tổng: ${pass} đạt, ${fail} hỏng — chạy ${pass + fail}/${planned} mục\n`);
await closeTab();
process.exit(fail > 0 ? 1 : 0);
