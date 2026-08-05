import Foundation
import IOBluetooth
import Network

// DeskThing Bluetooth bridge (Mac side).
// Connects to the Car Thing's RFCOMM channel 3 and demuxes tunneled TCP
// streams onto localhost:8891 (the DeskThing server).
// Frame: type(1) streamID(4 BE) len(2 BE) payload. 1=OPEN 2=DATA 3=CLOSE
// 4=PING 5=PONG. PING/PONG is a liveness heartbeat: after a device reboot the
// Mac can hold a half-open RFCOMM channel that reports connected but passes no
// data. A peer that stops ponging is dead, so we close the channel and let the
// reconnect loop re-establish it.
//
// Also serves a control API on 127.0.0.1:8899 for the DeskThing UI:
//   GET  /status                    transport + pairing snapshot
//   POST /preference {"preference"} pin traffic to bluetooth|usb
//   POST /discover                  start an inquiry for nearby devices
//   POST /pair {"address"}          pair with a device (numeric comparison;
//                                   the code appears in /status, the device
//                                   shows the same code on its screen)
//   POST /pair/reply {"accept"}     answer the numeric-comparison prompt
//   POST /unpair {"address"}        remove a stale bond
//   POST /device {"address"}        set the device this bridge connects to

let rfcommChannelID: UInt8 = 3
let targetHost = NWEndpoint.Host("127.0.0.1")
let targetPort = NWEndpoint.Port(rawValue: 8891)!
let controlPort = NWEndpoint.Port(rawValue: 8899)!

let prefURL = FileManager.default
  .homeDirectoryForCurrentUser
  .appendingPathComponent("Library/Application Support/deskthing/bt-transport.json")

func log(_ s: String) {
  let ts = ISO8601DateFormatter().string(from: Date())
  print("[\(ts)] \(s)")
  fflush(stdout)
}

/// The bundled adb when we run inside the app, else whatever PATH has.
let adbPath: String = {
  let bundled = URL(fileURLWithPath: Bundle.main.bundlePath)
    .deletingLastPathComponent().appendingPathComponent("adb").path
  if FileManager.default.isExecutableFile(atPath: bundled) { return bundled }
  let fallback = "/Applications/DeskThing.app/Contents/Resources/mac/adb"
  if FileManager.default.isExecutableFile(atPath: fallback) { return fallback }
  return "adb"
}()

@discardableResult
func adb(_ args: [String]) -> Int32 {
  let p = Process()
  if adbPath.contains("/") {
    p.executableURL = URL(fileURLWithPath: adbPath)
    p.arguments = args
  } else {
    p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    p.arguments = [adbPath] + args
  }
  p.standardOutput = FileHandle.nullDevice
  p.standardError = FileHandle.nullDevice
  do { try p.run() } catch { return -1 }
  p.waitUntilExit()
  return p.terminationStatus
}

func normalizeAddress(_ raw: String) -> String {
  return raw.replacingOccurrences(of: ":", with: "-").lowercased()
}

// MARK: - Shared state

enum Preference: String {
  case bluetooth
  case usb
}

/// Where a pairing attempt currently stands. `confirm` means both sides are
/// showing the same 6-digit code and the UI must call /pair/reply.
enum PairingStage: String {
  case idle
  case discovering
  case connecting
  case confirm
  case finishing
  case done
  case failed
}

struct FoundDevice {
  let address: String
  let name: String
}

final class State {
  static let shared = State()
  private let q = DispatchQueue(label: "bridge.prefs")
  private var _preference: Preference = .bluetooth
  private var _linkUp = false
  private var _deviceAddress: String? = nil
  private var _pairingStage: PairingStage = .idle
  private var _pairingCode: String? = nil
  private var _pairingError: String? = nil
  private var _found: [FoundDevice] = []

