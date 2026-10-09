// Soát lỗi tĩnh toàn bộ mã nguồn: tìm những thứ mà mắt thường hay bỏ sót và
// E2E không bắt được (chữ Anh sót lại, trạng thái không có màu, ngày không
// format, dấu vết template…). Chạy: npm run soat
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = 'src';
const files = [];
(function walk(dir) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(path)) files.push(path);
    }
})(SRC);

const problems = [];
const add = (file, line, rule, detail) => problems.push({ file, line, rule, detail });

const RULES = [
    { rule: 'chữ Anh sót lại', re: /title: '(Action|Full Name|User name|Role|Created At|Id)'/, note: 'tiêu đề cột còn tiếng Anh' },
    { rule: 'tiêu đề template', re: /setPageTitle\('(Multi Column Table|Dashboard|Blank Page|Analytics)/, note: 'tên trang còn của template' },
    { rule: 'màu rời rạc', re: /\b(btn-info|btn-warning|btn-success|bg-info\b|badge bg-)/, note: 'dùng màu riêng thay vì StatusBadge' },
    { rule: 'ảnh mẫu template', re: /profile-\$\{[^}]*\}\.jpeg|user-profile\.jpeg|logo\.svg/, note: 'ảnh của template, sẽ 404' },
    { rule: 'console còn sót', re: /console\.log\(/, note: 'bỏ log trước khi chạy thật' },
    { rule: 'kiểu any', re: /:\s*any\b|as any\b/, note: 'thay bằng kiểu cụ thể hoặc unknown' },
    { rule: 'hàm trùng lặp', re: /const formatDate = |function formatDate\(/, note: 'đã có utils/formatDate dùng chung', skip: /utils\/formatDate/ },
    { rule: 'ngày chưa format', re: /\{(createdAt|updatedAt|dob|yearOfGrad)\}/, note: 'đưa qua formatDate' },
    { rule: 'bảng cũ', re: /mantine-datatable|from 'mantine/, note: 'đã thay bằng components/table/DataTable' },
];

for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // bỏ qua dòng chú thích
        for (const { rule, re, note, skip } of RULES) {
            if (skip && skip.test(file)) continue;
            if (re.test(line)) add(file, index + 1, rule, note);
        }
    });

    // Chữ trắng mà không có nền màu: phải xét CẢ chuỗi className, không dò theo dòng.
    // Bỏ qua mọi lớp có tiền tố dark:/hover:dark: vì nền tối đã gỡ.
    for (const match of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = (match[1] ?? match[2] ?? '').split(/\s+/);
        const bareWhite = classes.some((c) => /^text-white(-light)?$/.test(c));
        const hasBackground = classes.some((c) => /^bg-(?!white|transparent)/.test(c));
        if (bareWhite && !hasBackground) {
            const line = text.slice(0, match.index).split('\n').length;
            add(file, line, 'chữ trắng nền trắng', 'chữ trắng mà không có nền màu');
        }
    }

    // Bảng quá nhiều cột thì khó đọc
    const columnKeys = (text.match(/^\s*(key|accessor): '/gm) || []).length;
    if (columnKeys > 6 && /DataTable/.test(text)) add(file, 0, 'bảng nhiều cột', `${columnKeys} cột, cân nhắc gộp lại`);

    // Cột trạng thái phải dùng nhãn màu dùng chung
    if (/title: 'Trạng thái'/.test(text) && !/StatusBadge/.test(text)) add(file, 0, 'trạng thái không màu', 'dùng StatusBadge');
}

// Kiểm khai báo gói: dùng mà không khai, hoặc gói chạy thật lại nằm ở devDependencies
{
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
    const used = new Set();
    for (const file of files) {
        for (const m of readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
            const spec = m[1];
            if (spec.startsWith('.')) continue;
            used.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
        }
    }
    for (const name of [...used].sort()) {
        if (!declared.has(name)) add('package.json', 0, 'gói chưa khai', `${name}: code dùng nhưng không có trong package.json`);
        else if (pkg.devDependencies?.[name]) add('package.json', 0, 'gói sai chỗ', `${name}: chạy lúc runtime nhưng khai ở devDependencies`);
    }
}

const byRule = new Map();
for (const p of problems) byRule.set(p.rule, [...(byRule.get(p.rule) ?? []), p]);

console.log(`\n── Soát ${files.length} file ──`);
if (problems.length === 0) {
    console.log('  Không thấy vấn đề nào.\n');
    process.exit(0);
}
for (const [rule, list] of [...byRule.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ${rule} (${list.length}) — ${list[0].detail}`);
    for (const item of list.slice(0, 6)) console.log(`      ${item.file}${item.line ? ':' + item.line : ''}`);
    if (list.length > 6) console.log(`      … và ${list.length - 6} chỗ nữa`);
}
console.log(`\n  Tổng: ${problems.length} chỗ cần xem\n`);
process.exit(1);
