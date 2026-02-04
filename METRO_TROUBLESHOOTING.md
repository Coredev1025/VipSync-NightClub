# "Unable to load script" – Metro connection fix

If you see **"Unable to load script"** on the Android app, the device cannot reach the Metro bundler. Do this:

## 1. Start Metro first

In one terminal:

```bash
npm start
```

Or with a specific port (e.g. 8085):

```bash
npx expo start --port 8085
```

Leave this running.

## 2. Run the Android app

In another terminal:

```bash
npm run android
```

If you started Metro with `--port 8085`, use:

```bash
npx expo run:android --port 8085
```

## 3. Physical device over USB

If the app is on a **physical device** (not emulator), forward the Metro port:

**Default port (8081):**
```bash
npm run android:reverse
```

**If using port 8085:**
```bash
npm run android:reverse:8085
```

Or run manually:
```bash
adb reverse tcp:8081 tcp:8081
# or
adb reverse tcp:8085 tcp:8085
```

## 4. Wi‑Fi (no USB)

If the device is on Wi‑Fi only, it must be on the **same network** as your computer, and Metro will use your machine’s IP. Shake the device → Dev menu → "Settings" → set "Debug server host" to `YOUR_COMPUTER_IP:8081` (or `:8085` if you use that port).

---

**Summary:** Start Metro, then run the app. For a USB device, run `npm run android:reverse` (or the 8085 variant) so the app can load the bundle.
