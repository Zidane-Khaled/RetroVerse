# System Architecture Diagrams

## 1. Overall System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        JSNES MULTIPLAYER SYSTEM                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│   PLAYER 1 CLIENT       │     │   PLAYER 2 CLIENT       │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │  React App        │  │     │  │  React App        │  │
│  │  - UI Components  │  │     │  │  - UI Components  │  │
│  │  - State mgmt     │  │     │  │  - State mgmt     │  │
│  └────────────┬──────┘  │     │  └────────────┬──────┘  │
│               │         │     │               │         │
│  ┌────────────▼──────┐  │     │  ┌────────────▼──────┐  │
│  │ Input Handler     │  │     │  │ Input Handler     │  │
│  │ - Keyboard        │  │     │  │ - Keyboard        │  │
│  │ - State capture   │  │     │  │ - State capture   │  │
│  └────────────┬──────┘  │     │  └────────────┬──────┘  │
│               │         │     │               │         │
│  ┌────────────▼──────────────────────────────────────┐  │
│  │     MultiplayerSync (Input Synchronization)      │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ InputBuffer (Local)                          │ │  │
│  │  │ - Stores own inputs per frame                │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ InputBuffer (Remote)                         │ │  │
│  │  │ - Stores opponent inputs per frame           │ │  │
│  │  │ - Prediction on delay                        │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Frame Coordination                           │ │  │
│  │  │ - canAdvanceFrame()                          │ │  │
│  │  │ - advanceFrame()                             │ │  │
│  │  │ - Lockstep synchronization                   │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Checkpoint System                            │ │  │
│  │  │ - sendCheckpoint(hash)                       │ │  │
│  │  │ - detectDesync()                             │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────┬──────────────────────────────────────┘  │
│               │         │     │               │         │
│  ┌────────────▼──────┐  │     │  ┌────────────▼──────┐  │
│  │ jsnes Emulator    │  │     │  │ jsnes Emulator    │  │
│  │ - CPU/PPU state   │  │     │  │ - CPU/PPU state   │  │
│  │ - Frame execution │  │     │  │ - Frame execution │  │
│  │ - Canvas render   │  │     │  │ - Canvas render   │  │
│  └────────────┬──────┘  │     │  └────────────┬──────┘  │
│               │         │     │               │         │
│               └────────────┬──────────────────┘         │
└────────────────────────────┼──────────────────────────────┘
                            │ WebSocket
                            │ (TCP-based)
                            │
                    ┌───────▼────────┐
                    │   SERVER       │
                    │ Port 8080      │
                    │                │
                    │ Input Relay:   │
                    │  P1 → P2       │
                    │  P2 → P1       │
                    │                │
                    │ Checkpoint     │
                    │ Relay          │
                    │                │
                    │ Connection     │
                    │ Management     │
                    └────────────────┘
```

## 2. Frame Execution Timeline

```
FRAME 0 EXECUTION SEQUENCE

    P1 Timeline              Network              P2 Timeline
    ───────────              ───────              ───────────

T=0ms: Capture input
       [a: true]
       │
       ├→ Send to server
       │   "Frame 0, A pressed"
       │   │
       │   ├──────────────────→ T=50ms
       │   │                   Server receives
       │   │                   & relays
       │   │                   │
       │   │                   ├──────────────→ T=100ms
       │   │                                   Received!
       │   │
       │   │ (Meanwhile on P2)
       │   │                      T=0ms
       │   │                      Capture input
       │   │                      [b: true]
       │   │                      │
       │   │                      ├→ Send to server
       │   │                      │   "Frame 0, B pressed"
       │   │                      │   │
       │   │                      │   ├──────→ T=50ms
       │   │                      │           Server relays
       │   │                      │           │
       │   │                      │           ├──→ T=100ms
       │   │                                      P1 received!

T=100ms (Frame 0 execution on P1):
        Wait: Remote input available? ✓
        Inputs: P1.A=true, P2.B=true
        Execute: nes.frame() with both
        Result: Frame 0 state = XYZ

T=100ms (Frame 0 execution on P2):
        Wait: Remote input available? ✓
        Inputs: P1.A=true, P2.B=true
        Execute: nes.frame() with both
        Result: Frame 0 state = XYZ ✓ MATCH!

T=116ms (Frame 1)
       Both advance to frame 1...
