# audibleUtils.py
import sys
import os
import audible
from pathlib import Path
import json
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g

env_path = Path(__file__).resolve().parent.parent.parent / '.env'

load_dotenv(dotenv_path=env_path)
# Load environment variables from .env file
port = os.environ.get('AUDIBLE_PORT', 5000)

app = Flask(__name__)

pending_input = None
client = None

def custom_captcha_callback(captcha_url):
    print(json.dumps({'type': 'captcha', 'url': captcha_url}))
    return get_user_input()

def custom_otp_callback():
    print(json.dumps({'type': 'otp'}))
    return get_user_input()

def custom_cvf_callback():
    print(json.dumps({'type': 'cvf'}))
    return get_user_input()

def custom_approval_callback():
    print(json.dumps({'type': 'approval'}))
    return get_user_input("Approval alert detected! Amazon sends you an email. Please press enter after you approve the notification.")

def get_user_input(prompt=""):
    response = input(prompt)
    return json.loads(response)['answer'] if response else None


@app.route('/auth', methods=['POST'])
def authenticate():
    global client 
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    email = data['email']
    password = data['password']
    country_code = data['countryCode']

    if not email or not password or not country_code:
        return jsonify({'success': False, 'error': 'Missing email, password, or countryCode'}), 400

    try:
        auth = audible.Authenticator.from_file(filename="./auth_data.json", password=password)
        auth.refresh_access_token()
        client = audible.Client(auth)
        return jsonify({'success': True, 'auth': f"{auth.device_info} With Access Token {auth.access_token} from file"})
    except Exception as e:
        print(json.dumps({"type": "message", "message": 'auth from file failed... Using OAuth'}))
        try:
            auth = audible.Authenticator.from_login(
                email,
                password,
                locale=country_code,
                with_username=False,
                captcha_callback=custom_captcha_callback,
                otp_callback=custom_otp_callback,
                cvf_callback=custom_cvf_callback,
                approval_callback=custom_approval_callback
            )
            auth.to_file(filename="./auth_data.json", encryption="json", password=password)
            auth.to_file()
            return jsonify({'success': True, 'auth': f"{auth.device_info} With Access Token {auth.access_token} from OAuth"})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})

# UTILITY: put data
@app.route('/put', methods=['PUT'])
def put():
    global client 
    if not client:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    url = data['url']
    params = data['params']
    if client:
        try:
            stats = client.put(url, params=params)
            return jsonify({'success': True, 'data': stats})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    else:
        return jsonify({'success': False, 'error': 'Not authenticated'})

# UTILITY: post data
@app.route('/post', methods=['POST'])
def post():
    global client 
    if not client:
        return jsonify({'success': False, 'error': 'Not authenticated'})
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    url = data['url']
    params = data['params']
    if client:
        try:
            client.post(url, params=params)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    else:
        return jsonify({'success': False, 'error': 'Not authenticated'})

# UTILITY: get data
@app.route('/get', methods=['GET'])
def get():
    global client 
    if not client:
        return jsonify({'success': False, 'error': 'Not authenticated'})

    url = request.args.get('url')
    params = json.loads(request.args.get('params', '{}'))

    if client:
        try:
            data = client.get(url, params=params)
            return jsonify({'success': True, 'data': data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    else:
        return jsonify({'success': False, 'error': 'Not authenticated or missing speed'})

@app.route('/input', methods=['POST'])
def handle_input():
    global pending_input
    data = request.get_json()
    answer = data.get('answer')
    pending_input = None
    return jsonify({'answer': answer})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
    exit()