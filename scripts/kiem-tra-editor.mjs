// Bộ kiểm toàn bộ trình soạn thảo. Chạy: node kiem-tra.mjs [rộng] [cao]
// Mỗi mục in ĐẠT / HỎNG kèm số đo, để không phải tin vào mắt thường.
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 820);
const TOUCH = process.argv[4] !== 'chuot'; // tham số 3: 'chuot' = giả lập chuột dù màn hẹp
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
const enter = async () => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter' }); await send('Input.dispatchKeyEvent', { type: 'char', text: '\r' }); await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter' }); await wait(120); };
const click = async (x, y) => {
    if (TOUCH && W < 500) {
        // Thiết bị cảm ứng: sự kiện chạm thật. Điểm chạm PHẢI có id và phải có
        // độ trễ giữa chạm xuống và nhả ra, nếu không Chrome không sinh ra click.
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
        await wait(60);
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
        for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
    await wait(200);
};
const move = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await wait(200); };
// Chữ trong dòng có thể xuống dòng: hộp bao trải nhiều dòng nên tâm của nó rơi
// vào khoảng trống. Phải lấy HÌNH CHỮ NHẬT ĐẦU TIÊN (dòng đầu) mới chạm trúng.
const clickSel = async (sel, dx = 0.5, dy = 0.5) => {
    const b = await js(`(() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        if (!el) return null;
        const rects = el.getClientRects();
        const r = rects.length > 0 ? rects[0] : el.getBoundingClientRect();
        return { x: Math.round(r.x + r.width * ${dx}), y: Math.round(r.y + r.height * ${dy}) };
    })()`);
    if (!b) return false;
    await click(b.x, b.y);
    return true;
};

const WIDE = W >= 768;
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { (ok ? pass++ : fail++); console.log(`  ${ok ? 'ĐẠT ' : 'HỎNG'} ${name.padEnd(42)} ${detail}`); };

await send('Page.enable'); await send('Runtime.enable');
if (TOUCH && W < 500) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
handlers.push(async (m) => { if (m.method !== 'Fetch.requestPaused') return; const { requestId, request } = m.params;
  if (!/easypanel\.host/.test(request.url)) { await send('Fetch.continueRequest', { requestId }); return; }
  await send('Fetch.fulfillRequest', { requestId, responseCode: 200, body: Buffer.from(JSON.stringify({ data: [{ id: 1, title: 'Điều dưỡng' }], meta: {} })).toString('base64'), responseHeaders: [{ name: 'Content-Type', value: 'application/json' }] }); });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message));const oe=console.error;console.error=(...a)=>{window.__errs.push(String(a[0]).slice(0,120));oe(...a)}" });
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 500 && TOUCH });
await send('Page.navigate', { url: 'http://localhost:4344/auth/cover-login' });
await wait(1800);
const seed = '<p>Xem them tai <a href="https://trungcapnhanlucquocte.vn/tuyen-sinh">trang tuyen sinh</a>.</p><p><img src="/assets/images/carousel1.jpeg" width="420" height="300"></p><table><tr><th>Nganh</th><th>Ky</th></tr><tr><td>Dieu duong</td><td>4</td></tr></table><p>Doan cuoi cua bai.</p>';
await js(`document.cookie='auth_token=x; path=/'; localStorage.setItem('content-editor-draft:news-new', ${JSON.stringify(JSON.stringify({ html: seed, at: Date.now() }))})`);
await send('Page.navigate', { url: 'http://localhost:4344/news/create' });
await wait(3500);

console.log(`\n── Màn hình ${W}×${H} ──`);
check('trang mở được', await js("location.pathname") === '/news/create', await js('location.pathname'));
check('thanh báo nháp hiện', await js("!!document.querySelector('.lexical-draft-bar')"));
await js("[...document.querySelectorAll('.lexical-draft-bar button')].find(b=>b.textContent.includes('Khôi phục'))?.click()");
await wait(1300);
// Ảnh vẽ bằng React.lazy nên tới sau một nhịp, phải đợi đúng nó chứ không đợi mò
for (let i = 0; i < 20 && !(await js("!!document.querySelector('.lexical-content-editable img')")); i++) await wait(200);
check('khôi phục nháp: có link', await js("!!document.querySelector('.lexical-content-editable a')"));
check('khôi phục nháp: có ảnh', await js("!!document.querySelector('.lexical-content-editable img')"));
const tb = await js("(() => { const t = document.querySelector('.lexical-content-editable table'); return t ? t.rows.length + 'x' + t.rows[0].cells.length : null; })()");
check('khôi phục nháp: có bảng', tb === '2x2', tb || '');
check('gõ được chữ trên ảnh', await js("(() => { const b=[...document.querySelector('.lexical-content-editable').children]; const i=b.findIndex(x=>x.querySelector('img')); return i>0; })()"));

