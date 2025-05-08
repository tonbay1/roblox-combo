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
        let dot = item.status === 'success'
            ? '<span class="status-dot green"></span>'
            : '<span class="status-dot red"></span>';
        if (item.status === 'success') {
            success++;
            window.comboSuccess.push(item.combo);
        }
        if (item.status === 'failed') {
            failed++;
            window.comboFailed.push(item.combo);
        }
        rows += `<tr><td>${idx + 1}</td><td>${item.combo}</td><td>${dot}</td></tr>`;
    });
    document.getElementById('table-body').innerHTML = rows;
    document.getElementById('table-summary').innerHTML = `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: 0</div>`;
}

function copyCombos(type) {
    let text = '';
    if (type === 'success') {
        text = window.comboSuccess.join('\n');
    } else if (type === 'failed') {
        text = window.comboFailed.join('\n');
    }
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('คัดลอกบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'แล้ว!');
        });
    } else {
        alert('ไม่มีบัญชี'+(type==='success'?'ที่ใช้ได้':'ที่ใช้ไม่ได้')+'ให้คัดลอก');
    }
}
