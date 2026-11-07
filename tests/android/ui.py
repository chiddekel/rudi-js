"""Small ADB accessibility driver; never clears app data or selects a device implicitly."""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

class Device:
    def __init__(self, serial):
        self.serial = serial

    def adb(self, *args):
        return subprocess.check_output(['adb', '-s', self.serial, *args], text=True)

    def nodes(self):
        self.adb('shell', 'uiautomator', 'dump', '/sdcard/rudi-e2e.xml')
        return list(ET.fromstring(self.adb('shell', 'cat', '/sdcard/rudi-e2e.xml')).iter('node'))

    def tap(self, label):
        matches = [n for n in self.nodes() if label in (n.get('text'), n.get('content-desc'))]
        if not matches:
            raise AssertionError('Target not found: ' + label)
        node = next((n for n in matches if n.get('clickable') == 'true'), matches[0])
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds')))
        assert x2 > x1 and y2 > y1, 'Target has no visible bounds: ' + label
        self.adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
        print('TAPPED', label, flush=True)

    def expect(self, text):
        labels = [n.get('text', '') + n.get('content-desc', '') for n in self.nodes()]
        assert any(text in label for label in labels), 'Missing text: ' + text
        print('PASS', text, flush=True)

if __name__ == '__main__':
    device = Device(sys.argv[1])
    if len(sys.argv) > 2:
        device.tap(sys.argv[2])
    else:
        for node in device.nodes():
            label = node.get('text') or node.get('content-desc')
            if label:
                print(repr(label), node.get('bounds'), node.get('clickable'))