// Tiêu đề + đường dẫn
await clickSel('input[name=title]', 0.2);
await type('Le khai giang khoa 32');
check('đường dẫn tự sinh', (await js(`[...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>t&&t.includes('Đường dẫn'))`) || '').includes('le-khai-giang-khoa-32'));

// Gõ tắt Markdown ở cuối bài
// Bấm chuột không đủ để chuyển tiêu điểm sang vùng soạn: phải focus rồi đặt range
await js(`(() => {
  const root = document.querySelector('.lexical-content-editable');
  root.focus();
  const ps = [...root.querySelectorAll(':scope > p')];
  const el = ps[ps.length - 1];
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  document.dispatchEvent(new Event('selectionchange'));
})()`);
await wait(400);
check('con trỏ nằm trong vùng soạn', await js("document.activeElement?.classList.contains('lexical-content-editable')"));
await enter(); await type('## Tieu de thu'); await enter(); await type('- muc mot'); await wait(400);
check('gõ tắt "## "', await js("[...document.querySelectorAll('.lexical-content-editable h2')].some(h=>h.textContent.includes('Tieu de thu'))"));
check('gõ tắt "- "', await js("!!document.querySelector('.lexical-content-editable ul li')"));
console.log('      nội dung cuối bài:', JSON.stringify((await js("[...document.querySelectorAll('.lexical-content-editable > *')].slice(-3).map(e=>e.tagName+':'+e.textContent.slice(0,22)).join(' / ')")) || ''));

// Menu "/"
await enter(); await type('/');
await wait(700);
const slash = await js("(() => { const m=document.querySelector('.lexical-block-picker:not(.is-handle-menu)'); return m ? m.querySelectorAll('button').length : 0; })()");
check('menu "/" bung ra', slash >= 10, `${slash} khối`);
await type('bang'); await wait(500);
const slashFiltered = await js("(() => { const m=document.querySelector('.lexical-block-picker:not(.is-handle-menu)'); return m ? [...m.querySelectorAll('button')].map(b=>b.textContent.trim()).join(',') : 'mất'; })()");
check('menu "/" lọc được', slashFiltered === 'Bảng', slashFiltered);
// Enter để chọn mục đầu trong menu "/" -> phải chèn bảng mới
const tablesBefore = await js("document.querySelectorAll('.lexical-content-editable table').length");
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter' });
await wait(900);
const swal = await js("!!document.querySelector('.swal2-container')");
check('chọn khối từ menu "/" có tác dụng', swal, swal ? 'mở hộp thoại chọn số dòng/cột' : 'không phản ứng');
if (swal) { await js("document.querySelector('.swal2-cancel')?.click()"); await wait(400); }

// Tay kéo
// Phải cuộn khối vào tầm nhìn, nếu không chuột rê vào toạ độ ngoài màn hình
await js("[...document.querySelectorAll('.lexical-content-editable h2')][0]?.scrollIntoView({block:'center'})");
await wait(500);
const h2 = await js(`(() => { const el=[...document.querySelectorAll('.lexical-content-editable h2')][0]; if(!el) return null; const r=el.getBoundingClientRect(); const lh=parseFloat(getComputedStyle(el).lineHeight)||r.height; return {x:Math.round(r.x+40), y:Math.round(r.y+Math.min(lh,r.height)/2)}; })()`);
if (!WIDE) {
    check('màn hẹp: ẩn tay kéo (cố ý)', await js("!document.querySelector('.lexical-drag-handle')"));
} else if (h2) {
    await move(h2.x, h2.y);
    const align = await js(`(() => {
      const h=document.querySelector('.lexical-drag-handle'); const b=[...document.querySelectorAll('.lexical-content-editable h2')][0];
      if(!h||!b) return null;
      const hb=h.getBoundingClientRect(), bb=b.getBoundingClientRect();
      const lh=parseFloat(getComputedStyle(b).lineHeight)||bb.height;
      const dongDau = bb.top + Math.min(lh, bb.height)/2;   // canh theo dòng đầu
      return Math.round((hb.y+hb.height/2) - dongDau);
    })()`);
    check('tay kéo ⠿ hiện và canh đúng', align !== null && Math.abs(align) <= 2, `lệch ${align}px`);
    await clickSel('.lexical-drag-handle');
    await wait(500);
    check('bấm ⠿ ra menu có ô lọc', await js("!!document.querySelector('.lexical-block-picker.is-handle-menu .lexical-block-picker-filter')"));
    await move(h2.x + 260, h2.y + 140);
    const stay = await js(`(() => { const m=document.querySelector('.lexical-block-picker.is-handle-menu'); if(!m) return null; const b=m.getBoundingClientRect(); return {con:true, tran: b.top<0||b.bottom>window.innerHeight}; })()`);
    check('menu ⠿ không tắt khi rê chuột', !!stay?.con);
    check('menu ⠿ không tràn màn hình', stay ? !stay.tran : false);

    // Bấm chọn thật một khối, xem có áp dụng không
    await js(`(() => { const b=[...document.querySelectorAll('.lexical-block-picker.is-handle-menu .lexical-block-picker-list button')].find(x=>x.textContent.includes('Trích dẫn')); b && b.click(); })()`);
    await wait(700);
    check('chọn khối từ menu ⠿ có tác dụng', await js("!!document.querySelector('.lexical-content-editable blockquote')"), await js("document.querySelector('.lexical-content-editable blockquote')?.textContent?.slice(0,20) || 'không đổi'"));
    await js("document.body.click()"); await wait(300);
}

