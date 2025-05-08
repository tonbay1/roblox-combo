window.comboSuccess = [];
window.comboFailed = [];

async function submitCombos() {
    const input = document.getElementById('combo-input').value.trim();
    if (!input) return;
    const combos = input.split('\n').map(l => l.trim()).filter(Boolean);
    // เตรียมตารางแสดงผลลัพธ์แบบเรียลไทม์
    let rows = '';
    window.comboSuccess = [];
    window.comboFailed = [];
    let statusArr = combos.map(() => 'waiting');
    let results = new Array(combos.length);
    let success = 0, failed = 0;

    // สร้างแถวตารางเริ่มต้น
    combos.forEach((combo, idx) => {
        let user = '', pass = '';
        let parts = combo.split(':');
        user = parts[0] || '';
        pass = parts[1] || '';
        let showCombo = `${user}:${pass}`;
        rows += `<tr id="row-${idx}"><td>${idx + 1}</td><td>${showCombo}</td><td id="status-${idx}"><span class="status-dot"></span></td></tr>`;
    });
    document.getElementById('table-body').innerHTML = rows;
    document.getElementById('table-summary').innerHTML = `<div class="summary">True: 0 | Failed: 0 | Waiting: ${combos.length}</div>`;

    // เช็คแต่ละ combo ทีละอันแบบ async
    await Promise.all(combos.map(async (combo, idx) => {
        // ส่งไปเช็คทีละอัน (สมมติ API รองรับ /api/validateCookies)
        let res = await fetch('/api/validateCookies', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({combos: [combo]})
        });
        let data = await res.json();
        let item = data[0];
        results[idx] = item;
        let dotClass = item.status === 'success' ? 'green' : 'red';
        let dot = `<span class="status-dot ${dotClass}"></span>`;
        // Render only user:pass in the table after checking
        let user = '', pass = '';
        let parts = item.combo.split(':');
        user = parts[0] || '';
        pass = parts[1] || '';
        let showCombo = `${user}:${pass}`;
        document.querySelector(`#row-${idx} td:nth-child(2)`).textContent = showCombo;
        document.getElementById('status-' + idx).innerHTML = dot;
        // รวม cookies กับ combo เสมอ (ถ้าไม่มี cookies ให้เว้นว่าง)
        let cookies = (item.cookies && item.cookies.trim()) ? item.cookies : (parts.slice(2).join(":") || '');
        let comboFull = user + ":" + pass + ":" + cookies;
        // อัปเดต success/failed
        if (item.status === 'success') {
            success++;
            window.comboSuccess.push({ combo: comboFull });
        } else {
            failed++;
            window.comboFailed.push({ combo: comboFull });
        }
        // อัปเดต summary
        document.getElementById('table-summary').innerHTML = `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: ${combos.length - (success + failed)}</div>`;
    }));

    // --- ไม่ต้องบันทึกไฟล์ผลลัพธ์จากฝั่ง JS แล้ว ---
    // ให้ validateCookies.py เป็นคนสร้างไฟล์ผลลัพธ์เท่านั้น
    // (JS ฝั่งนี้จะ read-only เฉพาะโหลดไฟล์มาแสดงหรือคัดลอก)
}

// โหลด combos จากไฟล์ (ผลลัพธ์ล่าสุด)
async function loadCombosFromFile(type) {
    let file = type === 'success' ? '/result/validate_success.txt' : '/result/validate_false.txt';
    let arr = [];
    try {
        const res = await fetch(file + '?t=' + Date.now());
        if (!res.ok) throw new Error('ไม่พบไฟล์ผลลัพธ์');
        const text = await res.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        arr = lines.map(line => ({ combo: line }));
    } catch (e) {
        alert('โหลดไฟล์ผลลัพธ์ไม่สำเร็จ: ' + e.message);
    }
    return arr;
}

// คัดลอก combos จากไฟล์ผลลัพธ์ล่าสุด
async function copyCombos(type) {
    // โหลดข้อมูลล่าสุดจากไฟล์ก่อนคัดลอก
    let arr = await loadCombosFromFile(type);
    let seen = new Set();
    let combos = arr.map(item => {
        let parts = item.combo.split(":");
        let user = parts[0] || '';
        let pass = parts[1] || '';
        let cookies = parts.slice(2).join(":");
        return cookies ? (user + ":" + pass + ":" + cookies) : (user + ":" + pass);
    }).map(line => line.trim()).filter(line => line && !seen.has(line) && seen.add(line));
    let text = combos.join('\n');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}



function doSplit() {
    const lines = document.getElementById('split-input').value.split('\n').map(l => l.trim()).filter(Boolean);
    let userpass = [], cookies = [];
    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length === 2) {
            userpass.push(line);
        } else if (parts.length === 1 && parts[0] !== '') {
            cookies.push(line);
        } else if (parts.length >= 3) {
            userpass.push(parts.slice(0,2).join(':'));
            cookies.push(parts.slice(2).join(':'));
        }
    }
    document.getElementById('split-cookies').value = cookies.join('\n');
    document.getElementById('split-userpass').value = userpass.join('\n');
}

function copySplit(type) {
    let val = '';
    if (type === 'cookies') val = document.getElementById('split-cookies').value;
    if (type === 'userpass') val = document.getElementById('split-userpass').value;
    if (val) {
        navigator.clipboard.writeText(val).then(() => {
            alert('คัดลอก'+(type==='cookies'?' Cookie':' Username:Password')+' แล้ว!');
        });
    } else {
        alert('ไม่มีข้อมูลให้คัดลอก');
    }
}

function showTab(tab) {
    const splitSec = document.getElementById('split-section');
    const checkSec = document.getElementById('check-section');
    const tabSplit = document.getElementById('tab-split');
    const tabCheck = document.getElementById('tab-check');
    if (tab === 'split') {
        splitSec.style.display = '';
        checkSec.style.display = 'none';
        tabSplit.classList.add('active');
        tabCheck.classList.remove('active');
    } else {
        splitSec.style.display = 'none';
        checkSec.style.display = '';
        tabSplit.classList.remove('active');
        tabCheck.classList.add('active');
    }
}
// ตั้งค่าหน้าเริ่มต้น
window.addEventListener('DOMContentLoaded', function() {
    showTab('check');
});

// เดิม
// ไม่ต้องใช้ loadCombosFromFile() ในการคัดลอกอีกต่อไป
// ฟังก์ชันนี้ยังคงใช้ได้หากต้องการโหลดผลลัพธ์จากไฟล์ใหม่จริงๆ
// แต่ copyCombos จะไม่เรียกใช้ฟังก์ชันนี้อีกต่อไป

function copyCombos(type) {
    // ใช้ข้อมูลใน memory ที่อัปเดตล่าสุดเท่านั้น
    let arr = type === 'success' ? window.comboSuccess : window.comboFailed;
    // ลบ duplicate และบรรทัดว่าง โดยใช้ user:pass:cookies (cookies ใช้จาก combo เดิมเท่านั้น)
    let seen = new Set();
    let combos = arr.map(item => {
        let parts = item.combo.split(":");
        let user = parts[0] || '';
        let pass = parts[1] || '';
        // cookies ใช้จาก combo เดิมเท่านั้น (slice(2).join(':'))
        let cookies = parts.slice(2).join(":");
        // ถ้ามี cookies จริง ให้ต่อ :cookies, ถ้าไม่มีให้เป็น user:pass
        return cookies ? (user + ":" + pass + ":" + cookies) : (user + ":" + pass);
    }).map(line => line.trim()).filter(line => line && !seen.has(line) && seen.add(line));
    let text = combos.join('\n');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}