  var preference: Preference {
    get { q.sync { _preference } }
    set { q.sync { _preference = newValue } }
  }
  var linkUp: Bool {
    get { q.sync { _linkUp } }
    set { q.sync { _linkUp = newValue } }
  }
  var deviceAddress: String? {
    get { q.sync { _deviceAddress } }
    set { q.sync { _deviceAddress = newValue } }
  }
  var pairingStage: PairingStage {
    get { q.sync { _pairingStage } }
    set { q.sync { _pairingStage = newValue } }
  }
  var pairingCode: String? {
    get { q.sync { _pairingCode } }
    set { q.sync { _pairingCode = newValue } }
  }
  var pairingError: String? {
    get { q.sync { _pairingError } }
    set { q.sync { _pairingError = newValue } }
  }
  var found: [FoundDevice] {
    get { q.sync { _found } }
    set { q.sync { _found = newValue } }
  }

  /// The transport actually carrying data right now. Falling back to USB only
  /// counts if the cable is really there, otherwise nothing is connected.
  var activeTransport: String {
    if linkUp { return "bluetooth" }
    return adb(["get-state"]) == 0 ? "usb" : "none"
  }

  var paired: Bool {
    guard let addr = deviceAddress,
          let dev = IOBluetoothDevice(addressString: addr) else { return false }
    return dev.isPaired()
  }

  func load() {
    guard let data = try? Data(contentsOf: prefURL),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return }
    if let raw = obj["preference"] as? String, let p = Preference(rawValue: raw) {
      preference = p
    }
    if let addr = obj["deviceAddress"] as? String {
      deviceAddress = normalizeAddress(addr)
    }
    log("state loaded: preference=\(preference.rawValue) device=\(deviceAddress ?? "unset")")
  }

  func save() {
    var obj: [String: Any] = ["preference": preference.rawValue]
    if let addr = deviceAddress { obj["deviceAddress"] = addr }
    guard let data = try? JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted])
    else { return }
    try? FileManager.default.createDirectory(
      at: prefURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? data.write(to: prefURL)
  }
}

// MARK: - Transport priority

/// The device-side mux owns 127.0.0.1:8891 whenever it can, but `adb reverse`
/// binds the same port over USB — so whoever bound first used to win, arbitrarily.
/// Make it explicit instead: while Bluetooth is up, tear the USB reverse down so
/// the mux owns the port; when Bluetooth drops, restore it so the client keeps
/// working over the cable.
func preferBluetooth() {
  let rc = adb(["reverse", "--remove", "tcp:8891"])
  log("transport: bluetooth active (USB reverse removed, rc=\(rc))")
}

func fallBackToUSB() {
  let rc = adb(["reverse", "tcp:8891", "tcp:8891"])
  log(rc == 0
      ? "transport: USB active (adb reverse restored)"
      : "transport: USB unavailable (rc=\(rc)) — device likely unplugged")
}

// MARK: - Discovery

/// One inquiry at a time; results land in State.found. IOBluetooth delivers
/// the delegate callbacks on the main run loop, which main keeps servicing.
final class Discoverer: NSObject, IOBluetoothDeviceInquiryDelegate {
  static let shared = Discoverer()
  private var inquiry: IOBluetoothDeviceInquiry?

  func begin() {
    DispatchQueue.main.async {
      if self.inquiry != nil { return }
      State.shared.found = []
      State.shared.pairingStage = .discovering
      let inq = IOBluetoothDeviceInquiry(delegate: self)
      inq?.updateNewDeviceNames = true
      inq?.inquiryLength = 8
      self.inquiry = inq
      let rc = inq?.start() ?? kIOReturnError
      if rc != kIOReturnSuccess {
        log("discovery: could not start (\(rc))")
        self.inquiry = nil
        State.shared.pairingStage = .idle
      } else {
        log("discovery: inquiry started")
      }
    }
  }

  func deviceInquiryDeviceFound(_ sender: IOBluetoothDeviceInquiry!, device: IOBluetoothDevice!) {
    guard let addr = device.addressString else { return }
    let name = device.name ?? "Unknown device"
    var list = State.shared.found
    if !list.contains(where: { $0.address == addr }) {
      list.append(FoundDevice(address: addr, name: name))
      State.shared.found = list
      log("discovery: found \(name) [\(addr)]")
    }
  }

