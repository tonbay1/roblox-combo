window.comboSuccess = [];
window.comboFailed = [];

async function submitCombos() {
    const input = document.getElementById('combo-input').value.trim();
    if (!input) return;
    const combos = input.split('\n').map(l => l.trim()).filter(Boolean);

    // Reset UI ก่อนส่ง
    document.getElementById('table-body').innerHTML = '';
    document.getElementById('table-summary').innerHTML = `<div class="summary">Loading...</div>`;

    try {
        // ส่ง combos ทั้งหมดใน 1 request เดียว
        let res = await fetch('/api/validateCookies', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({combos})
        });
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        let data = await res.json();

        // แสดงผลลัพธ์ในตาราง
        let rows = '';
        let success = 0, failed = 0;
        window.comboSuccess = [];
        window.comboFailed = [];
        data.forEach((item, idx) => {
            let user = '', pass = '';
            let parts = item.combo.split(':');
            user = parts[0] || '';
            pass = parts[1] || '';
            let showCombo = `${user}:${pass}`;
            let dotClass = item.status === 'success' ? 'green' : 'red';
            let dot = `<span class="status-dot ${dotClass}"></span>`;
            rows += `<tr id="row-${idx}"><td>${idx + 1}</td><td>${showCombo}</td><td id="status-${idx}">${dot}</td></tr>`;
            if (item.status === 'success') {
                success++;
                window.comboSuccess.push({ combo: item.combo, cookies: item.cookies || '' });
            } else {
                failed++;
                window.comboFailed.push({ combo: item.combo, cookies: item.cookies || '' });
            }
        });
        document.getElementById('table-body').innerHTML = rows;
        document.getElementById('table-summary').innerHTML = `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: 0</div>`;
    } catch (e) {
        document.getElementById('table-summary').innerHTML = `<div class="summary" style="color:red;">${e.message}</div>`;
    }
}


    // ส่ง combos ทั้งหมดใน 1 request เดียว
    let res = await fetch('/api/validateCookies', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({combos})
    });
    let data = await res.json();

    // แสดงผลลัพธ์ในตาราง
    let success = 0, failed = 0;
    window.comboSuccess = [];
    window.comboFailed = [];
    let rows = '';
    data.forEach((item, idx) => {
        let user = '', pass = '';
        let parts = item.combo.split(':');
        user = parts[0] || '';
        pass = parts[1] || '';
        let showCombo = `${user}:${pass}`;
        let dotClass = item.status === 'success' ? 'green' : 'red';
        let dot = `<span class="status-dot ${dotClass}"></span>`;
        rows += `<tr id="row-${idx}"><td>${idx + 1}</td><td>${showCombo}</td><td id="status-${idx}">${dot}</td></tr>`;
        if (item.status === 'success') {
            success++;
            window.comboSuccess.push({ combo: item.combo, cookies: item.cookies || '' });
        } else {
            failed++;
            window.comboFailed.push({ combo: item.combo, cookies: item.cookies || '' });
        }
    });
    document.getElementById('table-body').innerHTML = rows;
    document.getElementById('table-summary').innerHTML = `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: 0</div>`;



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
async function loadCombosFromFile(type) {
    // type = 'success' or 'failed'
    let file = type === 'success' ? '/result/validate_success.txt' : '/result/validate_false.txt';
    let arr = [];
    try {
        const res = await fetch(file + '?t=' + Date.now()); // ป้องกัน cache
        if (!res.ok) throw new Error('ไม่พบไฟล์ผลลัพธ์');
        const text = await res.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        arr = lines.map(line => ({ combo: line }));
    } catch (e) {
        alert('โหลดไฟล์ผลลัพธ์ไม่สำเร็จ: ' + e.message);
    }
    if (type === 'success') window.comboSuccess = arr;
    else window.comboFailed = arr;
    return arr;
}

async function copyCombos(type) {
    // โหลดข้อมูลล่าสุดจากไฟล์ก่อนคัดลอก
    await loadCombosFromFile(type);
    let arr = type === 'success' ? window.comboSuccess : window.comboFailed;
    let text = arr.map(item => item.combo).join('\n');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}
