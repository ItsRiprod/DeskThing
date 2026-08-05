# Connecting a Car Thing over Bluetooth

DeskThing can talk to a Spotify Car Thing over Bluetooth instead of a USB data
cable. After a one-time setup the device needs **only power** — plug it into any
USB charger, and it reconnects to your computer on its own every time it powers
up.

> **Platform support.** The Bluetooth transport ships for macOS, Linux, and
> Windows. macOS is the most heavily tested today; on any platform without a
> bundled helper the Bluetooth options simply don't appear and USB keeps working
> exactly as before.

---

## What you need

- A Car Thing already flashed with DeskThing and working over USB.
- The USB cable — **for first-time setup only**. After that it's just power.
- Your computer's Bluetooth turned on.

---

## First-time setup

This is done once per device, over USB.

### 1. Install the Bluetooth service on the device

1. Connect the Car Thing to your computer with the USB cable.
2. Open DeskThing → **Setup Device** → **Bluetooth**.
3. Under **First-time Setup (USB)**, click **Find Devices**, then click
   **Set up Bluetooth** next to your Car Thing.

You'll see a checklist run — installing the service, enabling the radio, and
reading the device's Bluetooth address. When it finishes it says *"Device is
ready — now pair it above."*

### 2. Pair the device

Pairing works just like it did on the original Car Thing: your computer asks to
connect, the Car Thing's screen shows a 6-digit code, and you confirm that the
codes match.

1. In the **Pair with a Car Thing** section, click **Scan for devices**.
2. When your Car Thing appears, click **Pair** next to it.
3. A **6-digit code appears on the Car Thing's screen** and in DeskThing.
   Check that they match, then click **The codes match — Pair**.

> **On macOS**, your computer may show its own system "Bluetooth Pairing
> Request" instead. That's expected — confirm it there, and check the code
> matches the one on the Car Thing's screen. (macOS's built-in pairing dialog is
> the reliable way to confirm on a Mac.)

The first time the helper runs, macOS also asks for **Bluetooth permission for
DeskThing** — click **Allow**. Until you do, the helper waits and USB keeps
working.

That's it. Once paired, the device remembers your computer.

### 3. Go wireless

Unplug the USB cable and plug the Car Thing into any USB power adapter
(a **USB-A** charger — a USB-C-to-C cable delivers no power to this device).
Within a minute it connects over Bluetooth and your music appears, no cable.

---

## Everyday use

- **Just add power.** A paired Car Thing reconnects by itself whenever it powers
  up and is in range. Nothing to click.
- **You'll know it's on Bluetooth.** DeskThing's top bar shows a blue
  **Bluetooth** chip while the wireless link is carrying data, and the Car
  Thing's screen shows a small **BT** badge in the corner (a **USB** badge when
  it's on the cable).
- **Prefer one link.** Open **Clients → your device → Connection Type** to see
  which link is active and to pin **Bluetooth** or **USB**. Bluetooth is used
  automatically whenever it's available and falls back to USB if you plug the
  cable back in.

---

## Good to know

- **Speed.** The Bluetooth link runs at about 155 KB/s. That's plenty for
  playback control and album art (DeskThing already sends compressed updates and
  smaller artwork over it), but large transfers are slower than USB. If you're
  doing something bandwidth-heavy, pin USB.
- **Range.** Standard Bluetooth range — same room / desk works best; thick walls
  will drop it, and it reconnects when back in range.
- **The cable still works.** USB is always available as a fallback and for
  first-time setup. Bluetooth never removes that.

---

## Troubleshooting

**The Car Thing won't connect over Bluetooth.**
Make sure it's actually powered — this device has no battery, so "not
connecting" is usually "not powered." Use a **USB-A** charger; a C-to-C cable
provides no power. Give it up to a minute after powering on to boot and
reconnect.

**macOS never asked for Bluetooth permission / the helper seems stuck.**
Quit and reopen DeskThing so the permission prompt reappears, and click
**Allow**. This can happen after an app update, because the permission is tied
to the exact app.

**Pairing failed, or the codes didn't match.**
In the Bluetooth setup page, click **Unpair this device**, then pair again from
scratch. If your Mac shows a stale "Car Thing" entry, you can also remove it in
**System Settings → Bluetooth** and re-pair.

**It connected but the screen is stuck / blank after a reboot.**
Give it a moment — the device reconnects and the screen refreshes on its own
within a couple of minutes of powering up. If it stays stuck, power-cycle the
Car Thing once more.

**I want to go back to USB only.**
Open **Clients → your device → Connection Type** and pin **USB**, or just keep
the cable plugged in. To remove the pairing entirely, use **Unpair this device**
on the Bluetooth setup page.

---

*Developer/architecture notes (frame protocol, control API, adding a platform)
live in [`DeskThingServer/bt_source/README.md`](../DeskThingServer/bt_source/README.md).*
