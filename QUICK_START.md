# Quick Reference Card

## Start the System (3 Steps)

### 1️⃣ Terminal 1: Backend Server
```bash
cd backend && npm install && npm start
```
✅ Expect: `Server listening on http://localhost:8080`

### 2️⃣ Terminal 2: Frontend Dev
```bash
cd front-end && npm install && npm run dev
```
✅ Expect: `Local: http://localhost:5173/`

### 3️⃣ Browser (Open 2 Windows)
```
Window 1: http://localhost:5173/
Window 2: http://localhost:5173/
```

## Game Flow (4 Steps)

| Step | Action | Window 1 | Window 2 |
|------|--------|----------|----------|
| 1️⃣ | **Click "Connect"** | WAITING ✓ | WAITING ✓ |
| 2️⃣ | **Load ROM** | Upload .nes | Upload .nes |
| 3️⃣ | **Click "Start Game"** | Playing 🎮 | Playing 🎮 |
| 4️⃣ | **Play!** | Use controls | Use controls |

## Keyboard Controls

```
D-Pad:        Arrow Keys ↑↓←→
A Button:     Z
B Button:     X
X Button:     S
Y Button:     A
L Shoulder:   Q
R Shoulder:   W
Start:        Enter
Select:       Space
```

## Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| 🔴 CONNECTING | Trying to reach server | Wait or check URL |
| 🟡 WAITING | Both players connected, ready for ROM | Load ROM |
| 🟢 PLAYING | Game running | Play! |
| 🟠 PAUSED | Game paused | Resume or disconnect |
| ❌ DESYNC | Game states diverged | Reload page |

## File Locations

| File | Purpose |
|------|---------|
| `backend/server.js` | WebSocket relay server |
| `src/multiplayer.js` | Input sync logic |
| `src/useJsnesEmulator.js` | Emulator wrapper |
| `src/App.jsx` | Main React component |
| `MULTIPLAYER_DESIGN.md` | Full architecture doc |
| `SETUP_GUIDE.md` | Detailed guide |

## Network Timing

```
RTT 50ms  → Smooth (LAN)
RTT 100ms → Good (same region)
RTT 150ms → Playable (different region)
RTT 300ms → Noticeable lag (satellite)
```

## Troubleshooting Checklist

**Connection fails?**
- [ ] Backend running? (`npm start` in backend/)
- [ ] Port 8080 available? (`netstat -an | grep 8080`)
- [ ] Firewall blocking? (Allow localhost:8080)

**ROM won't load?**
- [ ] File is `.nes` format?
- [ ] File < 1MB?
- [ ] Try URL loading instead?

**Game stutters?**
- [ ] Normal with > 100ms latency
- [ ] Try LAN connection
- [ ] Check network with ping

**Desync error?**
- [ ] Both ROM files identical?
- [ ] Reload both clients
- [ ] Check browser console (F12)

## Console Debug Commands

Open DevTools (F12) and check Console:

```
// You should see:
✓ Connected to server
✓ Ready as p1
🚀 Game starting!
📥 Received remote input frame 0
✓ Checkpoint sent at frame 60

// If something's wrong:
❌ DESYNC DETECTED at frame 120
⚠️ Remote input timeout at frame 50
```

## Performance Tips

**Reduce input lag:**
```javascript
// In src/multiplayer.js
this.maxWaitFrames = 3;  // Default: 6
```

**Reduce network load:**
```javascript
// In src/multiplayer.js
this.checkpointInterval = 120;  // Default: 60
```

## Example Test Scenarios

### Test 1: Same Machine (Easy)
```
Browser Tab 1 → http://localhost:5173/
Browser Tab 2 → http://localhost:5173/
Result: Should be smooth, no latency
```

### Test 2: LAN (Good)
```
Machine 1 → http://localhost:5173/
Machine 2 → http://192.168.1.100:5173/
Result: Should be smooth, ~10-50ms latency
```

### Test 3: Internet (Fair)
```
Machine A → http://localhost:5173/
Machine B → http://<public-ip>:5173/
Result: Playable, ~100-150ms latency
```

## Message Flow (1 Frame)

```
Frame 0 Execution:

P1: Local input captured → send to server
Server: Relayed to P2
P2: Received input → add to buffer
P1: Waiting for P2's input...
P2: Local input captured → send to server
Server: Relayed to P1
P1: Received input → add to buffer
Both: Execute frame 0 with both inputs ✓

Result: Same game state on both clients
```

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Connection refused` | Start backend: `npm start` in backend/ |
| `WebSocket undefined` | Update browser (need 2016+) |
| `WAITING → never PLAYING` | Load ROM in both windows |
| `ROM load fails` | Try `.nes` file, not `.rom` |
| `Desync at frame 500` | Reload both clients, reconnect |
| `Keyboard not working` | Click game canvas first to focus |
| `Stutter/lag` | Normal - RTT is high, try LAN |

## Architecture Summary

```
┌────────────────────────────────────────┐
│ Two Deterministic jsnes Emulators      │
│ (same ROM = same output)               │
└────────────────────────────────────────┘
         ↓                          ↓
    Input Sync             Input Sync
   (Lockstep)             (Lockstep)
         ↓                          ↓
    P1 WebSocket ←→ Server ←→ P2 WebSocket
    (Input relay only)
```

## Next Steps

1. ✅ Install & start servers
2. ✅ Connect both clients
3. ✅ Load ROM files
4. ✅ Start playing
5. 📚 Read SETUP_GUIDE.md for advanced config
6. 📖 Read MULTIPLAYER_DESIGN.md for deep dive

---

**Questions?** Check:
- SETUP_GUIDE.md (Usage)
- MULTIPLAYER_DESIGN.md (Architecture)
- Browser Console (Logs)

**Happy Gaming! 🎮**
