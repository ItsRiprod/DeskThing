"""Functional tests for the Linux helper's frame handling.

The helper is a plain Python script, so its Tunnel class can be driven
directly against a fake socket. This exists because the heartbeat was once
implemented only on the device and macOS sides — the Linux and Windows
helpers silently ignored PING, so the device tore the link down every 15
seconds, forever. These tests make that regression impossible to reship.
"""
import importlib.util
import os
import struct
import threading
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
HELPER = os.path.join(HERE, '..', 'linux', 'btbridge')

FRAME = '>BIH'
OPEN, DATA, CLOSE, PING, PONG = 1, 2, 3, 4, 5


def load_helper():
    """Import the extension-less helper script as a module."""
    spec = importlib.util.spec_from_loader(
        'btbridge_linux',
        importlib.machinery.SourceFileLoader('btbridge_linux', HELPER))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class FakeSocket:
    """Minimal socket stand-in: scripted inbound bytes, captured outbound."""

    def __init__(self, inbound=b''):
        self.inbound = inbound
        self.sent = b''
        self.closed = False
        self._lock = threading.Lock()

    def recv(self, n):
        if not self.inbound:
            time.sleep(0.05)
            return b''  # EOF ends the pump
        chunk, self.inbound = self.inbound[:n], self.inbound[n:]
        return chunk

    def sendall(self, data):
        with self._lock:
            self.sent += data

    def shutdown(self, how):
        self.closed = True

    def close(self):
        self.closed = True


def frames_in(blob):
    """Parse a byte stream into (type, sid, payload) tuples."""
    out = []
    while len(blob) >= 7:
        t, sid, ln = struct.unpack(FRAME, blob[:7])
        if len(blob) < 7 + ln:
            break
        out.append((t, sid, blob[7:7 + ln]))
        blob = blob[7 + ln:]
    return out


class LinuxHelperHeartbeat(unittest.TestCase):
    def setUp(self):
        self.mod = load_helper()

    def test_ping_is_answered_with_pong(self):
        """The regression that broke Linux/Windows: PING must produce a PONG."""
        sock = FakeSocket(struct.pack(FRAME, PING, 0, 0))
        tunnel = self.mod.Tunnel(sock)
        tunnel.pump_rfcomm()
        replies = frames_in(sock.sent)
        self.assertIn(PONG, [t for t, _, _ in replies],
                      "helper did not answer PING with PONG — the device will "
                      "drop the link after 15s")

    def test_pong_refreshes_liveness(self):
        sock = FakeSocket(struct.pack(FRAME, PONG, 0, 0))
        tunnel = self.mod.Tunnel(sock)
        tunnel.last_pong = 0
        tunnel.pump_rfcomm()
        self.assertGreater(tunnel.last_pong, 0,
                           "receiving a PONG must refresh the liveness clock")

    def test_multiple_pings_each_get_a_pong(self):
        sock = FakeSocket(struct.pack(FRAME, PING, 0, 0) * 3)
        tunnel = self.mod.Tunnel(sock)
        tunnel.pump_rfcomm()
        pongs = [t for t, _, _ in frames_in(sock.sent) if t == PONG]
        self.assertEqual(len(pongs), 3)

    def test_heartbeat_pings_on_its_interval(self):
        self.mod.PING_INTERVAL_S = 0.05
        self.mod.PONG_DEADLINE_S = 10  # long enough not to trip during this test
        sock = FakeSocket()
        tunnel = self.mod.Tunnel(sock)
        t = threading.Thread(target=tunnel.heartbeat, daemon=True)
        t.start()
        time.sleep(0.3)
        tunnel.dead.set()
        t.join(timeout=2)
        pings = [ty for ty, _, _ in frames_in(sock.sent) if ty == PING]
        self.assertGreaterEqual(len(pings), 2,
                                "heartbeat is not sending PING on its interval")

    def test_heartbeat_closes_a_silent_link(self):
        """A peer that stops ponging must get torn down, not linger half-open."""
        self.mod.PING_INTERVAL_S = 0.05
        self.mod.PONG_DEADLINE_S = 0.2
        sock = FakeSocket()  # never pongs
        tunnel = self.mod.Tunnel(sock)
        t = threading.Thread(target=tunnel.heartbeat, daemon=True)
        t.start()
        t.join(timeout=5)
        self.assertTrue(tunnel.dead.is_set(),
                        "heartbeat did not mark a silent link dead")
        self.assertTrue(sock.closed,
                        "heartbeat did not shut the dead socket down")

    def test_unknown_frame_type_does_not_desync(self):
        """An unknown type must not consume the frames that follow it."""
        blob = (struct.pack(FRAME, 99, 0, 0)
                + struct.pack(FRAME, PING, 0, 0))
        sock = FakeSocket(blob)
        tunnel = self.mod.Tunnel(sock)
        tunnel.pump_rfcomm()
        pongs = [t for t, _, _ in frames_in(sock.sent) if t == PONG]
        self.assertEqual(len(pongs), 1,
                         "a PING following an unknown frame was lost")


if __name__ == '__main__':
    unittest.main()