```

## 3. Input Buffer State Machine

```
                    ┌─────────────────────────┐
                    │  FRAME_INITIALIZING     │
                    │  Frame N starting       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────────────────┐
                    │ Check: Have remote     │
                    │ input for frame N?     │
                    └────────────┬───────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
    ┌───────────────────────┐        ┌──────────────────────┐
    │ HAVE REAL INPUT       │        │ WAITING FOR INPUT    │
    │ (remote arrived)      │        │ (network delay)      │
    └───────────┬───────────┘        └──────────┬───────────┘
                │                               │
                │ frameWaitCount = 0            │ frameWaitCount++
                │                               │
                ├───────────────┬───────────────┤
                │               │               │
                ▼               │               │ Wait count > 6?
    ┌──────────────────┐        │               │
    │ EXECUTE_FRAME    │        │               ▼
    │ Use real inputs  │        │      ┌──────────────────┐
    │ from both sides  │        │      │ TIMEOUT          │
    │                  │        │      │ Use prediction   │
    └────────┬─────────┘        │      └────────┬─────────┘
             │                  │               │
             └──────────┬───────┴───────────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │ FRAME_EXECUTING     │
            │ Call nes.frame()    │
            │                     │
            │ State changes       │
            └────────┬────────────┘
                     │
                     ▼
            ┌─────────────────────┐
            │ CHECKPOINT CHECK    │
            │ Every 60 frames:    │
            │ Compute hash        │
            │ Compare with remote │
            │ If mismatch →       │
            │ DESYNC EVENT        │
            └────────┬────────────┘
                     │
                     ▼
            ┌─────────────────────┐
            │ FRAME_COMPLETE      │
            │ frameCounter++      │
            │ Next: Frame N+1     │
            └────────┬────────────┘
                     │
                     ▼
            (Repeat for frame N+1)
```

## 4. Network Message Flow (Per Frame)

```
PLAYER 1                           SERVER                         PLAYER 2
────────                           ──────                         ────────

Frame 0 starts
Input captured: {a: true}
         │
         ├─ JSON encode ─────────→
         │  {"type": "input",
         │   "packet": {...}}
         │
         │                    Received
         │                        │
         │                        ├─→ JSON decode
         │                        │
         │                        ├─→ Validate format
         │                        │
         │                        ├─→ Send to P2
         │                        │   (same format)
         │                        │
         │                        │      ────────→
         │                        │              Received
         │                        │                  │
         │                        │                  ├─ JSON decode
         │                        │                  │
         │                        │                  ├─ Store in InputBuffer
         │                        │                  │
         │                        │                  ├─ Notify sync layer
         │                        │                  │
         │                        │                  └─ isReady(0) = true

(Meanwhile)

Input captured: {b: true}
         │
         │                                              Same flow for P2

         │
         │←───────────────────────────────────────────[P2 input arrives]
         │

