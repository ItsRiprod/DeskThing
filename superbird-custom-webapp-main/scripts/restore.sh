#!/usr/bin/env bash

set -eu

if [ "$#" -ge 1 ]; then
	DEVICE_ID="$1"
else
	DEVICE_ID=""
fi

ADB_COMMAND="adb"

if [ ! -z "$DEVICE_ID" ]; then
	ADB_COMMAND="$ADB_COMMAND -s $DEVICE_ID"
fi

$ADB_COMMAND shell 'mountpoint /usr/share/qt-superbird-app/webapp/ > /dev/null && umount /usr/share/qt-superbird-app/webapp'
$ADB_COMMAND shell 'supervisorctl restart superbird'
