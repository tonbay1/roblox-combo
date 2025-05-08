from flask import Flask, request, jsonify, send_from_directory
from roblox_helper import RobloxHelper
import os

app = Flask(__name__)

# เพิ่มเติมสำหรับ serve ไฟล์ result
@app.route('/result/<filename>')
def serve_result_file(filename):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'result'))
    return send_from_directory(base_dir, filename)

# Serve frontend static files
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

@app.route('/api/validate', methods=['POST'])
def validate():
    import time
    session_id = request.json.get('session_id')
    combos = request.json.get('combos', [])
    results = []
    success_lines = []
    failed_lines = []
    # ลบไฟล์เก่ากว่า 24 ชั่วโมง
    result_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'result'))
    os.makedirs(result_dir, exist_ok=True)  # สร้างโฟลเดอร์ถ้ายังไม่มี
    now = time.time()
    for fname in os.listdir(result_dir):
        fpath = os.path.join(result_dir, fname)
        if os.path.isfile(fpath):
            if now - os.path.getmtime(fpath) > 24*3600:
                os.remove(fpath)
    for idx, combo in enumerate(combos, 1):
        parts = combo.strip().split(':')
        if len(parts) < 3:
            results.append({'idx': idx, 'combo': combo, 'status': 'invalid', 'reason': 'format'})
            failed_lines.append(combo)
            continue
        user, passwd, cookie = parts[0], parts[1], ':'.join(parts[2:])
        # บังคับ prefix cookie ให้ถูกต้อง
        cookie = cookie.strip()
        prefix = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_'
        if not cookie.startswith(prefix):
            cookie = prefix + cookie
        helper = RobloxHelper(cookie)
        try:
            helper.get_csrf()
            user_id, user_name = helper.get_authenticated_user()
            combo_line = f'{user}:{passwd}:{cookie}'
            if user_id:
                results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'success'})
                success_lines.append(combo_line)
            else:
                results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
                failed_lines.append(combo_line)
        except Exception as e:
            results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
            failed_lines.append(f'{user}:{passwd}:{cookie}')

    # Debug log
    print('combos:', combos)
    print('success_lines:', success_lines)
    print('failed_lines:', failed_lines)

    # Save results to files (write mode, per session)
    result_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'result'))
    os.makedirs(result_dir, exist_ok=True)
    success_file = f'validate_success_{session_id}.txt'
    failed_file = f'validate_false_{session_id}.txt'
    with open(os.path.join(result_dir, success_file), 'w', encoding='utf-8') as f:
        for line in success_lines:
            f.write(line + '\n')
    with open(os.path.join(result_dir, failed_file), 'w', encoding='utf-8') as f:
        for line in failed_lines:
            f.write(line + '\n')

    # DEBUG: print path for confirmation
    print('Write success_file:', os.path.join(result_dir, success_file))
    print('Write failed_file:', os.path.join(result_dir, failed_file))

    return jsonify({
        'results': results,
        'success_file': success_file,
        'failed_file': failed_file
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)