  func deviceInquiryComplete(_ sender: IOBluetoothDeviceInquiry!, error: IOReturn, aborted: Bool) {
    log("discovery: complete (\(State.shared.found.count) devices)")
    inquiry = nil
    if State.shared.pairingStage == .discovering {
      State.shared.pairingStage = .idle
    }
  }
}

// MARK: - Pairing

/// Computer-initiated pairing, the way the Car Thing originally worked: we ask,
/// the device's screen shows a 6-digit code, and the person confirms here. The
/// code surfaces through /status; the UI answers with /pair/reply.
final class Pairer: NSObject, IOBluetoothDevicePairDelegate {
  static let shared = Pairer()
  private var pair: IOBluetoothDevicePair?
  private var address: String?
  /// The radio-level outcome, once known. IOBluetoothDevicePair's deferred
  /// replyUserConfirmation never reaches the controller (verified with btmon:
  /// the reply command is simply never sent, and the exchange times out after
  /// 30s), so the numeric comparison is accepted inside the callback and the
  /// person's code check becomes the wizard's gate instead: Confirm completes
  /// the wizard, "doesn't match" unpairs on the spot.
  private var radioResult: IOReturn?
  private var userAccepted: Bool?

  func begin(address raw: String) {
    let addr = normalizeAddress(raw)
    DispatchQueue.main.async {
      if self.pair != nil {
        log("pairing: already in progress, ignoring")
        return
      }
      guard let dev = IOBluetoothDevice(addressString: addr) else {
        State.shared.pairingStage = .failed
        State.shared.pairingError = "bad address"
        return
      }
      // A stale half-bond makes macOS abort right after encryption, so clear
      // any existing record before pairing fresh.
      if dev.isPaired() { Unpairer.unpair(addr) }
      self.address = addr
      self.radioResult = nil
      self.userAccepted = nil
      State.shared.pairingStage = .connecting
      State.shared.pairingCode = nil
      State.shared.pairingError = nil
      guard let p = IOBluetoothDevicePair(device: dev) else {
        State.shared.pairingStage = .failed
        State.shared.pairingError = "could not create pairing"
        return
      }
      p.delegate = self
      self.pair = p
      let rc = p.start()
      if rc != kIOReturnSuccess {
        log("pairing: start failed (\(rc))")
        self.pair = nil
        State.shared.pairingStage = .failed
        State.shared.pairingError = "start failed (\(rc))"
      } else {
        log("pairing: started with \(addr)")
      }
    }
  }

  func reply(accept: Bool) {
    DispatchQueue.main.async {
      self.userAccepted = accept
      log("pairing: user replied \(accept ? "codes match" : "codes do not match")")
      if !accept {
        // The person says the codes differ: whatever the radio concluded,
        // this bond must not survive.
        self.pair?.stop()
        self.pair = nil
        if let addr = self.address { Unpairer.unpair(addr) }
        State.shared.pairingStage = .failed
        State.shared.pairingCode = nil
        State.shared.pairingError = "rejected"
        return
      }
      switch self.radioResult {
      case .some(kIOReturnSuccess):
        self.finalizeSuccess()
      case .none:
        // Radio still finishing; devicePairingFinished completes the wizard.
        State.shared.pairingStage = .finishing
      case .some:
        break // already reported failed
      }
    }
  }

  private func finalizeSuccess() {
    log("pairing: complete")
    State.shared.pairingStage = .done
    State.shared.pairingCode = nil
    if let addr = address {
      State.shared.deviceAddress = addr
      State.shared.save()
    }
  }

  func devicePairingUserConfirmationRequest(_ sender: Any!, numericValue: BluetoothNumericValue) {
    let code = String(format: "%06u", numericValue)
    log("pairing: confirm code \(code) (device is showing the same code)")
    State.shared.pairingCode = code
    State.shared.pairingStage = .confirm
    // Accept at the radio level now — the deferred reply path never delivers
    // (see radioResult above). The person's confirmation gates the wizard.
    (sender as? IOBluetoothDevicePair)?.replyUserConfirmation(true)
  }