Both clients: Check canAdvanceFrame() → true
Both clients: getInputForFrame(0) → {local, remote}
Both clients: Execute Frame 0 with both inputs
Both clients: Emulator state now identical ✓
```

## 5. Desync Detection Sequence

```
Frame 0                    Frame 60
─────────                  ────────

   P1                         P1
  Frame 0                    Frame 60
  Execute                    Execute
    │                          │
    ├─ Run emulator            ├─ Run emulator
    │  CPU: pc=0x8000          │  CPU: pc=0x???
    │  RAM: xxxx...            │  RAM: xxxx...
    │  PPU: status=0x24        │  PPU: status=0x??
    │                          │
    ├─ Every 60 frames:        └─ Compute hash
    │  Compute hash              Hash: "abc123"
    │  Hash: "abc123"                │
    │                               ├─ Send checkpoint packet
    │                               │  {"frame": 60,
    │                               │   "stateHash": "abc123"}
    │                               │
    │                               ▼
    │                            Server
    │                            (relay)
    │                               │
    │                               └────→
    │                                     P2
    │                                   Frame 60
    │                                   Execute
    │                                     │
    │                                     ├─ Run emulator
    │                                     │  (different state!)
    │                                     │  CPU: pc=0x???
    │                                     │  RAM: xxxx...
    │                                     │  PPU: status=0x??
    │                                     │
    │                                     └─ Compute hash
    │                                       Hash: "xyz789"
    │
    │ (P2's checkpoint arrives at P1)
    │←──────────────────────────────────
    │  {frame: 60, hash: "xyz789"}
    │
    ├─ Compare: "abc123" vs "xyz789"
    │  ❌ MISMATCH!
    │
    └─ DESYNC DETECTED
       Event fired
       Game paused
       User notified
```

## 6. Component Dependency Graph

```
App.jsx
├── useInput()
│   └── Returns: input handlers
│
├── useJsnesEmulator()
│   ├── Uses: jsnes library
│   ├── Uses: requestAnimationFrame
│   └── Returns: emulator hooks
│
├── MultiplayerSync (instantiated)
│   ├── Uses: InputBuffer (2 instances)
│   ├── Uses: WebSocket
│   └── Manages: Frame sync, desync detection
│
└── Manages:
    ├── Connection state (connecting/waiting/playing/paused/desync)
    ├── ROM loading
    ├── Game lifecycle
    └── UI rendering
```

## 7. State Flow

```
                    ┌─────────────┐
                    │  Startup    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────┐
                    │ CONNECTING          │
                    │ Attempting WS conn  │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │ Success       │ Failure       │
              │               │ (Retry)       │
              ▼               └───────────────┘
        ┌─────────────┐
        │ WAITING     │
        │ Both ready? │
        │ ROM loaded? │
        └──────┬──────┘
               │
        ┌──────▼──────────┐
        │ User clicks     │
        │ "Start Game"    │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ PLAYING         │
        │ Emulation loop  │
        │ Frame sync      │
        └──────┬──────────┘
               │
        ┌──────┴──────────┐
        │                 │
    ┌───▼───┐        ┌────▼─────┐
    │ PAUSE │        │ DESYNC   │
    │(click)│        │(hash err)│
    └───┬───┘        └────┬─────┘
        │                 │
        │             ┌───▼───────┐
        │             │ Error msg  │
        │             │ [Reload]   │
        └─────────────┤           │
                      │ Restart   │
                      └─────┬─────┘
                            │
                      ┌─────▼──────┐
                      │ CONNECTING │
                      │ (New conn) │
                      └────────────┘
```

## 8. Data Flow: One Complete Frame

```
1. INPUT CAPTURE
   ┌─ P1 keyboard event (user pressed Z)
   │  └─ useInput handler → {a: true, ...}
   │     └─ App state updated
   │        └─ MultiplayerSync.sendLocalInput(state)
   │           └─ JSON encode & WebSocket.send()
   └─→ Server

2. SERVER RELAY
   ┌─ Server.ws.onmessage(packet)
   │  └─ Parse JSON
   │     └─ Route to other player
   │        └─ WebSocket.send(otherPlayer)
   └─→ P2

3. INPUT RECEPTION
   ┌─ P2 WebSocket.onmessage(packet)
   │  └─ Parse JSON
   │     └─ MultiplayerSync receives
   │        └─ InputBuffer.addInput(frame, buttons)
   │           └─ remoteInputBuffer.set(0, {a: true, ...})
   └─→ P2 Sync ready for frame exec

4. SYNC CHECK
   ┌─ useJsnesEmulator emulationLoop()
   │  └─ MultiplayerSync.canAdvanceFrame()
   │     ├─ remoteInputBuffer.isReady(frameCounter)?
   │     │  Yes: Return true
   │     │  No: Check timeout → return true after 6 frames
   │     └─ Return: bool
   └─→ Decision: Execute or wait?

5. INPUT RETRIEVAL
   ┌─ MultiplayerSync.getInputForFrame(0)
   │  ├─ local = localInputBuffer.getInput(0)
   │  │  └─ Return stored {a: true, ...}
   │  ├─ remote = remoteInputBuffer.getInput(0)
   │  │  └─ Return stored {b: true, ...}
   │  └─ Return {local, remote}
   └─→ Both inputs ready

6. EMULATOR EXECUTION
   ┌─ applyInput(nes, local, 1)
   │  └─ Map buttons to JSNES codes
   │     └─ nes.buttonDown(1, 0x01) [A button]
   │
   ├─ applyInput(nes, remote, 2)
   │  └─ Map buttons to JSNES codes
   │     └─ nes.buttonDown(2, 0x02) [B button]
   │
   └─ nes.frame()
      └─ Execute one frame of 6502 CPU
         └─ Update PPU state
            └─ Render to canvas via onFrame callback

7. CHECKPOINT
   ┌─ computeStateHash() (every 60 frames)
   │  └─ Hash CPU/PPU state
   │     └─ Return "abc123..."
   │
   └─ MultiplayerSync.sendCheckpoint(hash)
      └─ JSON encode & WebSocket.send()
         └─→ Server → Other player

8. FRAME ADVANCE
   ┌─ setFrameInfo({frame: 1})
   │  └─ UI updates frame counter
   │
   └─ MultiplayerSync.advanceFrame()
      ├─ frameCounter = 1
      ├─ InputBuffer.prune() (clean old inputs)
      └─ Ready for frame 1
```

## 9. Network Packet Examples

### Input Packet (P1 sends to server)
```json
{
  "type": "input",
  "packet": {
    "frame": 42,
    "playerId": "local",
    "buttons": {
      "a": false,
      "b": false,
      "x": false,
      "y": true,
      "l": false,
      "r": false,
      "start": false,
      "select": false,
      "up": true,
      "down": false,
      "left": false,
      "right": false
    },
    "timestamp": 1704638400000
  }
}
```

### Input Relay (Server to P2)
```json
{
  "type": "input",
  "packet": {
    "frame": 42,
    "playerId": "local",
    "buttons": {...},
    "timestamp": 1704638400000,
    "seq": 42
  }
}
```

### Checkpoint Packet (P1 sends)
```json
{
  "type": "checkpoint",
  "checkpoint": {
    "frame": 60,
    "stateHash": "a1b2c3d4e5f6g7h8",
    "timestamp": 1704638400100
  }
}
```

### Checkpoint Relay (Server to P2)
```json
{
  "type": "checkpoint",
  "playerId": "p1",
  "checkpoint": {
    "frame": 60,
    "stateHash": "a1b2c3d4e5f6g7h8",
    "timestamp": 1704638400100
  }
}
```

---

**These diagrams show the complete architecture and data flow of the jsnes multiplayer system.**
