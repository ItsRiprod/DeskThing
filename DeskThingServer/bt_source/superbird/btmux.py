#!/usr/bin/env python3
"""DeskThing Bluetooth mux (device side).

Listens on 127.0.0.1:<port> and tunnels every TCP connection over a single
RFCOMM channel to the Mac-side bridge, which reconnects each stream to the
DeskThing server. Frame: >BIH = type, stream id, len.
Types: 1=OPEN 2=DATA 3=CLOSE 4=PING 5=PONG.

The RFCOMM link is a real AF_BLUETOOTH socket bound to channel 3 — no
`rfcomm` binary and no /dev/rfcomm0 tty. The old tty approach leaked a
channel-3 binding after every session, so the next connect was refused
(-536870212) until the binding was cleared by hand; a socket has nothing to
leak and simply accepts the next connection.

PING/PONG is a liveness heartbeat: after a reboot a peer can hold a half-open
link that reads as connected but passes no data. A peer that stops ponging is
dead, so we drop the link and both ends reconnect cleanly.
"""
import asyncio, os, socket, struct, subprocess, sys, time

LISTEN_ADDR = '127.0.0.1'
LISTEN_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8891
RFCOMM_CHANNEL = 3
CHUNK = 660  # frame + 7-byte header stays within the 667-byte RFCOMM MTU


class Mux:
    def __init__(self, sock, loop):
        self.sock = sock
        self.loop = loop
        self.streams = {}
        self.next_id = 1
        self.wlock = asyncio.Lock()
        self.last_pong = time.time()

    async def send(self, t, sid, payload=b''):
        async with self.wlock:
            await self.loop.sock_sendall(
                self.sock, struct.pack('>BIH', t, sid, len(payload)) + payload)

    async def handle_local(self, r, w):
        # Read the first bytes before opening a tunnel stream so that a probe for
        # /__bt can be answered here, locally. The client uses that to tell whether
        # this port is served by the Bluetooth link or by USB adb-reverse: over USB
        # the request reaches the DeskThing server instead, which 404s.
        timed_out = False
        try:
            first = await asyncio.wait_for(r.read(CHUNK), timeout=5)
        except asyncio.TimeoutError:
            first, timed_out = b'', True
        except Exception:
            first = b''

        if not first and not timed_out:
            try:
                w.close()
            except Exception:
                pass
            return

        if first.startswith(b'GET /__bt'):
            body = b'{"transport":"bluetooth"}'
            w.write(b'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n'
                    b'Access-Control-Allow-Origin: *\r\nCache-Control: no-store\r\n'
                    b'Content-Length: ' + str(len(body)).encode() +
                    b'\r\nConnection: close\r\n\r\n' + body)
            try:
                await w.drain()
            except Exception:
                pass
            try:
                w.close()
            except Exception:
                pass
            return

        sid = self.next_id
        self.next_id += 1
        self.streams[sid] = w
        await self.send(1, sid)
        if first:
            await self.send(2, sid, first)
        try:
            while True:
                data = await r.read(CHUNK)
                if not data:
                    break
                await self.send(2, sid, data)
        except Exception:
            pass
        finally:
            if sid in self.streams:
                del self.streams[sid]
                try:
                    await self.send(3, sid)
                except Exception:
                    pass
            try:
                w.close()
            except Exception:
                pass

    async def pump_rfcomm(self):
        buf = b''
        while True:
            data = await self.loop.sock_recv(self.sock, 4096)
            if not data:
                raise ConnectionError('rfcomm closed by peer')
            buf += data
            while len(buf) >= 7:
                t, sid, ln = struct.unpack('>BIH', buf[:7])
                if len(buf) < 7 + ln:
                    break
                payload = buf[7:7 + ln]
                buf = buf[7 + ln:]
                if t == 4:  # PING -> answer so the Mac knows we are alive
                    await self.send(5, 0)
                    continue
                if t == 5:  # PONG from the Mac
                    self.last_pong = time.time()
                    continue
                w = self.streams.get(sid)
                if t == 2 and w is not None:
                    w.write(payload)
                    try:
                        await w.drain()
                    except Exception:
                        pass
                elif t == 3 and w is not None:
                    del self.streams[sid]
                    try:
                        w.close()
                    except Exception:
                        pass

    async def heartbeat(self):
        """Ping the Mac; if it stops ponging the link is dead — raise to end
        the session so we go back to accepting a fresh connection."""
        self.last_pong = time.time()
        while True:
            await asyncio.sleep(5)
            try:
                await self.send(4, 0)
            except Exception:
                raise ConnectionError('rfcomm write failed')
            if time.time() - self.last_pong > 15:
                raise ConnectionError('no pong from Mac in 15s')