  func devicePairingPINCodeRequest(_ sender: Any!) {
    // Legacy PIN pairing should not happen with SSP on both sides; refuse
    // rather than guess a PIN that the headless device can't display.
    log("pairing: unexpected legacy PIN request, aborting")
    (sender as? IOBluetoothDevicePair)?.stop()
    pair = nil
    State.shared.pairingStage = .failed
    State.shared.pairingError = "device requested legacy PIN pairing"
  }

  func devicePairingFinished(_ sender: Any!, error: IOReturn) {
    pair = nil
    radioResult = error
    if error == kIOReturnSuccess {
      log("pairing: radio bond established")
      switch userAccepted {
      case .some(true):
        finalizeSuccess()
      case .some(false):
        // Already rejected and unpaired in reply().
        break
      case .none:
        // Keep showing the code until the person answers; stage stays
        // confirm and reply() finishes the job.
        break
      }
    } else {
      log("pairing: failed (\(error))")
      State.shared.pairingStage = .failed
      State.shared.pairingError = "pairing failed (\(error))"
    }
  }
}

/// Bond removal uses the same private IOBluetooth selector blueutil relies on;
/// there is no public API. Failing quietly is fine — pairing fresh over a stale
/// bond is what this exists to prevent, and /status shows the outcome.
enum Unpairer {
  @discardableResult
  static func unpair(_ raw: String) -> Bool {
    let addr = normalizeAddress(raw)
    guard let dev = IOBluetoothDevice(addressString: addr) else { return false }
    guard dev.isPaired() else { return true }
    let sel = Selector(("remove"))
    guard dev.responds(to: sel) else {
      log("unpair: private remove selector unavailable")
      return false
    }
    dev.perform(sel)
    log("unpair: removed bond for \(addr)")
    return true
  }
}

// MARK: - Control API (consumed by the DeskThing server)

final class ControlServer {
  private var listener: NWListener?
  private let q = DispatchQueue(label: "bridge.control")

  func start() {
    let params = NWParameters.tcp
    params.allowLocalEndpointReuse = true
    params.requiredLocalEndpoint = NWEndpoint.hostPort(host: "127.0.0.1", port: controlPort)
    guard let l = try? NWListener(using: params) else {
      log("control: could not bind 127.0.0.1:\(controlPort)")
      return
    }
    listener = l
    l.newConnectionHandler = { [weak self] conn in self?.handle(conn) }
    l.start(queue: q)
    log("control: listening on 127.0.0.1:\(controlPort)")
  }

  private func handle(_ conn: NWConnection) {
    conn.start(queue: q)
    conn.receive(minimumIncompleteLength: 1, maximumLength: 16384) { data, _, _, _ in
      let req = String(data: data ?? Data(), encoding: .utf8) ?? ""
      let body = self.respond(to: req)
      let http = """
      HTTP/1.1 200 OK\r
      Content-Type: application/json\r
      Access-Control-Allow-Origin: *\r
      Access-Control-Allow-Methods: GET, POST, OPTIONS\r
      Access-Control-Allow-Headers: Content-Type\r
      Cache-Control: no-store\r
      Content-Length: \(body.utf8.count)\r
      Connection: close\r
      \r
      \(body)
      """
      conn.send(content: http.data(using: .utf8), completion: .contentProcessed { _ in
        conn.cancel()
      })
    }
  }

  private func jsonBody(_ request: String) -> [String: Any]? {
    guard let range = request.range(of: "\r\n\r\n") else { return nil }
    let json = String(request[range.upperBound...])
    guard let d = json.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
  }

