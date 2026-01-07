# jsnes Multiplayer System Design (Input Synchronization)

## Overview

A deterministic input-synchronized multiplayer architecture for jsnes where both clients execute the same emulator instance with synchronized inputs. The server acts as a relay, sending inputs from one player to the other with minimal latency.

---

## 1. Client Responsibilities

### Input Capture & Buffering
- **Capture local input** on every frame (SNES controller state)
- **Buffer inputs** in a frame-indexed queue with predictable ordering
- **Send input packets** to server immediately upon capture (not waiting for server confirmation)

### Emulation Loop
- **Run deterministic emulator** at fixed rate (60 FPS for SNES)
- **Fetch inputs** from synchronized input buffer before each frame tick
- **Handle input gaps**: Use last-known-good input if remote input not yet received (local prediction)
- **Frame counter**: Maintain frame number starting from 0, synchronized with opponent

### Network Operations
- **WebSocket connection** to relay server
- **Send own inputs** with frame number and input state
- **Receive remote inputs** with frame numbers
- **Store received inputs** in frame-indexed input buffer
- **Detect stalls**: Monitor if remote inputs haven't arrived for N frames

### Desync Detection
- **Optional: frame hash exchange** at checkpoint frames (e.g., every 60 frames)
- **Compare game state** at checkpoint intervals
- **Trigger halt** if hashes don't match (pause both clients)
- **Log divergence** point for debugging

### Retry Logic
- **Request retransmission** if input packet acknowledged but not received
- **Assume packet loss** after timeout (resend or accept desync)

---

## 2. Server Responsibilities

### Connection Management
- **Accept two WebSocket connections** (one per player)
- **Pair players** when second client connects
- **Notify both clients** of connection state (ready to play)
- **Handle disconnection**: Pause game or reset

### Input Relay
- **Receive inputs** from Player 1, relay to Player 2
- **Receive inputs** from Player 2, relay to Player 1
- **No processing** of input data (pure relay)
- **Preserve frame numbers** and timing information

### State Tracking
- **Track which players** are connected
- **Monitor heartbeats** to detect stale connections
- **Log events** (connect, disconnect, inputs received)
- **No game state storage** or validation

### Minimal Game Logic
- **Send START signal** when both players ready
- **Send PAUSE signal** if either player disconnects
- **Buffer inputs briefly** (1-2 frames max) to compensate for network jitter

---

## 3. Frame Synchronization Strategy

### Lockstep (Tight Synchronization)

```
Player 1 Frame 0: ████ (waiting for remote input)
  ├─ Local input captured
  ├─ Send to server
  └─ Wait for frame 0 remote input
     └─ Once received, execute frame 0 with both inputs
     
Player 2 Frame 0: ████ (waiting for remote input)
  ├─ Local input captured
  ├─ Send to server
  └─ Wait for frame 0 remote input
     └─ Once received, execute frame 0 with both inputs
```

### Timing Model

1. **Frame execution window**: Each client must wait for remote input before advancing
2. **Max wait time**: ~100ms (at 60 FPS = 6 frames)
3. **Timeout behavior**: 
   - After timeout, use predicted input (last known) and advance
   - Mark frame as "uncertain" for potential rollback detection
4. **Network latency tolerance**: Typically 50-150ms

### Frame Numbering

- **Global frame counter** starts at 0 for both clients
- **Incremented every simulation step**, regardless of input arrival
- **Used as key** in input buffer (frame N → input state)
- **Synchronized** by server confirming frame readiness

---

## 4. Input Delay Handling

### Prediction Strategy

When remote input for frame N hasn't arrived:
1. **Predict**: Use last-received input for that player
2. **Speculate**: Continue emulation with prediction
3. **Reconcile**: When real input arrives, check if prediction was correct
   - If correct: No action needed
   - If incorrect: ⚠️ Potential desync (see section 5)

### Input Delay Latency

```
Player 1 sends input for frame N
    ↓ [RTT/2 = ~50ms at 60fps ≈ 3 frames]
Server receives & relays
    ↓ [RTT/2 = ~50ms]
Player 2 receives input for frame N
    
Player 2 is typically 6-10 frames behind Player 1's real time
```

### Handling the Delay

```
Frame execution timeline (assuming 100ms RTT):

Player 1: Frame 0 (input sent)
Player 1: Frame 3 (receives Player 2's frame 0 input)
Player 1: Frame 6 (receives Player 2's frame 3 input)
...
```

- **Both clients execute the same frame sequence** but at different real-world times
- **Player 1's "local" frame 100** contains **Player 2's input from frame ~94**
- This is acceptable because **both see the same frame state at end**

---

## 5. Desync Detection & Handling

### Checkpoint Hash Exchange

At every N frames (e.g., N=60):
1. **Client computes hash** of entire emulator state
2. **Send checkpoint packet**: `{frame: 60, hash: "abc123..."}`
3. **Receive opponent's hash** for same frame
4. **Compare hashes**:
   - ✅ Match → Continue
   - ❌ Mismatch → Desync detected

### Desync Response

