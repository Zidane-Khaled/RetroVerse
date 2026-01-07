# Setup & Usage Guide

## System Requirements

- Node.js 16+ (for backend server)
- Modern browser with WebSocket support (Chrome, Firefox, Safari, Edge)
- Two browser windows/tabs or two computers on same network

## Installation

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs the `ws` (WebSocket) library for the relay server.

### Step 2: Install Frontend Dependencies

```bash
cd front-end
npm install
```

This installs React, jsnes, and other frontend dependencies.

## Running the System

### Terminal 1: Start WebSocket Server

```bash
cd backend
npm start
```

Expected output:
```
🎮 jsnes Multiplayer Server starting on ws://localhost:8080
✅ Server listening on http://localhost:8080
```

**Keep this terminal open** - the server must stay running for the game to work.

### Terminal 2: Start Frontend Dev Server

```bash
cd front-end
npm run dev
```

Expected output:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 3: Open Game in Browser

Open **TWO** browser windows/tabs:
- **Player 1**: http://localhost:5173/
- **Player 2**: http://localhost:5173/ (or on another computer: `http://<your-ip>:5173/`)

## Game Workflow

### Setup Phase

```
┌─ Player 1 Window ─────┐     ┌─ Player 2 Window ─────┐
│ Status: CONNECTING    │     │ Status: CONNECTING    │
│ [Connect]             │     │ [Connect]             │
└───────────────────────┘     └───────────────────────┘
         │ Click Connect             │ Click Connect
         ▼                           ▼
      P1 → Server ← P2
         │ Server assigns P1 & P2
         │ Both get START signal
         ▼                           ▼
│ Status: WAITING       │     │ Status: WAITING       │
│ [Upload ROM]          │     │ [Upload ROM]          │
└───────────────────────┘     └───────────────────────┘
```

### Step-by-Step Instructions

#### 1. Connect to Server (Both Players)

In each browser window:
1. Click **"Connect"** button
2. Status should change from `CONNECTING` → `WAITING`
3. Both players should see `WAITING` status before proceeding

**If connection fails:**
- Check backend server is running
- Verify `ws://localhost:8080` in custom URL input
- Try refreshing the page

#### 2. Load a ROM (Both Players)

In each browser window:
1. Click **"Upload ROM"** to select a `.nes` file from your computer
   - OR click **"Load from URL"** and paste a ROM URL
   - Examples: Super Mario Bros, Contra, Duck Hunt, etc.
2. Wait for `✓ ROM loaded` message

**ROM Notes:**
- Must be `.nes` file format
- **Both players must load the SAME ROM file**
- ROM data is loaded into the emulator on the client side only
- Server never sees the ROM data

#### 3. Start the Game (Both Players)

In each browser window:
1. Click **"▶ Start Game"** button
2. Game starts at frame 0
3. Frame counter begins counting up
4. Each player can now control their assigned player

**During Game:**
- Use keyboard controls (see Controls section below)
- Frame counter shows game progress
- Red flag next to "Ready" indicates waiting for opponent's input
- Screen may appear to "stutter" if waiting for network inputs (normal!)

#### 4. Pause/Resume

- Click **"⏸ Pause"** to pause
- Click **"▶ Resume"** to continue (if implemented)

#### 5. Desync Handling

If `❌ Network Desynchronization` appears:
- Game has diverged (usually network issue, not emulation bug)
- Click **"Reload Game"** to restart
- Both players must reload and reconnect

## Keyboard Controls

Player 1 controls both players:

| Key | SNES Button | Notes |
|-----|-------------|-------|
| **Arrow Keys** | D-Pad | Movement |
| **Z** | A | Action button |
| **X** | B | Back/Cancel |
| **A** | Y | Secondary action |
| **S** | X | Jump/Power (varies by game) |
| **Q** | L | Shoulder L |
| **W** | R | Shoulder R |
| **Enter** | Start | Menu/Pause |
| **Space** | Select | Select button |

## Network Configuration

### Local Network (Same Room)

Default setup works great for LAN:
```
Computer 1: http://localhost:5173/
Computer 2: http://localhost:5173/ (if on same machine)
            http://<Computer-1-IP>:5173/ (if different machine)
```

To find your IP:
- **Windows**: Open PowerShell, run `ipconfig`, look for IPv4 Address
- **Mac/Linux**: Open Terminal, run `ifconfig` or `hostname -I`

Example:
```
Computer 1 IP: 192.168.1.100
Computer 2 connects to: http://192.168.1.100:5173/
```

### Remote Network (Different Locations)

1. Expose backend on port 8080:
   - If using router, forward port 8080 to your machine
   - Get your public IP from `whatismyipaddress.com`
   
2. Update custom WebSocket URL in Client 2:
   - Click "Custom Server URL"
   - Enter: `ws://<YOUR_PUBLIC_IP>:8080`

**Security Note:** This exposes your game to the internet - use VPN or firewall rules for production.

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- ✓ Backend server running on port 8080?
- ✓ Use `ws://localhost:8080` not `http://`
- ✓ Check firewall settings
- Solution: Restart backend server

