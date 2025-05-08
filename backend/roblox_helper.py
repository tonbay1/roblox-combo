import requests
import html
from urllib.parse import unquote

class RobloxHelper:
    def __init__(self, cookie):
        self.session = requests.Session()
        self.cookie = cookie
        self.session.headers.update({
            'Cookie': f'.ROBLOSECURITY={self.cookie}',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.roblox.com/'
        })
        self.csrf_token = None

    def get_csrf(self):
        resp = self.session.get("https://www.roblox.com/home")
        value_csrf = html.unescape(resp.text.split('"csrf-token" data-token="')[1].split('"')[0])
        value_csrf = unquote(value_csrf)
        self.csrf_token = value_csrf
        self.session.headers["x-csrf-token"] = self.csrf_token

    def get_authenticated_user(self):
        url = 'https://users.roblox.com/v1/users/authenticated'
        resp = self.session.get(url)
        if resp.status_code == 200:
            user_data = resp.json()
            user_name = user_data.get('name')
            user_id = user_data.get('id')
            return user_id, user_name
        else:
            return None, None