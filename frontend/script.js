async function submitCombos() {
    const input = document.getElementById('combo-input').value.trim();
    if (!input) return;
    const combos = input.split('\n').map(l => l.trim()).filter(Boolean);
    document.getElementById('result').innerHTML = 'กำลังตรวจสอบ...';
    const res = await fetch('/api/validate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({combos})
    });
    const data = await res.json();
    let html = '';
    let success = 0, failed = 0;
    data.forEach(item => {
        let dot = item.status === 'success'
            ? '<span class="status-dot green"></span>'
            : '<span class="status-dot red"></span>';
        if (item.status === 'success') success++;
        if (item.status === 'failed') failed++;
        html += `<div class="combo-row">${dot}<span class="combo-user">${item.combo}</span></div>`;
    });
    html += `<div class="summary">True: ${success} | Failed: ${failed} | Waiting: 0</div>`;
    document.getElementById('result').innerHTML = html;
}
