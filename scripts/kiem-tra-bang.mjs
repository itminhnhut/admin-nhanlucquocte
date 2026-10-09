// E2E: mọi trang danh sách phải vẽ được bảng dùng chung, có dòng dữ liệu và dòng
// "Hiện 1–… trong …". Chạy: node scripts/kiem-tra-bang.mjs
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

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { (ok ? pass++ : fail++); console.log(`  ${ok ? 'ĐẠT ' : 'HỎNG'} ${name.padEnd(40)} ${detail}`); };

// Một bộ dữ liệu giả đủ field cho mọi trang
const ROW = {
    id: 1, title: 'Điều dưỡng', slug: 'dieu-duong', description: 'Mô tả', image: '', content: '<p>x</p>', active: true,
    fullName: 'Nguyễn Văn A', username: 'a.nv', role: 'EDITOR', phone: '0901234567', email: 'a@truong.vn',
    studentCode: 'HV001', date: '2026-03-01', subject: 'Giải phẫu', status: 'PRESENT', note: '', createdAt: '2026-03-01',
    student: { id: 1, studentCode: 'HV001', fullName: 'Nguyễn Văn A' }, summary: 'Tóm tắt', isHot: false, published: true,
    degreeNumber: 'VB-001', yearOfGrad: 2026, program: { title: 'Điều dưỡng' },
};
const PAYLOAD = { data: [ROW, { ...ROW, id: 2, title: 'Dược sĩ', fullName: 'Trần Thị B' }], meta: { page: 1, limit: 10, total: 2, totalPages: 1 } };

await send('Page.enable'); await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message));const oe=console.error;console.error=(...a)=>{window.__errs.push(String(a[0]).slice(0,120));oe(...a)}" });
await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
handlers.push(async (m) => {
    if (m.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = m.params;
    if (!/easypanel\.host/.test(request.url)) { await send('Fetch.continueRequest', { requestId }); return; }
    const CORS = [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: '*' },
    ];
    if (request.method === 'OPTIONS') { await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: CORS }); return; }
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, body: Buffer.from(JSON.stringify(PAYLOAD)).toString('base64'), responseHeaders: [...CORS, { name: 'Content-Type', value: 'application/json' }] });
});
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4344/auth/cover-login' });
await wait(1800);
await js("document.cookie='auth_token=x; path=/'");

const PAGES = [
    ['/programs', 'Ngành đào tạo'],
    ['/news', 'Tin tức'],
    ['/students', 'Học viên'],
    ['/consultations', 'Đơn tư vấn'],
    ['/degrees', 'Văn bằng'],
    ['/student/attendance', 'Điểm danh'],
    ['/users', 'Tài khoản quản trị'],
];

console.log('\n── Bảng dùng chung trên mọi trang danh sách ──');
for (const [path, label] of PAGES) {
    await send('Page.navigate', { url: `http://localhost:4344${path}` });
    await wait(2600);
    const info = await js(`(() => {
      const table = document.querySelector('[data-testid=data-table]');
      if (!table) return { coBang: false };
      return {
        coBang: true,
        soDong: table.querySelectorAll('tbody tr').length,
        soCot: table.querySelectorAll('thead th').length,
        dongTomTat: document.querySelector('[data-testid=table-range]')?.textContent || '',
        conMantine: !!document.querySelector('[class*=mantine]'),
      };
    })()`);
    check(`${label}`, Boolean(info?.coBang) && info.soDong >= 1 && !info.conMantine, info?.coBang ? `${info.soDong} dòng · ${info.soCot} cột · ${info.dongTomTat}` : 'KHÔNG thấy bảng');
}
const errs = await js("(window.__errs||[]).filter(e=>!/Network Error/i.test(e))");
check('không có lỗi JS', Array.isArray(errs) && errs.length === 0, (errs || []).slice(0, 2).join(' | '));
console.log(`\n  Tổng: ${pass} đạt, ${fail} hỏng\n`);
await closeTab();
process.exit(fail > 0 ? 1 : 0);