  private func respond(to request: String) -> String {
    let s = State.shared

    if request.hasPrefix("POST /preference") {
      if let obj = jsonBody(request),
         let raw = obj["preference"] as? String,
         let p = Preference(rawValue: raw) {
        s.preference = p
        s.save()
        log("preference set to \(p.rawValue) by UI")
        // Apply immediately rather than waiting for the next reconnect cycle.
        if p == .usb {
          fallBackToUSB()
        } else if s.linkUp {
          preferBluetooth()
        }
      }
    } else if request.hasPrefix("POST /discover") {
      Discoverer.shared.begin()
    } else if request.hasPrefix("POST /pair/reply") {
      if let obj = jsonBody(request), let accept = obj["accept"] as? Bool {
        Pairer.shared.reply(accept: accept)
      }
    } else if request.hasPrefix("POST /pair") {
      if let obj = jsonBody(request), let addr = obj["address"] as? String {
        Pairer.shared.begin(address: addr)
      }
    } else if request.hasPrefix("POST /unpair") {
      if let obj = jsonBody(request), let addr = obj["address"] as? String {
        _ = Unpairer.unpair(addr)
        if normalizeAddress(addr) == s.deviceAddress {
          s.deviceAddress = nil
          s.save()
        }
      }
    } else if request.hasPrefix("POST /device") {
      if let obj = jsonBody(request), let addr = obj["address"] as? String {
        s.deviceAddress = normalizeAddress(addr)
        s.save()
        log("device address set to \(s.deviceAddress ?? "?") by UI")
      }
    }

    let foundJSON = s.found
      .map { "{\"address\":\"\($0.address)\",\"name\":\"\($0.name.replacingOccurrences(of: "\"", with: ""))\"}" }
      .joined(separator: ",")
    let code = s.pairingCode.map { "\"\($0)\"" } ?? "null"
    let err = s.pairingError.map { "\"\($0.replacingOccurrences(of: "\"", with: ""))\"" } ?? "null"
    let dev = s.deviceAddress.map { "\"\($0)\"" } ?? "null"

    return """
    {"preference":"\(s.preference.rawValue)","transport":"\(s.activeTransport)","linkUp":\(s.linkUp),\
    "deviceAddress":\(dev),"paired":\(s.paired),\
    "pairing":{"stage":"\(s.pairingStage.rawValue)","code":\(code),"error":\(err)},\
    "found":[\(foundJSON)]}
    """
  }
}

// MARK: - RFCOMM tunnel

final class Bridge: NSObject, IOBluetoothRFCOMMChannelDelegate {
  private var channel: IOBluetoothRFCOMMChannel?
  private var conns: [UInt32: NWConnection] = [:]
  private var rxBuf = Data()
  private let q = DispatchQueue(label: "bridge.state")
  // writeSync blocks while the RFCOMM link drains. It must never run on `q`,
  // or inbound frames can't be processed and both directions deadlock.
  private let writeQueue = DispatchQueue(label: "bridge.write")
  // The heartbeat runs on its own queue, never writeQueue: a half-open channel
  // can block writeSync there indefinitely, and the staleness check must still
  // fire to close the dead link.
  private let heartbeatQueue = DispatchQueue(label: "bridge.heartbeat")
  private var mtu: UInt16 = 990
  var closed = false
  private var opened = false
  private var lastPong = Date()
  private var heartbeatTimer: DispatchSourceTimer?

  func rfcommChannelOpenComplete(_ ch: IOBluetoothRFCOMMChannel, status error: IOReturn) {
    if error != kIOReturnSuccess {
      log("open failed: \(error)")
      q.sync { closed = true }
      return
    }
    channel = ch
    mtu = ch.getMTU()
    log("rfcomm open, mtu=\(mtu)")
    q.sync { opened = true }
    State.shared.linkUp = true
    preferBluetooth()
    startHeartbeat()
  }

  func isOpened() -> Bool { q.sync { opened } }

  // A half-open channel reports open but never delivers data and never fires
  // rfcommChannelClosed. Ping the device; if it stops answering, the link is
  // dead — close so the reconnect loop takes over.
  private func startHeartbeat() {
    q.sync { lastPong = Date() }
    let timer = DispatchSource.makeTimerSource(queue: heartbeatQueue)
    timer.schedule(deadline: .now() + 5, repeating: 5)
    timer.setEventHandler { [weak self] in
      guard let self = self else { return }
      let silent = Date().timeIntervalSince(self.q.sync { self.lastPong })
      if silent > 15 {
        log("heartbeat: no pong in \(Int(silent))s — link dead, closing")
        self.channel?.close()
        self.q.sync { self.closed = true }
        self.stopHeartbeat()
        return
      }
      // Enqueue the ping without blocking this queue on writeSync.
      self.sendFrame(4, 0, Data())
    }
    heartbeatTimer = timer
    timer.resume()
  }

