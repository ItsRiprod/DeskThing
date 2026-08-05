#!/usr/bin/env python3
"""DeskThing Bluetooth pairing agent (device side).

Keeps a bluetoothctl session alive as the default pairing agent so the
computer can initiate pairing (the Car Thing flow: the computer asks, this
screen shows the code, the computer confirms). Parses bluetoothctl output
for the numeric-comparison passkey and serves pairing state on a tiny local
HTTP endpoint that the flashed client polls to draw the PIN overlay —
127.0.0.1:8892 works with zero connectivity, before any pairing exists.

The device side always auto-accepts: the human confirms on the computer,
and a headless device that refused silently would be indistinguishable
from a radio bug. Pairing exposure is bounded by bluetoothd's pairable
state, which this agent keeps on only while powered.

State file schema (also served at GET /pairing):
  {"active": bool, "passkey": "123456"|null, "result": "ok"|"failed"|null,
   "peer": "AA:BB:..."|null, "ts": unix_seconds}
"""
import json, os, re, socket, subprocess, threading, time

STATE_PATH = '/tmp/deskthing-bt-pairing.json'
HTTP_ADDR = ('127.0.0.1', 8892)
# A pairing exchange is short; anything older than this is stale UI.
STATE_TTL = 90

_lock = threading.Lock()
_state = {'active': False, 'passkey': None, 'result': None, 'peer': None, 'ts': 0}


def set_state(**kw):
    with _lock:
        _state.update(kw)
        _state['ts'] = int(time.time())
        try:
            with open(STATE_PATH, 'w') as f:
                json.dump(_state, f)
        except OSError:
            pass


def get_state():
    with _lock:
        s = dict(_state)
    if s['ts'] and time.time() - s['ts'] > STATE_TTL:
        s = {'active': False, 'passkey': None, 'result': None, 'peer': None, 'ts': s['ts']}
    return s


def http_server():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(HTTP_ADDR)
    srv.listen(4)
    while True:
        try:
            conn, _ = srv.accept()
            conn.settimeout(3)
            try:
                req = conn.recv(1024)
                if req.startswith(b'GET /pairing'):
                    body = json.dumps(get_state()).encode()
                    code = b'200 OK'
                else:
                    body = b'{}'
                    code = b'404 Not Found'
                conn.sendall(b'HTTP/1.1 ' + code +
                             b'\r\nContent-Type: application/json'
                             b'\r\nAccess-Control-Allow-Origin: *'
                             b'\r\nCache-Control: no-store'
                             b'\r\nContent-Length: ' + str(len(body)).encode() +
                             b'\r\nConnection: close\r\n\r\n' + body)
            finally:
                conn.close()
        except Exception:
            time.sleep(0.1)


# bluetoothctl output we react to. Lines arrive with ANSI color codes and
# prompt fragments, so match loosely anywhere in the line.
RE_CONFIRM = re.compile(r'Confirm passkey (\d{6})')
RE_PASSKEY = re.compile(r'Passkey:?\s*(\d{6})')
RE_AUTHORIZE = re.compile(r'Authorize service|Accept pairing')
RE_PAIRED = re.compile(r'Paired: yes|Pairing successful')
RE_FAILED = re.compile(r'Failed to pair|AuthenticationFailed|AuthenticationCanceled|AuthenticationRejected')
RE_PEER = re.compile(r'Device ((?:[0-9A-F]{2}:){5}[0-9A-F]{2})', re.I)


def agent_loop():
    while True:
        proc = subprocess.Popen(
            ['bluetoothctl'],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, bufsize=0)

        def send(cmd):
            try:
                proc.stdin.write((cmd + '\n').encode())
                proc.stdin.flush()
            except OSError:
                pass

        # DisplayYesNo: BlueZ hands us the numeric-comparison passkey to show,
        # and we answer yes here because the human confirms computer-side.
        send('agent DisplayYesNo')
        send('default-agent')
        send('pairable on')
        send('discoverable on')

        peer = None
        # bluetoothctl's agent prompts ("Confirm passkey NNNNNN (yes/no):")
        # do NOT end with a newline — they sit waiting for input. Reading
        # lines would block forever on exactly the event we exist to catch,
        # so read raw chunks and scan an accumulating tail instead.
        buf = ''
        try:
            while True:
                chunk = os.read(proc.stdout.fileno(), 4096)
                if not chunk:
                    break
                buf += chunk.decode('utf-8', 'replace')
                m = RE_PEER.search(buf)
                if m:
                    peer = m.group(1)
                m = RE_CONFIRM.search(buf) or RE_PASSKEY.search(buf)
                if m:
                    set_state(active=True, passkey=m.group(1), result=None, peer=peer)
                    # Answer after a beat, not instantly: replying within
                    # milliseconds races the initiator's own confirmation
                    # prompt setup (observed on macOS — its user prompt never
                    # surfaces and pairing dies with an unspecified HCI
                    # error). The delay also guarantees the code is on the
                    # device screen long enough for the person to compare it
                    # before either side completes the exchange.
                    threading.Timer(5.0, lambda: send('yes')).start()
                    buf = ''
                    continue
                if RE_AUTHORIZE.search(buf):
                    send('yes')
                    buf = ''
                    continue
                if RE_PAIRED.search(buf):
                    if get_state()['active']:
                        set_state(active=False, result='ok', peer=peer)
                        # Trust the newly paired peer so it can reconnect
                        # without re-authorization after every boot.
                        if peer:
                            send('trust ' + peer)
                    buf = ''
                    continue
                if RE_FAILED.search(buf):
                    set_state(active=False, passkey=None, result='failed', peer=peer)
                    buf = ''
                    continue
                # Bound the scan window; keep enough tail to complete a
                # pattern split across reads.
                if len(buf) > 8192:
                    buf = buf[-1024:]
        except Exception:
            pass
        finally:
            try:
                proc.kill()
            except Exception:
                pass
        print('agent: bluetoothctl exited, restarting in 3s', flush=True)
        time.sleep(3)


def main():
    set_state(active=False, passkey=None, result=None, peer=None)
    threading.Thread(target=http_server, daemon=True).start()
    print('agent: pairing agent up, state on %s:%d' % HTTP_ADDR, flush=True)
    agent_loop()


if __name__ == '__main__':
    main()