```
Player 1: Frame 60 hash = "abc123"
Player 2: Frame 60 hash = "xyz789"
         ↓
  DESYNC DETECTED
         ↓
1. Both clients: Emit desync event
2. Pause emulation
3. Log frame number and input divergence
4. Display error to user: "Network desync at frame 60"
5. Offer: Reload & restart, or disconnect
```

### Why Desync Occurs (Without Rollback)

1. **Input order corruption** (rare with TCP-based relay)
2. **Client-side emulation bug** (non-determinism)
3. **Floating-point arithmetic differences** (jsnes should avoid)
4. **Incorrect prediction**: Predicted input ≠ actual input
5. **Frame number misalignment**: Clients at different frame counts

### Prevention

- **No floating-point operations** in core emulation
- **Deterministic RNG seeding** (if game uses RNG)
- **TCP guarantee**: Server uses TCP (WebSocket-secured) not UDP
- **Input validation**: Ensure input format correct before relay

---

## 6. Data Structures

### Input Packet

```typescript
interface InputPacket {
  frame: number;        // Frame number (0-based)
  playerId: "p1" | "p2";
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    l: boolean;
    r: boolean;
    start: boolean;
    select: boolean;
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  timestamp: number;    // Client time when input captured (diagnostic)
  seq: number;          // Sequence number for packet tracking
}
```

### Input Buffer (Client-Side)

```typescript
class InputBuffer {
  private buffer: Map<number, InputPacket> = new Map();
  
  getInput(frame: number): InputPacket {
    // Return input for frame, or last-known for prediction
    return this.buffer.get(frame) || this.lastKnownInput;
  }
  
  addInput(packet: InputPacket): void {
    this.buffer.set(packet.frame, packet);
  }
  
  isReady(frame: number): boolean {
    return this.buffer.has(frame);
  }
  
  prune(beforeFrame: number): void {
    // Remove old inputs to save memory
    for (let [frame, _] of this.buffer) {
      if (frame < beforeFrame) this.buffer.delete(frame);
    }
  }
}
```

### Checkpoint Packet

```typescript
interface CheckpointPacket {
  type: "checkpoint";
  frame: number;
  stateHash: string;    // SHA256 or MD5 of emulator state
  timestamp: number;
}
```

### Server Message

```typescript
interface ServerMessage {
  type: "start" | "input" | "checkpoint" | "pause" | "error";
  
  // For "start"
  playerId?: "p1" | "p2";
  opponentReady?: boolean;
  
  // For "input"
  packet?: InputPacket;
  
  // For "checkpoint"
  checkpoint?: CheckpointPacket;
  
  // For "pause"
  reason?: string;
  
  // For "error"
  error?: string;
}
```

### Emulator Input State

```typescript
interface ControllerState {
  [key: string]: boolean;  // buttons mapped to booleans
  
  // jsnes.nes.buttonDown(button) / buttonUp(button)
  // Button codes: 0x01 (A), 0x02 (B), 0x04 (SELECT), 0x08 (START)
  //               0x10 (UP), 0x20 (DOWN), 0x40 (LEFT), 0x80 (RIGHT)
}
```

---

## 7. Sequence Diagram: One Frame Execution

```
Frame N execution with input synchronization:

TIMELINE:
─────────────────────────────────────────────────────────────────

Time 0ms:
[P1 Local]           [P2 Local]           [Server]
┌──────────┐
│Input →   │                          
│captured  │                          
└──────────┘                          
   │
   │ Send InputPacket(frame=N, buttons={...})
   ├────────────────────────────────────────────→ Received
   │                                               │
   │                                               ├─→ Relay to P2
   │
   │ Wait for P2 frame N input
   │ (using predicted input: last frame input)

─────────────────────────────────────────────────────────────────

Time 50ms (RTT ≈ 100ms, so RTT/2 ≈ 50ms):
[P1 Local]           [P2 Local]           [Server]
(still waiting)      ┌──────────┐
                     │Input →   │
                     │captured  │
                     └──────────┘
                        │
                        │ Send InputPacket(frame=N, buttons={...})
                        ├────────────────────────────────────────→ Received
                        │                                           │
                        │                                           ├─→ Relay to P1

─────────────────────────────────────────────────────────────────

Time 100ms:
[P1 Local]           [P2 Local]           [Server]
Received P2's frame N input!
(or timed out after 6 frames)
│
┌─────────────────────┐
│ Emulator Loop:      │
│ ┌─────────────────┐ │
│ │ P1 input: {a:0} │ │
│ │ P2 input: {b:1} │ │
│ │ Frame N exec    │ │
│ │ Frame counter++ │ │
│ └─────────────────┘ │
└─────────────────────┘

                        Received P1's frame N input!
                        │
                        ┌─────────────────────┐
                        │ Emulator Loop:      │
                        │ ┌─────────────────┐ │
                        │ │ P1 input: {a:0} │ │
                        │ │ P2 input: {b:1} │ │
                        │ │ Frame N exec    │ │
                        │ │ Frame counter++ │ │
                        │ └─────────────────┘ │
                        └─────────────────────┘

─────────────────────────────────────────────────────────────────

Time 116ms (next frame):
[P1 Local]           [P2 Local]           [Server]
Input N+1 captured   (still executing)
Send to server       
(waiting for N+1)    
```