  private func stopHeartbeat() {
    heartbeatTimer?.cancel()
    heartbeatTimer = nil
  }

  func rfcommChannelClosed(_ ch: IOBluetoothRFCOMMChannel) {
    log("rfcomm closed")
    stopHeartbeat()
    State.shared.linkUp = false
    fallBackToUSB()
    q.sync {
      for (_, c) in conns { c.cancel() }
      conns.removeAll()
      closed = true
    }
  }

  func rfcommChannelData(_ ch: IOBluetoothRFCOMMChannel, data: UnsafeMutableRawPointer, length: Int) {
    let chunk = Data(bytes: data, count: length)
    q.async {
      self.rxBuf.append(chunk)
      self.drainFrames()
    }
  }

  // Runs on q.
  private func drainFrames() {
    while rxBuf.count >= 7 {
      let t = rxBuf[rxBuf.startIndex]
      let sid = rxBuf.subdata(in: rxBuf.startIndex+1..<rxBuf.startIndex+5).withUnsafeBytes { $0.load(as: UInt32.self).bigEndian }
      let ln = Int(rxBuf.subdata(in: rxBuf.startIndex+5..<rxBuf.startIndex+7).withUnsafeBytes { $0.load(as: UInt16.self).bigEndian })
      guard rxBuf.count >= 7 + ln else { return }
      let payload = rxBuf.subdata(in: rxBuf.startIndex+7..<rxBuf.startIndex+7+ln)
      rxBuf.removeFirst(7 + ln)
      switch t {
      case 1: openStream(sid)
      case 2: conns[sid]?.send(content: payload, completion: .contentProcessed { _ in })
      case 3:
        conns[sid]?.cancel()
        conns.removeValue(forKey: sid)
      case 4: sendFrame(5, 0, Data())  // PING -> PONG
      case 5: lastPong = Date()        // PONG from device
      default:
        log("bad frame type \(t), resetting buffer")
        rxBuf.removeAll()
      }
    }
  }

  // Runs on q.
  private func openStream(_ sid: UInt32) {
    let conn = NWConnection(host: targetHost, port: targetPort, using: .tcp)
    conns[sid] = conn
    conn.stateUpdateHandler = { [weak self] state in
      switch state {
      case .failed, .cancelled:
        self?.q.async {
          if self?.conns.removeValue(forKey: sid) != nil {
            self?.sendFrame(3, sid, Data())
          }
        }
      case .ready:
        self?.receiveLoop(sid, conn)
      default: break
      }
    }
    conn.start(queue: q)
  }

  private func receiveLoop(_ sid: UInt32, _ conn: NWConnection) {
    conn.receive(minimumIncompleteLength: 1, maximumLength: 8192) { [weak self] data, _, isDone, _ in
      guard let self = self else { return }
      if isDone {
        self.q.async {
          if self.conns.removeValue(forKey: sid) != nil {
            self.sendFrame(3, sid, Data())
          }
        }
        return
      }
      guard let data = data, !data.isEmpty else {
        self.receiveLoop(sid, conn)
        return
      }
      // Push this batch onto the link, then resume reading only once it is
      // actually on the wire. That backpressure keeps a fast TCP source from
      // outrunning the much slower Bluetooth link.
      self.writeQueue.async {
        var off = 0
        while off < data.count {
          let n = min(data.count - off, Int(self.mtu) - 7)
          self.writeFrame(2, sid, data.subdata(in: off..<off+n))
          off += n
        }
        self.receiveLoop(sid, conn)
      }
    }
  }

  // Enqueue a frame for the link. Safe to call from any queue.
  private func sendFrame(_ t: UInt8, _ sid: UInt32, _ payload: Data) {
    writeQueue.async { self.writeFrame(t, sid, payload) }
  }

