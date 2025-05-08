from flask import Flask, request, jsonify, send_from_directory
from roblox_helper import RobloxHelper
import os

app = Flask(__name__)

# เพิ่มเติมสำหรับ serve ไฟล์ result
@app.route('/result/<filename>')
def serve_result_file(filename):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../account/result'))
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
def validate_combos():
    combos = request.json.get('combos', [])
    results = []
    for idx, combo in enumerate(combos, 1):
        parts = combo.strip().split(':')
        if len(parts) < 3:
            results.append({'idx': idx, 'combo': combo, 'status': 'invalid', 'reason': 'format'})
            continue
        user, passwd, cookie = parts[0], parts[1], ':'.join(parts[2:])
        helper = RobloxHelper(cookie)
        try:
            helper.get_csrf()
            user_id, user_name = helper.get_authenticated_user()
            if user_id:
                results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'success'})
            else:
                results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
        except Exception as e:
            results.append({'idx': idx, 'combo': f'{user}:{passwd}', 'status': 'failed'})
    return jsonify(results)

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)