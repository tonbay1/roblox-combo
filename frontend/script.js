window.comboSuccess = [];
window.comboFailed = [];

async function submitCombos() {
    // สร้าง session id ใหม่ทุกครั้งที่เช็ค (uuid v4)
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    window.sessionId = uuidv4();
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
    // ส่ง combos ทั้งหมดไป backend ทีเดียว พร้อม session_id
    let res = await fetch('/api/validate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({combos, session_id: window.sessionId})
    });
    let data = await res.json();
    if (data.success_file) window.successFile = data.success_file;
    if (data.failed_file) window.failedFile = data.failedFile;
    rows = '';
    (data.results || []).forEach((item, idx) => {
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
async function loadCombosFromFile(type) {
    // type = 'success' or 'failed'
    let file = type === 'success' ? '/result/validate_success.txt' : '/result/validate_false.txt';
    let arr = [];
    try {
        const res = await fetch(file + '?t=' + Date.now()); // ป้องกัน cache
        if (!res.ok) throw new Error('ไม่พบไฟล์ผลลัพธ์');
        const text = await res.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        // แปลงทุกบรรทัดเป็น user:pass:cookie (ถ้าไม่มี cookie ให้เติมค่าว่าง)
        arr = lines.map(line => {
            let parts = line.split(":");
            let user = parts[0] || '';
            let pass = parts[1] || '';
            let cookie = parts.slice(2).join(":");
            return { combo: user + ":" + pass + ":" + (cookie ? cookie : "") };
        });
    } catch (e) {
        alert('โหลดไฟล์ผลลัพธ์ไม่สำเร็จ: ' + e.message);
    }
    if (type === 'success') window.comboSuccess = arr;
    else window.comboFailed = arr;
    return arr;
}

async function copyCombos(type) {
    // โหลดไฟล์ผลลัพธ์ของ session นี้เท่านั้น
    let file = type === 'success' ? window.successFile : window.failedFile;
    if (!file) {
        alert('ยังไม่มีผลลัพธ์สำหรับคัดลอก');
        return;
    }
    try {
        let res = await fetch(`/result/${file}`);
        if (!res.ok) throw new Error();
        let text = await res.text();
        if (text && text.trim()) {
            navigator.clipboard.writeText(text.trim()).then(() => {
                alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
            });
        } else {
            alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
        }
    } catch (e) {
        alert('ยังไม่มีผลลัพธ์สำหรับคัดลอก');
    }
}

