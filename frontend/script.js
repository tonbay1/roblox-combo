window.comboSuccess = [];
window.comboFailed = [];

async function submitCombos() {
    const input = document.getElementById('combo-input').value.trim();
    if (!input) return;
    const combos = input.split('\n').map(l => l.trim()).filter(Boolean);
    // Show loading
    document.getElementById('table-body').innerHTML = '<tr><td colspan="3">กำลังตรวจสอบ...</td></tr>';
    document.getElementById('table-summary').innerHTML = '';
    window.comboSuccess = [];
    window.comboFailed = [];
    const res = await fetch('/api/validate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({combos})
    });
    const data = await res.json();
    let rows = '';
    let success = 0, failed = 0;
    data.forEach((item, idx) => {
        let dot = `<td><span class="status-dot ${item.status === 'success' ? 'green' : 'red'}"></span></td>`;
        if (item.status === 'success') {
            success++;
            window.comboSuccess.push({
                combo: item.combo,
                cookies: item.cookies || ''
            });
        }
        if (item.status === 'failed') {
            failed++;
            window.comboFailed.push({
                combo: item.combo,
                cookies: item.cookies || ''
            });
        }
        rows += `<tr><td>${idx + 1}</td><td>${item.combo}</td><td>${dot}</td></tr>`;
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
function copyCombos(type) {
    let arr = type === 'success' ? window.comboSuccess : window.comboFailed;
    let text = arr.map(item => {
        return item.cookies ? `${item.combo}:${item.cookies}` : item.combo;
    }).join('\n');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}