**Error: "WebSocket is undefined"**
- Browser too old - use Chrome, Firefox, Safari, or Edge (2016+)
- Update your browser

**Player sees WAITING but opponent doesn't**
- One client didn't finish loading
- Both must reach WAITING status before loading ROM
- Refresh both pages and reconnect

### Gameplay Issues

**Game stutters or lags**
- Normal if network RTT > 100ms (input prediction kicks in)
- Stutter ≠ desync (game state is still synchronized)
- Try LAN connection for smoother experience

**Desync at frame X**
- ROM files different on each client?
- Emulator non-determinism (shouldn't happen with jsnes)
- Try reloading both clients
- Check browser console for errors

**ROM upload fails**
- File is `.nes` format? (not `.rom`, `.bin`, etc.)
- File < 1MB? (jsnes limitation)
- Browser allows file access? (security might block)
- Try loading from URL instead

**Keyboard input not working**
- Click on the game canvas first to focus
- Verify key bindings (see Controls section)
- Check browser console for key events
- Try different keys (Q, W, Z, X, etc.)

### Performance Tuning

If input lag is too high, edit `src/multiplayer.js`:

```javascript
// Reduce timeout to advance frames faster (more input lag if network bad)
this.maxWaitFrames = 3;  // Default 6

// Increase checkpoint interval to reduce network load
this.checkpointInterval = 120;  // Default 60
```

## Browser DevTools Debugging

### Console Logs

Open Browser DevTools (**F12** or **Cmd+Option+I**) to see:

```javascript
// Connection events
✓ Connected to server
✓ Ready as p1
🚀 Game starting!

// Input events (every frame)
📥 Received remote input frame 0
✓ Checkpoint sent at frame 60

// Desync events
❌ DESYNC DETECTED at frame 120
```

### Network Tab

Monitor WebSocket messages:
1. Open DevTools → **Network** tab
2. Filter by "WS" (WebSocket)
3. Click the WebSocket connection
4. See **Messages** sent/received
5. Each input packet shows frame number and buttons

Example WebSocket message:
```json
{
  "type": "input",
  "packet": {
    "frame": 42,
    "buttons": {"a": true, "b": false, ...},
    "timestamp": 1234567890123
  }
}
```

## Testing Scenarios

### Scenario 1: LAN Test (Best Case)

**Setup:**
- Both computers on same WiFi
- Latency: ~10-50ms

**Expected:**
- Minimal frame delay
- Smooth gameplay
- No stutter

### Scenario 2: WAN Test (Internet)

**Setup:**
- Computers in different regions
- Latency: 50-150ms

**Expected:**
- Visible input delay (normal!)
- Game still synchronized
- May see frame stutter while waiting

### Scenario 3: Weak Network Test

**Setup:**
- Add artificial delay: `tc qdisc add dev eth0 root netem delay 200ms`
- Or use network throttling in DevTools

**Expected:**
- Game continues but with noticeable delay
- Checkpoints may show desync (restart required)
- Input prediction keeps game playable

## Building for Production

### Build Frontend

```bash
cd front-end
npm run build
```

Outputs to `front-end/dist/` - upload to web server.

### Deploy Backend

```bash
# Install dependencies
npm install

# Run with environment variables
SERVER_PORT=8080 npm start
```

### Docker Deployment (Optional)

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js .
EXPOSE 8080
CMD ["node", "server.js"]
```

Build & run:
```bash
docker build -t jsnes-server .
docker run -p 8080:8080 jsnes-server
```

## FAQ

**Q: Can more than 2 players play?**
A: Current server supports 2 only. Adding 4+ player support requires:
- Redesign input buffer for N players
- Modify server to handle multiple pairs
- Add game state hashing for all players

**Q: What if one player disconnects?**
A: Other player sees "Opponent disconnected" message and game pauses. They can reload to play again.

**Q: Can we record gameplay?**
A: Not built-in, but easy to add:
- Record all input packets
- Replay by feeding inputs to emulator
- See `MULTIPLAYER_DESIGN.md` for details

**Q: Why do I see frame lag?**
A: This is **input prediction**, not desync:
- Remote player's input takes ~50ms to arrive
- Local player continues with predicted input
- When real input arrives, it's always correct
- Game state stays synchronized

**Q: Is it secure?**
A: For LAN, yes. For internet:
- Inputs are transmitted over WebSocket (unencrypted)
- Use `WSS://` (secure WebSocket) in production
- No authentication - anyone can join
- Add token-based auth in production

**Q: What if both players are on localhost?**
A: Open two browser windows at `http://localhost:5173/`:
- Tab 1 for Player 1
- Tab 2 for Player 2
- Both connect to `ws://localhost:8080`
- Works great for testing!

## Next Steps

1. **Test locally** with two browser windows
2. **Play with a friend** on LAN
3. **Add features**:
   - Spectator mode
   - Recording & replay
   - Leaderboards
   - Game library selector
4. **Optimize**:
   - Reduce input packet size
   - Add input buffering
   - Implement rollback (future)

---

**Have fun playing! 🎮**

If you find bugs or have suggestions, check `MULTIPLAYER_DESIGN.md` for architecture details.
