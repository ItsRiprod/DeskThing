"""Golden vectors for the tunnel frame protocol.

Every implementation (btmux.py on the device, btbridge.swift on mac,
bt_source/linux/btbridge, bt_source/win/btbridge.c) must agree on these
bytes. If a test here has to change, every helper has to change with it.
"""
import struct
import unittest

FRAME = '>BIH'  # type(1) streamID(4 BE) len(2 BE)
OPEN, DATA, CLOSE, PING, PONG = 1, 2, 3, 4, 5

# The device drops the link after this long without a PONG, and pings this
# often. Every computer-side helper MUST answer PING or the link cannot
# survive — this is not optional behavior.
PING_INTERVAL_S = 5
PONG_DEADLINE_S = 15


class FrameProtocol(unittest.TestCase):
    def test_header_is_seven_bytes(self):
        self.assertEqual(struct.calcsize(FRAME), 7)

    def test_open_frame_golden(self):
        self.assertEqual(struct.pack(FRAME, OPEN, 1, 0), b'\x01\x00\x00\x00\x01\x00\x00')

    def test_data_frame_golden(self):
        frame = struct.pack(FRAME, DATA, 0x01020304, 5) + b'hello'
        self.assertEqual(frame, b'\x02\x01\x02\x03\x04\x00\x05hello')

    def test_close_frame_golden(self):
        self.assertEqual(
            struct.pack(FRAME, CLOSE, 0xFFFFFFFF, 0), b'\x03\xff\xff\xff\xff\x00\x00')

    def test_ping_frame_golden(self):
        # Heartbeat frames carry no stream and no payload.
        self.assertEqual(struct.pack(FRAME, PING, 0, 0), b'\x04\x00\x00\x00\x00\x00\x00')

    def test_pong_frame_golden(self):
        self.assertEqual(struct.pack(FRAME, PONG, 0, 0), b'\x05\x00\x00\x00\x00\x00\x00')

    def test_heartbeat_deadline_allows_missed_pings(self):
        # The deadline must span more than one ping so a single dropped frame
        # doesn't tear down a healthy link.
        self.assertGreaterEqual(PONG_DEADLINE_S, 3 * PING_INTERVAL_S)

    def test_roundtrip(self):
        for t, sid, payload in [
            (OPEN, 1, b''),
            (DATA, 2 ** 32 - 1, b'x' * 660),
            (CLOSE, 42, b''),
        ]:
            frame = struct.pack(FRAME, t, sid, len(payload)) + payload
            rt, rsid, rlen = struct.unpack(FRAME, frame[:7])
            self.assertEqual((rt, rsid, rlen), (t, sid, len(payload)))
            self.assertEqual(frame[7:7 + rlen], payload)

    def test_max_payload_fits_mtu(self):
        # macOS caps the RFCOMM MTU at 667; header + payload must fit.
        CHUNK = 660
        self.assertLessEqual(struct.calcsize(FRAME) + CHUNK, 667)


class StreamReassembly(unittest.TestCase):
    """The receive side must handle frames split at arbitrary byte boundaries."""

    def drain(self, buf):
        frames = []
        while len(buf) >= 7:
            t, sid, ln = struct.unpack(FRAME, buf[:7])
            if len(buf) < 7 + ln:
                break
            frames.append((t, sid, buf[7:7 + ln]))
            buf = buf[7 + ln:]
        return frames, buf

    def test_split_frames_reassemble(self):
        stream = (
            struct.pack(FRAME, OPEN, 7, 0)
            + struct.pack(FRAME, DATA, 7, 3) + b'abc'
            + struct.pack(FRAME, CLOSE, 7, 0)
        )
        # Feed the byte stream one byte at a time.
        buf = b''
        collected = []
        for i in range(len(stream)):
            buf += stream[i:i + 1]
            frames, buf = self.drain(buf)
            collected.extend(frames)
        self.assertEqual(collected, [(OPEN, 7, b''), (DATA, 7, b'abc'), (CLOSE, 7, b'')])
        self.assertEqual(buf, b'')


if __name__ == '__main__':
    unittest.main()