  // Must only run on writeQueue.
  private func writeFrame(_ t: UInt8, _ sid: UInt32, _ payload: Data) {
    guard let ch = channel else { return }
    var frame = Data([t])
    var sidBE = sid.bigEndian
    var lenBE = UInt16(payload.count).bigEndian
    withUnsafeBytes(of: &sidBE) { frame.append(contentsOf: $0) }
    withUnsafeBytes(of: &lenBE) { frame.append(contentsOf: $0) }
    frame.append(payload)
    frame.withUnsafeBytes { (p: UnsafeRawBufferPointer) in
      let m = UnsafeMutableRawPointer(mutating: p.baseAddress!)
      _ = ch.writeSync(m, length: UInt16(frame.count))
    }
  }

  func isClosed() -> Bool { q.sync { closed } }
}

// MARK: - Main

State.shared.load()

let control = ControlServer()
control.start()

// IOBluetooth's coordinator initializes lazily and waits on work scheduled to the
// main queue — including the Bluetooth permission check. Blocking the main thread
// while that happens deadlocks the process and suppresses the permission prompt,
// so the radio work runs on its own thread and main is left to service the queue.
// Discovery and pairing callbacks also arrive on the main run loop.
Thread.detachNewThread {
  runBridgeLoop()
}

RunLoop.main.run()

func runBridgeLoop() -> Never {
  log("bluetooth bridge loop up")

  while true {
    if State.shared.preference == .usb {
      // User pinned the cable. Keep the reverse in place and stay off the radio.
      if State.shared.linkUp { State.shared.linkUp = false }
      fallBackToUSB()
      Thread.sleep(forTimeInterval: 5)
      continue
    }

    // Stay off the radio while a pairing exchange is running — a page from us
    // mid-pairing can abort it.
    switch State.shared.pairingStage {
    case .discovering, .connecting, .confirm, .finishing:
      Thread.sleep(forTimeInterval: 1)
      continue
    default: break
    }

    guard let addr = State.shared.deviceAddress,
          let device = IOBluetoothDevice(addressString: addr) else {
      // No device chosen yet; wait for the UI to run the pairing flow.
      Thread.sleep(forTimeInterval: 3)
      continue
    }

    // Don't gate on device.isPaired() here: it false-negatives on modern
    // macOS even for a bonded device, which would strand the reconnect loop.
    // The pairingStage guard above already keeps us off the radio during an
    // active pairing; outside that, just attempt the open — if there is no
    // bond it fails harmlessly and we retry.
    let bridge = Bridge()
    var channel: IOBluetoothRFCOMMChannel?
    log("connecting to \(addr) rfcomm ch\(rfcommChannelID)...")
    // openRFCOMMChannelSync's return value is unreliable: it frequently reports
    // a failure (e.g. -536870212) while the channel actually opens a moment
    // later and rfcommChannelOpenComplete fires success. Treat the delegate as
    // the source of truth — wait briefly for it to report open or closed rather
    // than trusting the synchronous return, or the retry would reset a link
    // that is really coming up.
    _ = device.openRFCOMMChannelSync(&channel, withChannelID: rfcommChannelID, delegate: bridge)
    let deadline = Date().addingTimeInterval(8)
    while !bridge.isOpened() && !bridge.isClosed() && Date() < deadline {
      RunLoop.current.run(until: Date().addingTimeInterval(0.2))
    }

    if bridge.isOpened() {
      log("connected")
      while !bridge.isClosed() && State.shared.preference == .bluetooth {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
      }
      log("session ended")
      channel?.close()
      device.closeConnection()
      State.shared.linkUp = false
      Thread.sleep(forTimeInterval: 2)
    } else {
      log("connect did not open; device off/out of range? retrying in 10s")
      channel?.close()
      device.closeConnection()
      State.shared.linkUp = false
      // No Bluetooth link, so make sure the USB path is available if the cable is in.
      fallBackToUSB()
      Thread.sleep(forTimeInterval: 10)
    }
  }
}
