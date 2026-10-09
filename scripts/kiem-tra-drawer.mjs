// E2E cho bảng trượt (drawer) ở 3 trang có form ngắn.
// Kiểm cả 3 luật đặt ra cho người không quen máy tính:
//   1. Đang sửa dở mà bấm ra ngoài thì HỎI LẠI, không đóng im lặng
//   2. Nút Lưu dính đáy, luôn nhìn thấy
//   3. Một cột
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
const type = async (s) => { for (const ch of s) { await send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch }); await wait(25); } };
const clickSel = async (sel) => { const b = await js(`(() => { const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null; const r=el.getClientRects()[0]||el.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}; })()`); if (!b) return false; for (const ty of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent', { type: ty, x:b.x, y:b.y, button:'left', clickCount:1 }); await wait(300); return true; };

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { (ok ? pass++ : fail++); console.log(`  ${ok ? 'ĐẠT ' : 'HỎNG'} ${name.padEnd(44)} ${detail}`); };

const ROW = { id: 1, fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'a@truong.vn', status: 'PENDING', note: '', createdAt: '2026-03-01', studentCode: 'HV001', title: 'Điều dưỡng', date: '2026-03-01', subject: 'Giải phẫu', student: { id: 1, fullName: 'Nguyễn Văn A', studentCode: 'HV001' } };
const PAYLOAD = { data: [ROW], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };

await send('Page.enable'); await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
handlers.push(async (m) => {
    if (m.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = m.params;
    if (!/easypanel\.host/.test(request.url)) { await send('Fetch.continueRequest', { requestId }); return; }
    const CORS = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: '*' }];
    if (request.method === 'OPTIONS') { await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: CORS }); return; }
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, body: Buffer.from(JSON.stringify(PAYLOAD)).toString('base64'), responseHeaders: [...CORS, { name: 'Content-Type', value: 'application/json' }] });
});
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 820, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4344/auth/cover-login' });
await wait(1800);
await js("document.cookie='auth_token=x; path=/'");

const PAGES = [
    ['/consultations', 'them-don', 'Đơn tư vấn'],
    ['/students', 'them-hoc-vien', 'Học viên'],
    ['/students/1/attendance', 'them-diem-danh', 'Điểm danh'],  // form nằm ở trang điểm danh CỦA MỘT học viên
];

console.log('\n── Bảng trượt (drawer) ──');
for (const [path, testid, label] of PAGES) {
    await send('Page.navigate', { url: `http://localhost:4344${path}` });
    await wait(2600);
    await clickSel(`[data-testid=${testid}]`);
    await wait(700);
    const box = await js(`(() => {
      const d = document.querySelector('[data-testid=drawer]');
      if (!d) return null;
      const r = d.getBoundingClientRect();
      const save = d.querySelector('[data-testid=drawer-save]');
      const saveBox = save?.getBoundingClientRect();
      return {
        truotTuPhai: Math.round(r.right) >= window.innerWidth - 2,
        caoHetManHinh: Math.round(r.height) >= window.innerHeight - 2,
        coNutLuu: !!save,
        nutLuuTrongTam: saveBox ? saveBox.bottom <= window.innerHeight + 1 && saveBox.top > r.top : false,
        soOnhap: d.querySelectorAll('input, select, textarea').length,
      };
    })()`);
    check(`${label}: drawer mở ra`, !!box, box ? `${box.soOnhap} ô nhập` : 'KHÔNG thấy drawer');
    if (box) {
        check(`${label}: trượt từ phải, cao hết màn hình`, box.truotTuPhai && box.caoHetManHinh);
        check(`${label}: nút Lưu dính đáy, nhìn thấy được`, box.coNutLuu && box.nutLuuTrongTam);
    } else {
        fail += 2;
    }
}

// Luật quan trọng nhất: sửa dở mà đóng thì phải hỏi
await send('Page.navigate', { url: 'http://localhost:4344/consultations' });
await wait(2600);
await clickSel('[data-testid=them-don]');
await wait(700);
await clickSel('[data-testid=drawer] input');
await type('Nguyen Van Test');
await wait(400);
check('gõ vào thì báo "có thay đổi chưa lưu"', (await js("document.querySelector('[data-testid=drawer]')?.textContent || ''")).includes('chưa lưu'));
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape' });
await wait(800);
check('đang sửa dở mà đóng thì HỎI LẠI', await js("!!document.querySelector('.swal2-container')"));
await js("document.querySelector('.swal2-cancel')?.click()");
await wait(600);
check('chọn "Tiếp tục sửa" thì drawer còn nguyên', await js("!!document.querySelector('[data-testid=drawer]')"));
check('chữ đã gõ không bị mất', (await js("document.querySelector('[data-testid=drawer] input')?.value || ''")).includes('Nguyen Van Test'));

console.log(`\n  Tổng: ${pass} đạt, ${fail} hỏng\n`);
await closeTab();
process.exit(fail > 0 ? 1 : 0);
