"""Tests for the device-side pairing agent's parsing and state handling."""
import importlib.util
import json
import os
import sys
import tempfile
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
AGENT_PATH = os.path.join(HERE, '..', 'superbird', 'btagent.py')


def load_agent():
    spec = importlib.util.spec_from_file_location('btagent', AGENT_PATH)
    mod = importlib.util.module_from_spec(spec)
    mod_dir = tempfile.mkdtemp()
    # Keep the module from writing into /tmp of the machine running the tests.
    spec.loader.exec_module(mod)
    mod.STATE_PATH = os.path.join(mod_dir, 'pairing.json')
    return mod


class PasskeyParsing(unittest.TestCase):
    def setUp(self):
        self.agent = load_agent()

    def test_confirm_passkey_line(self):
        # Verbatim shape of the bluetoothctl prompt, ANSI codes stripped.
        line = '[agent] Confirm passkey 847913 (yes/no): '
        m = self.agent.RE_CONFIRM.search(line)
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1), '847913')

    def test_confirm_passkey_with_ansi_noise(self):
        line = '\x1b[0;94m[agent]\x1b[0m Confirm passkey 001234 (yes/no):'
        m = self.agent.RE_CONFIRM.search(line)
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1), '001234')

    def test_pairing_success_line(self):
        self.assertIsNotNone(self.agent.RE_PAIRED.search('Pairing successful'))
        self.assertIsNotNone(self.agent.RE_PAIRED.search('\tPaired: yes'))

    def test_pairing_failure_lines(self):
        for line in (
            'Failed to pair: org.bluez.Error.AuthenticationFailed',
            'Failed to pair: org.bluez.Error.AuthenticationCanceled',
            'Failed to pair: org.bluez.Error.AuthenticationRejected',
        ):
            self.assertIsNotNone(self.agent.RE_FAILED.search(line), line)

    def test_peer_address_extraction(self):
        line = '[NEW] Device FC:B2:14:97:FD:DC Edwards MacBook Pro'
        m = self.agent.RE_PEER.search(line)
        self.assertEqual(m.group(1), 'FC:B2:14:97:FD:DC')

    def test_ordinary_lines_do_not_trigger(self):
        for line in (
            'Agent registered',
            '[bluetooth]# ',
            'Discovery started',
            '[CHG] Device AA:BB:CC:DD:EE:FF RSSI: -60',
        ):
            self.assertIsNone(self.agent.RE_CONFIRM.search(line), line)
            self.assertIsNone(self.agent.RE_FAILED.search(line), line)


class StateLifecycle(unittest.TestCase):
    def setUp(self):
        self.agent = load_agent()

    def test_set_and_get_roundtrip(self):
        self.agent.set_state(active=True, passkey='123456', result=None, peer='AA:BB:CC:DD:EE:FF')
        state = self.agent.get_state()
        self.assertTrue(state['active'])
        self.assertEqual(state['passkey'], '123456')
        self.assertEqual(state['peer'], 'AA:BB:CC:DD:EE:FF')

    def test_state_persisted_to_disk(self):
        self.agent.set_state(active=True, passkey='654321', result=None, peer=None)
        with open(self.agent.STATE_PATH) as f:
            on_disk = json.load(f)
        self.assertEqual(on_disk['passkey'], '654321')

    def test_stale_state_expires(self):
        self.agent.set_state(active=True, passkey='111111', result=None, peer=None)
        with self.agent._lock:
            self.agent._state['ts'] = int(time.time()) - self.agent.STATE_TTL - 1
        state = self.agent.get_state()
        self.assertFalse(state['active'])
        self.assertIsNone(state['passkey'])


if __name__ == '__main__':
    unittest.main()