async def session(conn):
    conn.setblocking(False)
    loop = asyncio.get_event_loop()
    mux = Mux(conn, loop)

    # Port 8891 may be held by adb reverse while USB is attached. Bind in a
    # concurrent task with retries so the rfcomm pump still notices a dead link
    # while we wait for the port to free up.
    state = {'server': None}

    async def binder():
        while state['server'] is None:
            try:
                state['server'] = await asyncio.start_server(
                    mux.handle_local, LISTEN_ADDR, LISTEN_PORT)
                print('mux: tunnel up, listening on %s:%d' % (LISTEN_ADDR, LISTEN_PORT), flush=True)
            except OSError:
                print('mux: port %d busy (USB active?), retrying in 10s' % LISTEN_PORT, flush=True)
                await asyncio.sleep(10)

    async def client_watchdog():
        # The on-device client (chromium) starts at boot, ~80s before the
        # Bluetooth link is up. Its websocket retries can wedge against a
        # server that was unreachable at boot and then not recover even once
        # the tunnel is healthy. If the tunnel has been up a while with no
        # client stream, the client is stuck — restart it once so it dials a
        # working tunnel fresh. A healthy client opens a stream in seconds, so
        # this only fires when something is actually wrong.
        while state['server'] is None:
            await asyncio.sleep(1)
        await asyncio.sleep(25)
        if not mux.streams:
            print('mux: no client stream 25s after tunnel up — restarting chromium', flush=True)
            subprocess.call(['supervisorctl', 'restart', 'chromium'],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    bind_task = asyncio.ensure_future(binder())
    wd_task = asyncio.ensure_future(client_watchdog())
    hb_task = asyncio.ensure_future(mux.heartbeat())
    pump_task = asyncio.ensure_future(mux.pump_rfcomm())
    try:
        done, _pending = await asyncio.wait(
            [pump_task, hb_task], return_when=asyncio.FIRST_EXCEPTION)
        for task in done:
            exc = task.exception()
            if exc:
                raise exc
    except (OSError, ConnectionError) as e:
        print('mux: rfcomm link closed (%s)' % e, flush=True)
    finally:
        for task in (hb_task, pump_task, bind_task, wd_task):
            task.cancel()
        if state['server'] is not None:
            state['server'].close()
        for w in list(mux.streams.values()):
            try:
                w.close()
            except Exception:
                pass
        mux.streams.clear()
        try:
            conn.close()
        except Exception:
            pass


def setup_radio():
    # One-time radio setup: power, connectable + discoverable, SPP record.
    # All idempotent; bluetoothd resets these at boot.
    for cmd in (['bluetoothctl', 'power', 'on'],
                ['hciconfig', 'hci0', 'piscan']):
        subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Advertise SPP on channel 3 so a scanning Mac can find the port. Only add
    # if missing — this service restarts and sdptool would register duplicates.
    try:
        have = subprocess.check_output(['sdptool', 'browse', 'local'],
                                       stderr=subprocess.DEVNULL).decode('utf-8', 'replace')
    except Exception:
        have = ''
    if 'Serial Port' not in have:
        subprocess.call(['sdptool', 'add', '--channel=%d' % RFCOMM_CHANNEL, 'SP'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    setup_radio()
    srv = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(('00:00:00:00:00:00', RFCOMM_CHANNEL))
    srv.listen(1)
    print('mux: listening on RFCOMM channel %d' % RFCOMM_CHANNEL, flush=True)
    while True:
        print('mux: waiting for Mac to connect rfcomm...', flush=True)
        try:
            conn, addr = srv.accept()
        except OSError as e:
            print('mux: accept failed (%r), retrying' % e, flush=True)
            time.sleep(1)
            continue
        print('mux: rfcomm connected from %s' % (addr,), flush=True)
        try:
            asyncio.run(session(conn))
        except Exception as e:
            print('mux: session error: %r' % e, flush=True)
        finally:
            try:
                conn.close()
            except Exception:
                pass


if __name__ == '__main__':
    main()