// Thanh định dạng nổi
await js("document.querySelector('.lexical-content-editable p').scrollIntoView({block:'center'})"); await wait(400);
await js(`(() => { const p=document.querySelector('.lexical-content-editable p'); const n=p.querySelector('span')?.firstChild||p.firstChild; const r=document.createRange(); r.setStart(n,0); r.setEnd(n,6); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); })()`);
await wait(800);
const float = await js(`(() => { const t=document.querySelector('.lexical-floating-toolbar'); if(!t) return null; const b=t.getBoundingClientRect(); return {nut:t.querySelectorAll('button').length, tran:b.top<0||b.bottom>window.innerHeight}; })()`);
check('bôi đen ra thanh định dạng', !!float, float ? `${float.nut} nút` : '');
check('thanh định dạng không tràn', float ? !float.tran : false);

// Dọn sạch mọi lớp phủ còn sót, nếu không cú chạm sẽ rơi vào lớp phủ chứ không vào bài
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape' });
await wait(500);
check('không còn lớp phủ che bài', await js("!document.querySelector('.swal2-container')"), await js("document.querySelector('.swal2-container') ? 'CÒN hộp thoại' : ''"));

// Ô sửa liên kết
await js("document.querySelector('.lexical-content-editable a').scrollIntoView({block:'center'})"); await wait(400);
await clickSel('.lexical-content-editable a');
await wait(700);
check('con trỏ trong link ra ô sửa', await js("!!document.querySelector('.lexical-link-bar')"), await js("document.querySelector('.lexical-link-bar .lexical-link-url')?.textContent || ''"));

// Menu ảnh
await js("document.querySelector('.lexical-content-editable img')?.scrollIntoView({block:'center'})"); await wait(400);
await clickSel('.lexical-content-editable img');
await wait(600);
const imgMenu = await js(`(() => { const m=document.querySelector('.lexical-image-context-menu'); if(!m) return null; const b=m.getBoundingClientRect(); const s=document.querySelector('.lexical-content-editable').getBoundingClientRect(); return {nut:m.querySelectorAll('button').length, biCat: b.top<s.top-2||b.bottom>s.bottom+2}; })()`);
check('bấm ảnh ra thanh canh ảnh', !!imgMenu, imgMenu ? `${imgMenu.nut} nút` : '');
check('thanh canh ảnh không bị cắt', imgMenu ? !imgMenu.biCat : false);

// Cuộn đáy
await js('window.scrollTo(0, document.body.scrollHeight)'); await wait(700);
const bottom = await js(`(() => { const nb=[...document.querySelectorAll('aside label')].find(l=>l.textContent.includes('Nổi bật')); const bar=[...document.querySelectorAll('div')].find(d=>d.className.includes('sticky')&&d.className.includes('bottom-0')); if(!nb||!bar) return null; return nb.getBoundingClientRect().bottom > bar.getBoundingClientRect().top; })()`);
check('thẻ cuối không bị thanh nút che', bottom === false);

const errs = await js('(window.__errs||[]).filter(e=>!/fetching programs|Network Error/i.test(e))');
check('không có lỗi JS', Array.isArray(errs) && errs.length === 0, (errs || []).slice(0, 2).join(' | '));

const expected = WIDE ? 26 : 22;
console.log(`\n  Tổng: ${pass} đạt, ${fail} hỏng — chạy ${pass + fail}/${expected} mục`);
if (pass + fail < expected) { console.log('  ⚠️  CÓ MỤC BỊ BỎ QUA, kết quả không đáng tin'); fail++; }
if (TOUCH && W < 500 && fail > 0) {
    console.log('  Ghi chú: ở chế độ cảm ứng, 3 mục chạm vào link/ảnh CHƯA KẾT LUẬN được là');
    console.log('           lỗi sản phẩm hay hạn chế của cách giả lập chạm. Thử riêng lẻ thì đạt.');
    console.log('           Cần mở trên máy tính bảng thật để chốt.');
}
console.log('');
await closeTab();
process.exit(fail > 0 ? 1 : 0);
