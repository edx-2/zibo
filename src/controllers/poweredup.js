import { ACTIONS } from '../engine/input.js';

// LEGO Wireless Protocol — Powered Up Remote (88010).
// Service UUID: 00001623-1212-efde-1623-785feabcd123
// Characteristic: 00001624-1212-efde-1623-785feabcd123
// Each port (0x00 = left, 0x01 = right) reports remote-button events in mode 0x00.
// Message: 0x05 0x00 0x45 <port> <value>  where value is +1 (plus), 0 (released), -1 (minus), 0x7F (red center).

const SERVICE_UUID = '00001623-1212-efde-1623-785feabcd123';
const CHAR_UUID = '00001624-1212-efde-1623-785feabcd123';

const VALUE_PLUS = 0x01;
const VALUE_MINUS = 0xFF; // -1 as uint8
const VALUE_RED = 0x7F;
const VALUE_RELEASE = 0x00;

export class PoweredUpController {
  constructor(input) {
    this.input = input;
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.connected = false;
    this.onStatus = null;
    // Track which abstract action is currently "held" by each side so we can
    // release the right one when the value returns to 0.
    this.leftHeld = null;
    this.rightHeld = null;
  }

  isAvailable() { return typeof navigator !== 'undefined' && !!navigator.bluetooth; }

  async connect() {
    if (!this.isAvailable()) throw new Error('Web Bluetooth not available');
    this.setStatus('connecting');
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
      // Some hubs advertise a battery service; allow it so we don't trigger an
      // implicit GATT cleanup post-discovery.
      optionalServices: ['battery_service', 'device_information']
    });
    this.device = device;
    device.addEventListener('gattserverdisconnected', () => this.handleDisconnect());
    const server = await device.gatt.connect();
    this.server = server;
    const service = await server.getPrimaryService(SERVICE_UUID);
    const char = await service.getCharacteristic(CHAR_UUID);
    this.characteristic = char;
    // Detect which write style the characteristic supports. The Powered Up hub
    // advertises both, but Web Bluetooth implementations sometimes time out the
    // GATT link when the response handshake is used at high frequency, which
    // looks like a "shortly after connecting" disconnect. Prefer write-without-
    // response when available.
    this.useNoResponse = !!(char.properties.writeWithoutResponse && char.writeValueWithoutResponse);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', (ev) => this.handlePacket(ev.target.value));
    // Tiny grace period — the hub's GATT server isn't always ready to accept
    // writes the instant `connect()` resolves.
    await this.delay(120);
    // Subscribe to remote button events on both ports (mode 0x00, delta 1, notifications enabled).
    await this.writeMessage(this.buildPortInputFormat(0x00));
    await this.delay(40);
    await this.writeMessage(this.buildPortInputFormat(0x01));
    // Subscribe to the green centre button on the hub itself (Hub Property 0x02).
    await this.delay(40);
    await this.writeMessage(this.buildHubPropertySubscribe(0x02));
    this.connected = true;
    this.setStatus('connected');
    try { localStorage.setItem('zibo.lastDeviceName', device.name || ''); } catch {}
    return true;
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  buildPortInputFormat(port) {
    // Header: length, hubId(0), msgType=0x41 (Port Input Format Setup),
    // port, mode=0x00, delta=01 00 00 00, notifyEnable=0x01.
    const m = [0x0A, 0x00, 0x41, port, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01];
    return Uint8Array.from(m);
  }

  buildHubPropertySubscribe(prop) {
    // length=5, hub=0, msg=0x01 (Hub Properties), prop, op=0x02 (enable updates).
    return Uint8Array.from([0x05, 0x00, 0x01, prop, 0x02]);
  }

  async writeMessage(bytes) {
    if (!this.characteristic) return;
    try {
      if (this.useNoResponse) await this.characteristic.writeValueWithoutResponse(bytes);
      else await this.characteristic.writeValue(bytes);
    } catch (e) {
      console.warn('PoweredUp write failed', e);
      // If write-without-response fails (e.g. browser still doesn't expose it),
      // fall back to the response-style write so we can at least try once.
      if (this.useNoResponse) {
        this.useNoResponse = false;
        try { await this.characteristic.writeValue(bytes); } catch (e2) { console.warn('fallback write failed', e2); }
      }
    }
  }

  handlePacket(dataView) {
    if (dataView.byteLength < 3) return;
    const msgType = dataView.getUint8(2);
    if (msgType === 0x45) {
      // Port Value Single — the thumb buttons.
      if (dataView.byteLength < 5) return;
      const port = dataView.getUint8(3);
      const value = dataView.getUint8(4);
      this.dispatchButton(port, value);
    } else if (msgType === 0x01) {
      // Hub Properties update — green centre button (prop 0x02, op 0x06).
      if (dataView.byteLength < 6) return;
      const prop = dataView.getUint8(3);
      const op = dataView.getUint8(4);
      const value = dataView.getUint8(5);
      if (prop === 0x02 && op === 0x06) {
        if (value) {
          this.input.press(ACTIONS.PAUSE);
          this.input.release(ACTIONS.PAUSE);
          this.input.press(ACTIONS.CONFIRM);
          this.input.release(ACTIONS.CONFIRM);
        }
      }
    } else if (msgType === 0x03) {
      // Hub Alert — log it so we can see if e.g. the battery is low.
      console.warn('PoweredUp hub alert', new Uint8Array(dataView.buffer));
    }
  }

  dispatchButton(port, value) {
    const isLeft = port === 0x00;
    const isRight = port === 0x01;
    if (value === VALUE_RELEASE) {
      if (isLeft && this.leftHeld) { this.input.release(this.leftHeld); this.leftHeld = null; }
      if (isRight && this.rightHeld) { this.input.release(this.rightHeld); this.rightHeld = null; }
      return;
    }
    if (value === VALUE_RED) {
      // Red center button: left = pause/confirm, right = action/use power-up.
      if (isLeft) { this.input.press(ACTIONS.PAUSE); this.input.release(ACTIONS.PAUSE); this.input.press(ACTIONS.CONFIRM); this.input.release(ACTIONS.CONFIRM); }
      if (isRight) { this.input.press(ACTIONS.ACTION); this.input.release(ACTIONS.ACTION); }
      return;
    }
    let action = null;
    if (isLeft) {
      if (value === VALUE_PLUS) action = ACTIONS.MOVE_RIGHT;
      else if (value === VALUE_MINUS) action = ACTIONS.MOVE_LEFT;
      if (action) {
        if (this.leftHeld && this.leftHeld !== action) this.input.release(this.leftHeld);
        this.leftHeld = action;
        this.input.press(action);
      }
    }
    if (isRight) {
      if (value === VALUE_PLUS) action = ACTIONS.JUMP;
      else if (value === VALUE_MINUS) action = ACTIONS.DOWN;
      if (action) {
        if (this.rightHeld && this.rightHeld !== action) this.input.release(this.rightHeld);
        this.rightHeld = action;
        this.input.press(action);
        if (action === ACTIONS.JUMP) this.input.press(ACTIONS.CONFIRM);
      }
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.setStatus('disconnected');
    this.input.reset();
  }

  setStatus(status) {
    this.status = status;
    if (this.onStatus) this.onStatus(status);
  }
}
