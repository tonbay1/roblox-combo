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
    # เตรียมไฟล์ผลลัพธ์ (ลบไฟล์เก่าของ session นี้ก่อน)
    success_file = f'validate_success_{session_id}.txt'
    failed_file = f'validate_false_{session_id}.txt'
    success_path = os.path.join(result_dir, success_file)
    failed_path = os.path.join(result_dir, failed_file)
    # เฉพาะรอบแรกของ session (ถ้า combos ที่ส่งมามีมากกว่า 1)
    if len(combos) > 1:
        if os.path.exists(success_path):
            os.remove(success_path)
        if os.path.exists(failed_path):
            os.remove(failed_path)
    # ถ้าไฟล์ยังไม่ถูกสร้าง ให้สร้างไฟล์เปล่า ๆ ไว้ก่อนเสมอ (กัน 404)
    if not os.path.exists(success_path):
        with open(success_path, 'a', encoding='utf-8') as f:
            pass
    if not os.path.exists(failed_path):
        with open(failed_path, 'a', encoding='utf-8') as f:
            pass

    for idx, combo in enumerate(combos, 1):
        parts = combo.strip().split(':')
        if len(parts) < 3:
            results.append({'idx': idx, 'combo': combo, 'status': 'invalid', 'reason': 'format'})
            with open(failed_path, 'a', encoding='utf-8') as f:
                f.write(combo + '\n')
            continue
        user, passwd, cookie = parts[0], parts[1], ':'.join(parts[2:])
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
                with open(success_path, 'a', encoding='utf-8') as f:
                    f.write(combo_line + '\n')
            else:
                results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
                with open(failed_path, 'a', encoding='utf-8') as f:
                    f.write(combo_line + '\n')
        except Exception as e:
            results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
            with open(failed_path, 'a', encoding='utf-8') as f:
                f.write(f'{user}:{passwd}:{cookie}\n')

    # DEBUG: print path for confirmation
    print('[DEBUG] Write success_file:', success_path)
    print('[DEBUG] Write failed_file:', failed_path)

    return jsonify({
        'results': results,
        'success_file': success_file,
        'failed_file': failed_file
    })

@app.route('/api/progress/<session_id>')
def progress(session_id):
    import os
    result_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'result'))
    success_file = os.path.join(result_dir, f'validate_success_{session_id}.txt')
    failed_file = os.path.join(result_dir, f'validate_false_{session_id}.txt')
    success, failed = 0, 0
    success_lines, failed_lines = [], []
    if os.path.exists(success_file):
        with open(success_file, 'r', encoding='utf-8') as f:
            success_lines = [line.strip() for line in f if line.strip()]
            success = len(success_lines)
    if os.path.exists(failed_file):
        with open(failed_file, 'r', encoding='utf-8') as f:
            failed_lines = [line.strip() for line in f if line.strip()]
            failed = len(failed_lines)
    # Estimate waiting: total = success + failed + waiting (if known)
    waiting = 0
    # Optionally, you can pass total combos count as query param
    total = request.args.get('total', type=int)
    if total is not None:
        waiting = max(0, total - (success + failed))
    return jsonify({
        'success': success,
        'failed': failed,
        'waiting': waiting,
        'success_lines': success_lines,
        'failed_lines': failed_lines
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)