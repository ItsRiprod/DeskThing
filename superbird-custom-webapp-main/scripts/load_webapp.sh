#!/usr/bin/env bash

set -eu

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 INPUT_DIR [DEVICE_ID]"
    exit;
fi

INPUT_DIR="$1"

if [ "$#" -ge 2 ]; then
	DEVICE_ID="$2"
else
	DEVICE_ID=""
fi

ADB_COMMAND="adb"

if [ ! -z "$DEVICE_ID" ]; then
	ADB_COMMAND="$ADB_COMMAND -s $DEVICE_ID"
fi

$ADB_COMMAND shell 'mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp'
$ADB_COMMAND shell 'rm -rf /tmp/webapp'
$ADB_COMMAND push "$INPUT_DIR" /tmp/webapp
$ADB_COMMAND shell 'mount --bind /tmp/webapp /usr/share/qt-superbird-app/webapp'
$ADB_COMMAND shell 'supervisorctl restart superbird'