### Detailed Frame N Execution Flow

```
CLIENT STATE MACHINE (Frame N)

┌─────────────────────────────────────────────┐
│ FRAME_WAITING_INPUT                         │
│ ┌───────────────────────────────────────┐   │
│ │ 1. Check: Do we have remote input N?   │   │
│ │    ├─ Yes: Go to FRAME_READY           │   │
│ │    └─ No: Go to FRAME_PREDICT          │   │
│ └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
  │                          │
  ├─ Remote Input Arrived    ├─ Timeout (6 frames)
  │                          │
  ▼                          ▼
┌──────────────┐    ┌──────────────────────┐
│ FRAME_READY  │    │ FRAME_PREDICT        │
│              │    │ (use last input)     │
│ Both inputs  │    │ Mark uncertain       │
│ available    │    └──────────────────────┘
└──────────────┘             │
  │                          │
  └──────────────┬───────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ EXECUTE_FRAME       │
        │ ┌─────────────────┐ │
        │ │ Emulator tick   │ │
        │ │ (uses P1, P2    │ │
        │ │  inputs)        │ │
        │ └─────────────────┘ │
        └─────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ FRAME_COMPLETE      │
        │ Frame counter = N+1 │
        │ Next frame = N+1    │
        └─────────────────────┘
```

### Data Flow Within One Frame

```
INPUT PACKET PATH (Simplified):

P1 Button Press (frame N)
         │
         ▼
P1 InputBuffer.addInput({frame: N, buttons})
         │
         ▼
P1 WebSocket.send(InputPacket)
         │
         ▼ [Network - ~50ms]
         │
Server receives
         │
         ▼
Server WebSocket.send(InputPacket to P2)
         │
         ▼ [Network - ~50ms]
         │
P2 WebSocket.onMessage(InputPacket)
         │
         ▼
P2 InputBuffer.addInput({frame: N, buttons})
         │
         ▼
P2 EmulationLoop polls: inputBuffer.getInput(N)
         │
         ▼
P2 Emulator executes frame N with both P1 & P2 inputs
```

---

## Implementation Checklist

- [ ] **Client**: Implement input buffer with frame indexing
- [ ] **Client**: Implement emulation loop with input synchronization
- [ ] **Client**: Add prediction fallback for delayed inputs
- [ ] **Client**: Add frame hash computation for desync detection
- [ ] **Client**: Implement checkpoint exchange protocol
- [ ] **Client**: Add timeout detection for stalled remote inputs
- [ ] **Server**: WebSocket relay for two clients
- [ ] **Server**: Start signal when both clients connected
- [ ] **Server**: Pause signal on disconnection
- [ ] **Server**: Basic input validation before relay
- [ ] **Testing**: Single-frame execution test with both inputs
- [ ] **Testing**: Desync detection at checkpoint
- [ ] **Testing**: Input loss/delay simulation
- [ ] **Debugging**: Log all input packets with timestamps

---

## Key Constraints & Trade-offs

| Aspect | Decision | Reason |
|--------|----------|--------|
| **No Rollback** | Simpler code, lower latency | Fixed deterministic execution |
| **Input Prediction** | Uses last input when delayed | Prevents frame stalls |
| **TCP/WebSocket** | Ordered delivery guarantee | No packet reordering issues |
| **Frame Hashing** | Checkpoints, not continuous | Lower overhead |
| **2 Players Only** | Simpler input pairing | Server doesn't scale beyond 2 |
| **Server-side Relay** | No emulation on server | Avoid server-side bugs |

---

## Example Network Timing (60 FPS)

```
Frame time: 16.67ms
Max RTT: 100ms = 6 frames

Scenario: 50ms RTT (good connection)

P1 Local Time    Network Time    P2 Local Time
Frame 0 exec     Send input 0 (0ms)
                 [50ms delay]
Frame 3 exec     Recv input 0 (50ms)
                 Send input 0 response
                 [50ms delay]
Frame 6 exec     Recv input 0 ack (100ms)

P1 executes all frames (0-6) before receiving P2's input 0.
Result: P1 frame 6 = P2 frame 0 (same game state, different real-time)
```

---

## Security Notes

- **WebSocket best practices**: Use WSS (WebSocket Secure)
- **Input validation**: Reject malformed packets
- **Rate limiting**: Max N input packets per second
- **DoS protection**: Disconnect after inactivity
- **No cheat detection needed**: Emulator is deterministic, cheats won't change opponent's view

---

## Future Enhancements (Not in Scope)

- [ ] 4+ player support (complex synchronization)
- [ ] Rollback netcode (state snapshots + rewind)
- [ ] Adaptive tick rate (match network conditions)
- [ ] Spectator mode
- [ ] Recording & replay
- [ ] Lag compensation (input buffering tuning)

