#!/usr/bin/env bash

set -eu

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 REACT_DIR [DEVICE_ID]"
    exit;
fi

REACT_DIR="$1"

if [ "$#" -ge 2 ]; then
	DEVICE_ID="$2"
else
	DEVICE_ID=""
fi

ADB_COMMAND="adb"

if [ ! -z "$DEVICE_ID" ]; then
	ADB_COMMAND="$ADB_COMMAND -s $DEVICE_ID"
fi

pushd $REACT_DIR
yarn build
popd

$ADB_COMMAND shell 'mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp'
$ADB_COMMAND shell 'rm -rf /tmp/webapp'
$ADB_COMMAND push "$REACT_DIR/build/" /tmp/webapp
$ADB_COMMAND shell 'mount --bind /tmp/webapp /usr/share/qt-superbird-app/webapp'
$ADB_COMMAND shell 'supervisorctl restart superbird'

adb shell 'mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp'
adb shell 'rm -rf /tmp/webapp'
adb push "build/" /tmp/webapp
adb shell 'mount --bind /tmp/webapp /usr/share/qt-superbird-app/webapp'
adb shell supervisorctl restart chromium

adb shell mount -o remount,rw /
adb shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig
adb shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/ # it's ok if this fails
adb shell rm -r /tmp/webapp-orig
adb push dist /usr/share/qt-superbird-app/webapp
adb shell supervisorctl restart chromium