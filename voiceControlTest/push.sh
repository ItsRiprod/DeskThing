#!/bin/sh

adb shell mount -o remount,rw /
adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
adb shell rm -r /tmp/webapp-orig
adb push dist /usr/share/qt-superbird-app/webapp
adb shell supervisorctl restart chromium