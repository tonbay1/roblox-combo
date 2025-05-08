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
        // ส่งไปเช็คทีละอัน (สมมติ API รองรับ /api/validate/single)
        let res = await fetch('/api/validate', {
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
        // อัปเดต success/failed
        if (item.status === 'success') {
            success++;
            window.comboSuccess.push({ combo: item.combo, cookies: item.cookies || '' });
        } else {
            failed++;
            window.comboFailed.push({ combo: item.combo, cookies: item.cookies || '' });
        }
        // อัปเดต summary
        document.getElementById('table-summary').innerHTML = `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: ${combos.length - (success + failed)}</div>`;
    }));
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
function copyCombos(type) {
    let arr = type === 'success' ? window.comboSuccess : window.comboFailed;
    let text = arr.map(item => {
        // ดึง user:pass:cookies เสมอ (cookies อาจมี : ได้)
        let user = '', pass = '', cookies = '';
        if (item.combo) {
            let parts = item.combo.split(':');
            user = parts[0] || '';
            pass = parts[1] || '';
            cookies = parts.slice(2).join(':');
        }
        // ถ้ามี item.cookies ให้ใช้แทน cookies ที่แยกจาก combo
        if (item.cookies !== undefined && item.cookies !== null && item.cookies !== '') {
            cookies = item.cookies;
        }
        return `${user}:${pass}:${cookies}`;
    }).join('\n');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}
