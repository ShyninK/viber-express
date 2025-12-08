# 💬 Dokumentasi Lengkap Realtime Chat dengan Socket.IO

Panduan lengkap untuk mengimplementasikan dan menggunakan fitur **Realtime Chat** di aplikasi Viber menggunakan Socket.IO.

---

## 📑 Daftar Isi

1. [Fitur Chat](#-fitur-chat)
2. [Setup Database](#-setup-database)
3. [Arsitektur Sistem](#-arsitektur-sistem)
4. [REST API Endpoints](#-rest-api-endpoints)
5. [Socket.IO Events](#-socketio-events)
6. [Implementasi Client](#-implementasi-client)
7. [Tutorial Step-by-Step](#-tutorial-step-by-step)
8. [Testing & Debugging](#-testing--debugging)
9. [Best Practices](#-best-practices)
10. [Troubleshooting](#-troubleshooting)

---

## 🚀 Fitur Chat

### ✅ Yang Sudah Diimplementasikan:

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| **Realtime Messaging** | Kirim dan terima pesan secara instant tanpa reload | ✅ |
| **Multiple Chat Rooms** | Support untuk direct message (1-on-1) dan group chat | ✅ |
| **Typing Indicators** | Tampilkan indikator saat user sedang mengetik | ✅ |
| **Read Receipts** | Tanda centang untuk pesan yang sudah dibaca | ✅ |
| **Online Status** | Lihat user mana yang sedang online | ✅ |
| **Message History** | Simpan dan load riwayat pesan dari database | ✅ |
| **Unread Count** | Hitung dan tampilkan jumlah pesan belum dibaca | ✅ |
| **Room Participants** | Kelola anggota dalam chat room | ✅ |
| **Message Persistence** | Semua pesan tersimpan di Supabase PostgreSQL | ✅ |

---

## 📋 Setup Database

### Langkah 1: Buat Tables di Supabase

Buka **Supabase Dashboard** → **SQL Editor** → Jalankan script berikut:

```sql
-- 1. Table untuk Chat Rooms
CREATE TABLE chat_rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'group' CHECK (type IN ('direct', 'group')),
  created_by INTEGER,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table untuk Chat Messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table untuk Room Participants
CREATE TABLE chat_room_participants (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 4. Indexes untuk Performance
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_room_participants_user_id ON chat_room_participants(user_id);
CREATE INDEX idx_chat_room_participants_room_id ON chat_room_participants(room_id);

-- 5. Function untuk Auto Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger untuk Auto Update updated_at
CREATE TRIGGER update_chat_rooms_updated_at 
BEFORE UPDATE ON chat_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Langkah 2: Insert Sample Data (Opsional)

```sql
-- Buat sample chat room
INSERT INTO chat_rooms (name, type, created_by) 
VALUES 
  ('General Discussion', 'group', 1),
  ('Tech Support', 'group', 1),
  ('Direct Chat', 'direct', 1);

-- Tambah participants
INSERT INTO chat_room_participants (room_id, user_id)
VALUES 
  (1, 1),
  (1, 2),
  (2, 1),
  (2, 3);
```

### Langkah 3: Verifikasi

Pastikan tables sudah terbuat dengan menjalankan:

```sql
SELECT * FROM chat_rooms;
SELECT * FROM chat_messages;
SELECT * FROM chat_room_participants;
```

---

## 🏗 Arsitektur Sistem

### Struktur File

```
viber/
├── src/
│   ├── index.js                    # Main server + Socket.IO setup
│   ├── models/
│   │   └── chatModel.js           # Database operations
│   ├── controllers/
│   │   └── chatController.js      # Business logic + Socket handlers
│   ├── routes/
│   │   └── chatRoutes.js          # REST API routes
│   └── docs/
│       └── chatSwagger.js         # API documentation
├── database_schema.sql             # Database setup script
└── CHAT_README.md                 # Dokumentasi ini
```

### Flow Diagram

```
┌─────────┐         ┌─────────────┐         ┌──────────┐
│ Client  │────────>│  Socket.IO  │────────>│ Database │
│         │<────────│   Server    │<────────│ Supabase │
└─────────┘         └─────────────┘         └──────────┘
    │                      │
    │  REST API            │
    └──────────────────────┘
```

1. **Client** mengirim event via Socket.IO
2. **Server** menerima event, process, dan simpan ke database
3. **Server** broadcast ke client lain yang terhubung di room yang sama
4. **Client** menerima data dan update UI secara realtime

---

## 🌐 REST API Endpoints

### 1. Chat Rooms Management

#### **GET** `/api/v1/chat/rooms`
Mendapatkan semua chat rooms.

**Response:**
```json
{
  "status": true,
  "message": "Chat rooms retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "General Discussion",
      "type": "group",
      "created_by": 1,
      "last_message": "Hello everyone!",
      "last_message_at": "2025-12-07T10:30:00Z",
      "created_at": "2025-12-07T09:00:00Z",
      "updated_at": "2025-12-07T10:30:00Z"
    }
  ]
}
```

#### **GET** `/api/v1/chat/rooms/:roomId`
Mendapatkan detail room spesifik.

**Parameters:**
- `roomId` (integer) - ID dari chat room

**Example:** `GET /api/v1/chat/rooms/1`

**Response:**
```json
{
  "status": true,
  "message": "Chat room retrieved successfully",
  "data": {
    "id": 1,
    "name": "General Discussion",
    "type": "group",
    "created_by": 1,
    "last_message": "Hello!",
    "last_message_at": "2025-12-07T10:30:00Z"
  }
}
```

#### **POST** `/api/v1/chat/rooms`
Membuat chat room baru.

**Request Body:**
```json
{
  "name": "New Room",
  "type": "group",      // "group" atau "direct"
  "created_by": 1
}
```

**Response:**
```json
{
  "status": true,
  "message": "Chat room created successfully",
  "data": {
    "id": 4,
    "name": "New Room",
    "type": "group",
    "created_by": 1,
    "created_at": "2025-12-07T11:00:00Z"
  }
}
```

### 2. Messages

#### **GET** `/api/v1/chat/rooms/:roomId/messages`
Mendapatkan pesan-pesan dalam room.

**Parameters:**
- `roomId` (integer) - ID room
- `limit` (integer, optional) - Jumlah pesan (default: 50)

**Example:** `GET /api/v1/chat/rooms/1/messages?limit=100`

**Response:**
```json
{
  "status": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": 1,
      "room_id": 1,
      "user_id": 2,
      "message": "Hello everyone!",
      "is_read": true,
      "read_at": "2025-12-07T10:35:00Z",
      "created_at": "2025-12-07T10:30:00Z"
    },
    {
      "id": 2,
      "room_id": 1,
      "user_id": 3,
      "message": "Hi there!",
      "is_read": false,
      "read_at": null,
      "created_at": "2025-12-07T10:31:00Z"
    }
  ]
}
```

### 3. User Operations

#### **GET** `/api/v1/chat/users/:userId/rooms`
Mendapatkan semua rooms yang diikuti user.

**Example:** `GET /api/v1/chat/users/1/rooms`

**Response:**
```json
{
  "status": true,
  "message": "User rooms retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "General Discussion",
      "type": "group",
      "last_message": "Hello!",
      "last_message_at": "2025-12-07T10:30:00Z"
    }
  ]
}
```

#### **GET** `/api/v1/chat/users/:userId/unread`
Mendapatkan jumlah pesan belum dibaca.

**Example:** `GET /api/v1/chat/users/1/unread`

**Response:**
```json
{
  "status": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "count": 5
  }
}
```

### 4. Participants

#### **POST** `/api/v1/chat/rooms/:roomId/participants`
Menambahkan participant ke room.

**Request Body:**
```json
{
  "userId": 3
}
```

**Response:**
```json
{
  "status": true,
  "message": "Participant added successfully",
  "data": {
    "id": 5,
    "room_id": 1,
    "user_id": 3,
    "joined_at": "2025-12-07T11:00:00Z"
  }
}
```

---

## 🔌 Socket.IO Events

### Connection Setup

```javascript
import io from 'socket.io-client';

// Connect ke server
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Event saat berhasil connect
socket.on('connect', () => {
  console.log('Connected to server!', socket.id);
});

// Event saat disconnect
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Event saat connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```


### Client → Server Events

#### 1. `user:join` - User Login/Connect

Emit event ini saat user pertama kali connect ke server.

**Payload:**
```javascript
socket.emit('user:join', {
  userId: 1,              // ID user dari database
  username: 'John Doe'    // Nama user untuk ditampilkan
});
```

**Kapan digunakan:**
- Saat user login ke aplikasi
- Saat page refresh (reconnect)
- Sebelum melakukan operasi chat lainnya

---

#### 2. `room:join` - Join Chat Room

Emit event ini untuk bergabung ke chat room tertentu.

**Payload:**
```javascript
socket.emit('room:join', {
  roomId: 1,    // ID room yang ingin dimasuki
  userId: 1     // ID user yang join
});
```

**Yang terjadi:**
- User masuk ke room
- Semua pesan belum dibaca di-mark sebagai read
- User lain di room mendapat notifikasi `user:joined`

**Kapan digunakan:**
- Saat user membuka/klik chat room
- Sebelum mengirim atau menerima pesan di room tersebut

---

#### 3. `room:leave` - Leave Chat Room

Emit event ini saat user keluar dari room.

**Payload:**
```javascript
socket.emit('room:leave', {
  roomId: 1,
  userId: 1
});
```

**Yang terjadi:**
- User keluar dari room
- User lain di room mendapat notifikasi `user:left`
- Tidak lagi menerima pesan dari room tersebut

**Kapan digunakan:**
- Saat user pindah ke room lain
- Saat user close/minimize chat
- Saat component unmount (React)

---

#### 4. `message:send` - Kirim Pesan

Emit event ini untuk mengirim pesan ke room.

**Payload:**
```javascript
socket.emit('message:send', {
  roomId: 1,
  userId: 1,
  username: 'John Doe',
  message: 'Hello everyone!'
});
```

**Yang terjadi:**
- Pesan disimpan ke database
- Last message di room ter-update
- Semua user di room (termasuk pengirim) menerima event `message:receive`

**Kapan digunakan:**
- Saat user klik tombol send
- Saat user tekan Enter di input message

---

#### 5. `typing:start` - Mulai Mengetik

Emit event ini saat user mulai mengetik.

**Payload:**
```javascript
socket.emit('typing:start', {
  roomId: 1,
  userId: 1,
  username: 'John Doe'
});
```

**Yang terjadi:**
- User lain di room menerima event `typing:user` dengan `isTyping: true`
- Tampilkan indikator "John Doe is typing..."

**Kapan digunakan:**
- Saat user mulai ketik di input field
- Trigger pada event `input` atau `keydown`

---

#### 6. `typing:stop` - Berhenti Mengetik

Emit event ini saat user berhenti mengetik.

**Payload:**
```javascript
socket.emit('typing:stop', {
  roomId: 1,
  userId: 1,
  username: 'John Doe'
});
```

**Yang terjadi:**
- User lain menerima event `typing:user` dengan `isTyping: false`
- Hilangkan indikator typing

**Kapan digunakan:**
- Saat input field kosong
- Saat user kirim pesan
- Setelah 2-3 detik tidak ada input (debounce)

---

#### 7. `message:read` - Mark Messages as Read

Emit event ini untuk menandai pesan sebagai sudah dibaca.

**Payload:**
```javascript
socket.emit('message:read', {
  roomId: 1,
  userId: 1
});
```

**Yang terjadi:**
- Semua pesan di room (kecuali milik user sendiri) di-mark sebagai read
- User lain menerima event `messages:read`
- Update read receipt/centang biru

**Kapan digunakan:**
- Saat user membuka chat room
- Saat user scroll ke pesan terbaru
- Secara otomatis saat join room

---

### Server → Client Events

#### 1. `message:receive` - Menerima Pesan Baru

Event ini diterima saat ada pesan baru di room.

**Listener:**
```javascript
socket.on('message:receive', (data) => {
  console.log('New message received:', data);
  // Update UI dengan pesan baru
  addMessageToChat(data);
});
```

**Data yang diterima:**
```javascript
{
  id: 123,                              // ID pesan di database
  roomId: 1,                            // ID room
  userId: 2,                            // ID pengirim
  username: 'Jane Smith',               // Nama pengirim
  message: 'Hello!',                    // Isi pesan
  createdAt: '2025-12-07T10:30:00Z',   // Timestamp
  isRead: false                         // Status read
}
```

**Kapan diterima:**
- Saat ada user lain (atau diri sendiri) kirim pesan di room yang sama
- Realtime tanpa delay

---

#### 2. `users:online` - Daftar User Online

Event ini diterima saat ada perubahan user online.

**Listener:**
```javascript
socket.on('users:online', (userIds) => {
  console.log('Online users:', userIds);
  // Update UI untuk tampilkan online status
  updateOnlineStatus(userIds);
});
```

**Data yang diterima:**
```javascript
[1, 3, 5, 7]  // Array of user IDs yang sedang online
```

**Kapan diterima:**
- Saat user lain connect/join
- Saat user lain disconnect

---

#### 3. `user:joined` - User Masuk Room

Event ini diterima saat ada user baru join room.

**Listener:**
```javascript
socket.on('user:joined', (data) => {
  console.log(`${data.username} joined the room`);
  // Tampilkan notifikasi "John joined"
  showNotification(`${data.username} joined`);
});
```

**Data yang diterima:**
```javascript
{
  userId: 3,
  username: 'John Doe',
  roomId: 1,
  timestamp: '2025-12-07T10:30:00Z'
}
```

---

#### 4. `user:left` - User Keluar Room

Event ini diterima saat ada user keluar dari room.

**Listener:**
```javascript
socket.on('user:left', (data) => {
  console.log(`${data.username} left the room`);
  showNotification(`${data.username} left`);
});
```

**Data yang diterima:**
```javascript
{
  userId: 3,
  username: 'John Doe',
  roomId: 1,
  timestamp: '2025-12-07T10:35:00Z'
}
```

---

#### 5. `typing:user` - Typing Indicator

Event ini diterima saat ada user mengetik atau berhenti mengetik.

**Listener:**
```javascript
socket.on('typing:user', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.username);
  } else {
    hideTypingIndicator(data.username);
  }
});
```

**Data yang diterima:**
```javascript
{
  userId: 2,
  username: 'Jane Smith',
  isTyping: true  // true = mulai ketik, false = berhenti
}
```

---

#### 6. `messages:read` - Read Receipt

Event ini diterima saat user lain membaca pesan.

**Listener:**
```javascript
socket.on('messages:read', (data) => {
  console.log(`Messages read by user ${data.readBy}`);
  // Update centang biru pada pesan
  markMessagesAsRead(data.roomId, data.readBy);
});
```

**Data yang diterima:**
```javascript
{
  roomId: 1,
  readBy: 3,                          // User ID yang baca
  timestamp: '2025-12-07T10:36:00Z'
}
```

---

#### 7. `participant:added` - Participant Baru Ditambahkan

Event ini diterima saat ada participant baru ditambahkan ke room.

**Listener:**
```javascript
socket.on('participant:added', (data) => {
  console.log(`New participant added to room ${data.roomId}`);
  // Refresh participant list
  fetchRoomParticipants(data.roomId);
});
```

**Data yang diterima:**
```javascript
{
  roomId: 1,
  userId: 5,
  timestamp: '2025-12-07T10:40:00Z'
}
```

---

#### 8. `message:error` - Error Handling

Event ini diterima saat ada error dalam operasi chat.

**Listener:**
```javascript
socket.on('message:error', (data) => {
  console.error('Chat error:', data.error);
  // Tampilkan error message ke user
  showErrorNotification(data.error);
});
```

**Data yang diterima:**
```javascript
{
  error: 'Failed to send message: Room not found'
}
```

---

## 💻 Implementasi Client

### 1. Vanilla JavaScript / HTML

#### Complete Chat Application

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viber Chat</title>
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
    
    .chat-container {
      max-width: 800px;
      margin: 20px auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .chat-header {
      background: #075e54;
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .online-count {
      background: #25d366;
      padding: 5px 10px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .messages-container {
      height: 500px;
      overflow-y: auto;
      padding: 20px;
      background: #e5ddd5;
    }
    
    .message {
      margin-bottom: 15px;
      padding: 10px 15px;
      border-radius: 8px;
      max-width: 70%;
      word-wrap: break-word;
    }
    
    .message.own {
      background: #dcf8c6;
      margin-left: auto;
      text-align: right;
    }
    
    .message.other {
      background: white;
    }
    
    .message-username {
      font-weight: bold;
      font-size: 12px;
      color: #075e54;
      margin-bottom: 5px;
    }
    
    .message-text {
      font-size: 14px;
      color: #333;
    }
    
    .message-time {
      font-size: 11px;
      color: #999;
      margin-top: 5px;
    }
    
    .typing-indicator {
      padding: 10px 20px;
      font-size: 13px;
      color: #666;
      font-style: italic;
      min-height: 20px;
    }
    
    .input-container {
      display: flex;
      padding: 15px;
      background: #f0f0f0;
      border-top: 1px solid #ddd;
    }
    
    #messageInput {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 25px;
      outline: none;
      font-size: 14px;
    }
    
    #sendButton {
      margin-left: 10px;
      padding: 12px 25px;
      background: #075e54;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
    }
    
    #sendButton:hover {
      background: #064e47;
    }
    
    #sendButton:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <div>
        <h2>General Discussion</h2>
        <div id="roomInfo" style="font-size: 12px; opacity: 0.8;">Room #1</div>
      </div>
      <div class="online-count" id="onlineCount">0 online</div>
    </div>
    
    <div class="messages-container" id="messagesContainer"></div>
    
    <div class="typing-indicator" id="typingIndicator"></div>
    
    <div class="input-container">
      <input 
        type="text" 
        id="messageInput" 
        placeholder="Type a message..." 
        autocomplete="off"
      >
      <button id="sendButton">Send</button>
    </div>
  </div>

  <script>
    // ===== CONFIGURATION =====
    const CONFIG = {
      serverUrl: 'http://localhost:8080',
      userId: 1,                    // Ganti dengan user ID yang login
      username: 'John Doe',         // Ganti dengan username yang login
      roomId: 1                     // Ganti dengan room ID yang dibuka
    };

    // ===== SOCKET.IO CONNECTION =====
    const socket = io(CONFIG.serverUrl, {
      transports: ['websocket'],
      reconnection: true
    });

    // ===== DOM ELEMENTS =====
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const onlineCount = document.getElementById('onlineCount');

    // ===== STATE =====
    let typingTimeout = null;
    let isTyping = false;

    // ===== SOCKET EVENTS =====
    
    // Connection successful
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // Join sebagai user
      socket.emit('user:join', {
        userId: CONFIG.userId,
        username: CONFIG.username
      });
      
      // Join room
      socket.emit('room:join', {
        roomId: CONFIG.roomId,
        userId: CONFIG.userId
      });
      
      // Load message history
      loadMessageHistory();
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    // Receive new message
    socket.on('message:receive', (data) => {
      addMessageToUI(data);
      scrollToBottom();
    });

    // Online users update
    socket.on('users:online', (userIds) => {
      onlineCount.textContent = `${userIds.length} online`;
    });

    // User joined
    socket.on('user:joined', (data) => {
      showSystemMessage(`${data.username} joined the chat`);
    });

    // User left
    socket.on('user:left', (data) => {
      showSystemMessage(`${data.username} left the chat`);
    });

    // Typing indicator
    socket.on('typing:user', (data) => {
      if (data.userId !== CONFIG.userId) {
        if (data.isTyping) {
          typingIndicator.textContent = `${data.username} is typing...`;
        } else {
          typingIndicator.textContent = '';
        }
      }
    });

    // Messages read
    socket.on('messages:read', (data) => {
      console.log('Messages read by:', data.readBy);
      // TODO: Update read receipts UI
    });

    // ===== FUNCTIONS =====

    // Load message history via REST API
    async function loadMessageHistory() {
      try {
        const response = await fetch(
          `${CONFIG.serverUrl}/api/v1/chat/rooms/${CONFIG.roomId}/messages?limit=50`
        );
        const result = await response.json();
        
        if (result.status) {
          result.data.forEach(msg => {
            addMessageToUI({
              id: msg.id,
              userId: msg.user_id,
              username: msg.user_id === CONFIG.userId ? 'You' : `User ${msg.user_id}`,
              message: msg.message,
              createdAt: msg.created_at,
              isRead: msg.is_read
            });
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }

    // Add message to UI
    function addMessageToUI(data) {
      const messageDiv = document.createElement('div');
      messageDiv.className = data.userId === CONFIG.userId ? 'message own' : 'message other';
      
      const time = new Date(data.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      messageDiv.innerHTML = `
        ${data.userId !== CONFIG.userId ? `<div class="message-username">${data.username}</div>` : ''}
        <div class="message-text">${escapeHtml(data.message)}</div>
        <div class="message-time">${time}${data.isRead ? ' ✓✓' : ' ✓'}</div>
      `;
      
      messagesContainer.appendChild(messageDiv);
    }

    // Show system message
    function showSystemMessage(text) {
      const messageDiv = document.createElement('div');
      messageDiv.style.textAlign = 'center';
      messageDiv.style.color = '#999';
      messageDiv.style.fontSize = '12px';
      messageDiv.style.margin = '10px 0';
      messageDiv.textContent = text;
      messagesContainer.appendChild(messageDiv);
      scrollToBottom();
    }

    // Send message
    function sendMessage() {
      const message = messageInput.value.trim();
      
      if (!message) return;
      
      socket.emit('message:send', {
        roomId: CONFIG.roomId,
        userId: CONFIG.userId,
        username: CONFIG.username,
        message: message
      });
      
      messageInput.value = '';
      stopTyping();
    }

    // Handle typing
    function handleTyping() {
      if (!isTyping) {
        isTyping = true;
        socket.emit('typing:start', {
          roomId: CONFIG.roomId,
          userId: CONFIG.userId,
          username: CONFIG.username
        });
      }
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        stopTyping();
      }, 2000);
    }

    // Stop typing
    function stopTyping() {
      if (isTyping) {
        isTyping = false;
        socket.emit('typing:stop', {
          roomId: CONFIG.roomId,
          userId: CONFIG.userId,
          username: CONFIG.username
        });
      }
      clearTimeout(typingTimeout);
    }

    // Scroll to bottom
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // ===== EVENT LISTENERS =====
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    messageInput.addEventListener('input', (e) => {
      if (e.target.value) {
        handleTyping();
      } else {
        stopTyping();
      }
    });

    // Mark messages as read when window is focused
    window.addEventListener('focus', () => {
      socket.emit('message:read', {
        roomId: CONFIG.roomId,
        userId: CONFIG.userId
      });
    });

    // Leave room on page unload
    window.addEventListener('beforeunload', () => {
      socket.emit('room:leave', {
        roomId: CONFIG.roomId,
        userId: CONFIG.userId
      });
    });
  </script>
</body>
</html>
```

### 2. React Implementation

#### ChatApp.jsx - Complete Component

```jsx
```jsx
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// Socket connection (outside component untuk prevent reconnect)
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  reconnection: true
});

function ChatApp() {
  // ===== STATE =====
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // User & Room info (biasanya dari context/props/auth)
  const currentUser = {
    id: 1,
    username: 'John Doe'
  };
  const currentRoom = {
    id: 1,
    name: 'General Discussion'
  };

  // ===== EFFECTS =====
  
  useEffect(() => {
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Join as user
      socket.emit('user:join', {
        userId: currentUser.id,
        username: currentUser.username
      });
      
      // Join room
      socket.emit('room:join', {
        roomId: currentRoom.id,
        userId: currentUser.id
      });
      
      // Load history
      loadMessageHistory();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Message events
    socket.on('message:receive', (data) => {
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    });

    // Online users
    socket.on('users:online', (userIds) => {
      setOnlineUsers(userIds);
    });

    // Typing indicator
    socket.on('typing:user', (data) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    });

    // User joined/left
    socket.on('user:joined', (data) => {
      addSystemMessage(`${data.username} joined`);
    });

    socket.on('user:left', (data) => {
      addSystemMessage(`${data.username} left`);
    });

    // Cleanup
    return () => {
      socket.emit('room:leave', {
        roomId: currentRoom.id,
        userId: currentUser.id
      });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:receive');
      socket.off('users:online');
      socket.off('typing:user');
      socket.off('user:joined');
      socket.off('user:left');
    };
  }, []);

  // ===== FUNCTIONS =====

  const loadMessageHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/chat/rooms/${currentRoom.id}/messages?limit=50`
      );
      const result = await response.json();
      
      if (result.status) {
        const formattedMessages = result.data.map(msg => ({
          id: msg.id,
          userId: msg.user_id,
          username: msg.user_id === currentUser.id ? 'You' : `User ${msg.user_id}`,
          message: msg.message,
          createdAt: msg.created_at,
          isRead: msg.is_read
        }));
        setMessages(formattedMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    const message = inputMessage.trim();
    if (!message || !isConnected) return;
    
    socket.emit('message:send', {
      roomId: currentRoom.id,
      userId: currentUser.id,
      username: currentUser.username,
      message: message
    });
    
    setInputMessage('');
    stopTyping();
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    if (e.target.value) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const handleTyping = () => {
    socket.emit('typing:start', {
      roomId: currentRoom.id,
      userId: currentUser.id,
      username: currentUser.username
    });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    socket.emit('typing:stop', {
      roomId: currentRoom.id,
      userId: currentUser.id,
      username: currentUser.username
    });
    clearTimeout(typingTimeoutRef.current);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      message: text,
      createdAt: new Date().toISOString()
    }]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== RENDER =====

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.roomName}>{currentRoom.name}</h2>
          <div style={styles.connectionStatus}>
            {isConnected ? (
              <>
                <span style={styles.onlineIndicator}>●</span>
                {onlineUsers.length} online
              </>
            ) : (
              <>
                <span style={styles.offlineIndicator}>●</span>
                Connecting...
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} style={styles.systemMessage}>
                {msg.message}
              </div>
            );
          }

          const isOwn = msg.userId === currentUser.id;
          
          return (
            <div
              key={msg.id}
              style={{
                ...styles.message,
                ...(isOwn ? styles.ownMessage : styles.otherMessage)
              }}
            >
              {!isOwn && <div style={styles.username}>{msg.username}</div>}
              <div style={styles.messageText}>{msg.message}</div>
              <div style={styles.messageTime}>
                {formatTime(msg.createdAt)}
                {isOwn && (msg.isRead ? ' ✓✓' : ' ✓')}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div style={styles.typingIndicator}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={styles.input}
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          style={styles.sendButton}
          disabled={!inputMessage.trim() || !isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    background: '#075e54',
    color: 'white',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  roomName: {
    margin: 0,
    fontSize: '18px'
  },
  connectionStatus: {
    fontSize: '12px',
    opacity: 0.9,
    marginTop: '5px'
  },
  onlineIndicator: {
    color: '#25d366',
    marginRight: '5px'
  },
  offlineIndicator: {
    color: '#ff9800',
    marginRight: '5px'
  },
  messagesContainer: {
    height: '500px',
    overflowY: 'auto',
    padding: '20px',
    background: '#e5ddd5'
  },
  message: {
    marginBottom: '15px',
    padding: '10px 15px',
    borderRadius: '8px',
    maxWidth: '70%',
    wordWrap: 'break-word'
  },
  ownMessage: {
    background: '#dcf8c6',
    marginLeft: 'auto',
    textAlign: 'right'
  },
  otherMessage: {
    background: 'white'
  },
  username: {
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#075e54',
    marginBottom: '5px'
  },
  messageText: {
    fontSize: '14px',
    color: '#333'
  },
  messageTime: {
    fontSize: '11px',
    color: '#999',
    marginTop: '5px'
  },
  systemMessage: {
    textAlign: 'center',
    color: '#999',
    fontSize: '12px',
    margin: '10px 0'
  },
  typingIndicator: {
    padding: '10px 20px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    minHeight: '20px',
    background: '#f0f0f0'
  },
  inputContainer: {
    display: 'flex',
    padding: '15px',
    background: '#f0f0f0',
    borderTop: '1px solid #ddd'
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    outline: 'none',
    fontSize: '14px'
  },
  sendButton: {
    marginLeft: '10px',
    padding: '12px 25px',
    background: '#075e54',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default ChatApp;
```

### 3. Vue.js Implementation

```vue
<template>
  <div class="chat-container">
    <!-- Header -->
    <div class="chat-header">
      <div>
        <h2>{{ currentRoom.name }}</h2>
        <div class="status">
          <span :class="isConnected ? 'online' : 'offline'">●</span>
          {{ isConnected ? `${onlineUsers.length} online` : 'Connecting...' }}
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div class="messages" ref="messagesContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.type === 'system' ? 'system' : (msg.userId === currentUser.id ? 'own' : 'other')]"
      >
        <template v-if="msg.type !== 'system'">
          <div v-if="msg.userId !== currentUser.id" class="username">{{ msg.username }}</div>
          <div class="text">{{ msg.message }}</div>
          <div class="time">
            {{ formatTime(msg.createdAt) }}
            <span v-if="msg.userId === currentUser.id">{{ msg.isRead ? '✓✓' : '✓' }}</span>
          </div>
        </template>
        <template v-else>
          {{ msg.message }}
        </template>
      </div>
    </div>

    <!-- Typing -->
    <div v-if="typingUsers.length > 0" class="typing">
      {{ typingUsers.join(', ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
    </div>

    <!-- Input -->
    <div class="input-container">
      <input
        v-model="inputMessage"
        @input="handleTyping"
        @keypress.enter="sendMessage"
        placeholder="Type a message..."
        :disabled="!isConnected"
      />
      <button @click="sendMessage" :disabled="!inputMessage.trim() || !isConnected">
        Send
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import io from 'socket.io-client';

export default {
  name: 'ChatApp',
  setup() {
    // State
    const messages = ref([]);
    const inputMessage = ref('');
    const onlineUsers = ref([]);
    const typingUsers = ref([]);
    const isConnected = ref(false);
    const messagesContainer = ref(null);
    
    let socket = null;
    let typingTimeout = null;
    
    const currentUser = { id: 1, username: 'John Doe' };
    const currentRoom = { id: 1, name: 'General Discussion' };

    // Socket setup
    const setupSocket = () => {
      socket = io('http://localhost:8080', {
        transports: ['websocket'],
        reconnection: true
      });

      socket.on('connect', () => {
        isConnected.value = true;
        socket.emit('user:join', {
          userId: currentUser.id,
          username: currentUser.username
        });
        socket.emit('room:join', {
          roomId: currentRoom.id,
          userId: currentUser.id
        });
        loadMessageHistory();
      });

      socket.on('disconnect', () => {
        isConnected.value = false;
      });

      socket.on('message:receive', (data) => {
        messages.value.push(data);
        scrollToBottom();
      });

      socket.on('users:online', (userIds) => {
        onlineUsers.value = userIds;
      });

      socket.on('typing:user', (data) => {
        if (data.userId !== currentUser.id) {
          const index = typingUsers.value.indexOf(data.username);
          if (data.isTyping && index === -1) {
            typingUsers.value.push(data.username);
          } else if (!data.isTyping && index !== -1) {
            typingUsers.value.splice(index, 1);
          }
        }
      });

      socket.on('user:joined', (data) => {
        addSystemMessage(`${data.username} joined`);
      });

      socket.on('user:left', (data) => {
        addSystemMessage(`${data.username} left`);
      });
    };

    // Functions
    const loadMessageHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/chat/rooms/${currentRoom.id}/messages?limit=50`
        );
        const result = await response.json();
        
        if (result.status) {
          messages.value = result.data.map(msg => ({
            id: msg.id,
            userId: msg.user_id,
            username: msg.user_id === currentUser.id ? 'You' : `User ${msg.user_id}`,
            message: msg.message,
            createdAt: msg.created_at,
            isRead: msg.is_read
          }));
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    const sendMessage = () => {
      const message = inputMessage.value.trim();
      if (!message || !isConnected.value) return;
      
      socket.emit('message:send', {
        roomId: currentRoom.id,
        userId: currentUser.id,
        username: currentUser.username,
        message: message
      });
      
      inputMessage.value = '';
      stopTyping();
    };

    const handleTyping = () => {
      if (inputMessage.value) {
        socket.emit('typing:start', {
          roomId: currentRoom.id,
          userId: currentUser.id,
          username: currentUser.username
        });
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(stopTyping, 2000);
      } else {
        stopTyping();
      }
    };

    const stopTyping = () => {
      socket.emit('typing:stop', {
        roomId: currentRoom.id,
        userId: currentUser.id,
        username: currentUser.username
      });
      clearTimeout(typingTimeout);
    };

    const addSystemMessage = (text) => {
      messages.value.push({
        id: Date.now(),
        type: 'system',
        message: text,
        createdAt: new Date().toISOString()
      });
      scrollToBottom();
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Lifecycle
    onMounted(() => {
      setupSocket();
    });

    onUnmounted(() => {
      if (socket) {
        socket.emit('room:leave', {
          roomId: currentRoom.id,
          userId: currentUser.id
        });
        socket.disconnect();
      }
    });

    return {
      messages,
      inputMessage,
      onlineUsers,
      typingUsers,
      isConnected,
      messagesContainer,
      currentUser,
      currentRoom,
      sendMessage,
      handleTyping,
      formatTime
    };
  }
};
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 20px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  background: #075e54;
  color: white;
  padding: 15px;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
}

.status {
  font-size: 12px;
  margin-top: 5px;
}

.online { color: #25d366; }
.offline { color: #ff9800; }

.messages {
  height: 500px;
  overflow-y: auto;
  padding: 20px;
  background: #e5ddd5;
}

.message {
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
  max-width: 70%;
}

.message.own {
  background: #dcf8c6;
  margin-left: auto;
  text-align: right;
}

.message.other {
  background: white;
}

.message.system {
  text-align: center;
  color: #999;
  font-size: 12px;
  background: transparent;
  padding: 5px;
  max-width: 100%;
}

.username {
  font-weight: bold;
  font-size: 12px;
  color: #075e54;
  margin-bottom: 5px;
}

.text {
  font-size: 14px;
}

.time {
  font-size: 11px;
  color: #999;
  margin-top: 5px;
}

.typing {
  padding: 10px 20px;
  font-size: 13px;
  color: #666;
  font-style: italic;
  background: #f0f0f0;
}

.input-container {
  display: flex;
  padding: 15px;
  background: #f0f0f0;
  border-top: 1px solid #ddd;
}

input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 25px;
  outline: none;
  font-size: 14px;
}

button {
  margin-left: 10px;
  padding: 12px 25px;
  background: #075e54;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

---

## 📝 Tutorial Step-by-Step

### Tutorial 1: Membuat Chat Room Pertama

#### Step 1: Setup Database
```sql
-- Jalankan di Supabase SQL Editor
-- Lihat section "Setup Database" di atas
```

#### Step 2: Start Server
```bash
cd viber
npm install
npm run dev
```

Server akan berjalan di `http://localhost:8080`

#### Step 3: Buat Room via API

Gunakan Postman atau curl:
```bash
curl -X POST http://localhost:8080/api/v1/chat/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Room",
    "type": "group",
    "created_by": 1
  }'
```

Response:
```json
{
  "status": true,
  "message": "Chat room created successfully",
  "data": {
    "id": 1,
    "name": "My First Room",
    "type": "group",
    "created_by": 1
  }
}
```

#### Step 4: Test dengan HTML Client

1. Copy HTML code dari section "Vanilla JavaScript" di atas
2. Save sebagai `chat.html`
3. Update `CONFIG` dengan room ID yang baru dibuat
4. Buka di browser

#### Step 5: Test Multi-User

1. Buka `chat.html` di 2 tab/browser berbeda
2. Ubah `userId` di CONFIG untuk setiap tab (misal: 1 dan 2)
3. Kirim pesan dari tab 1
4. Pesan akan muncul realtime di tab 2!

### Tutorial 2: Integrasi dengan React App

#### Step 1: Install Dependencies

```bash
npm install socket.io-client
```

#### Step 2: Create Socket Service

```javascript
// src/services/socket.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(serverUrl = 'http://localhost:8080') {
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
```

#### Step 3: Create Chat Hook

```javascript
// src/hooks/useChat.js
import { useState, useEffect } from 'react';
import socketService from '../services/socket';

export const useChat = (userId, username, roomId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user:join', { userId, username });
      socket.emit('room:join', { roomId, userId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message:receive', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.emit('room:leave', { roomId, userId });
      socketService.disconnect();
    };
  }, [userId, username, roomId]);

  const sendMessage = (message) => {
    const socket = socketService.getSocket();
    if (socket && isConnected) {
      socket.emit('message:send', {
        roomId,
        userId,
        username,
        message
      });
    }
  };

  return { messages, sendMessage, isConnected };
};
```

#### Step 4: Use in Component

```javascript
// src/components/Chat.jsx
import { useState } from 'react';
import { useChat } from '../hooks/useChat';

function Chat({ userId, username, roomId }) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isConnected } = useChat(userId, username, roomId);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default Chat;
```

---

## 🧪 Testing & Debugging

### 1. Test REST API Endpoints

#### Get All Rooms
```bash
curl http://localhost:8080/api/v1/chat/rooms
```

#### Create Room
```bash
curl -X POST http://localhost:8080/api/v1/chat/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","type":"group","created_by":1}'
```

#### Get Messages
```bash
curl http://localhost:8080/api/v1/chat/rooms/1/messages?limit=10
```

#### Get User's Rooms
```bash
curl http://localhost:8080/api/v1/chat/users/1/rooms
```

#### Get Unread Count
```bash
curl http://localhost:8080/api/v1/chat/users/1/unread
```

### 2. Test Socket.IO Events

#### Using Browser Console

```javascript
// Connect
const socket = io('http://localhost:8080');

// Join
socket.emit('user:join', { userId: 1, username: 'TestUser' });
socket.emit('room:join', { roomId: 1, userId: 1 });

// Send message
socket.emit('message:send', {
  roomId: 1,
  userId: 1,
  username: 'TestUser',
  message: 'Test message'
});

// Listen for messages
socket.on('message:receive', console.log);
socket.on('users:online', console.log);
```

### 3. Debug Mode

Enable debug logging di client:

```javascript
localStorage.debug = 'socket.io-client:socket';
```

Enable debug di server (`src/index.js`):

```javascript
import { Server } from "socket.io";

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  // Enable debug
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Log all events
io.on("connection", (socket) => {
  console.log(`[DEBUG] New connection: ${socket.id}`);
  
  socket.onAny((eventName, ...args) => {
    console.log(`[DEBUG] Event: ${eventName}`, args);
  });
});
```

### 4. Common Issues & Solutions

| Issue | Penyebab | Solusi |
|-------|----------|--------|
| Connection failed | CORS atau server tidak jalan | Pastikan server running dan CORS di-enable |
| Messages tidak sampai | Belum join room | Emit `room:join` sebelum send message |
| Duplicate messages | Multiple socket connections | Pastikan cleanup di useEffect |
| Typing indicator stuck | Event `typing:stop` tidak terkirim | Tambah debounce/timeout |
| Database error | Table belum dibuat | Jalankan `database_schema.sql` |

---

## ✅ Best Practices

### 1. Security

```javascript
// Validate user before join
socket.on('user:join', async ({ userId, username }) => {
  // TODO: Verify JWT token
  // TODO: Check user exists in database
  // TODO: Validate permissions
});

// Sanitize messages
import DOMPurify from 'isomorphic-dompurify';

socket.on('message:send', async (data) => {
  const sanitizedMessage = DOMPurify.sanitize(data.message);
  // Save sanitized message
});
```

### 2. Performance

```javascript
// Limit message history
const messages = await chatModel.getMessagesByRoom(roomId, 50); // Max 50

// Implement pagination
GET /api/v1/chat/rooms/1/messages?limit=20&offset=40

// Debounce typing indicator
let typingTimeout;
input.addEventListener('input', () => {
  clearTimeout(typingTimeout);
  socket.emit('typing:start', {});
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', {});
  }, 2000);
});
```

### 3. Error Handling

```javascript
// Wrap socket emits with try-catch
const sendMessage = async (message) => {
  try {
    socket.emit('message:send', {
      roomId,
      userId,
      message
    });
  } catch (error) {
    console.error('Failed to send:', error);
    showErrorNotification('Failed to send message');
  }
};

// Handle disconnection gracefully
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, try reconnect
    socket.connect();
  }
  showNotification('Connection lost. Reconnecting...');
});
```

### 4. State Management

```javascript
// Use React Context for global chat state
import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  return (
    <ChatContext.Provider value={{ activeRoom, setActiveRoom, unreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat Context = () => useContext(ChatContext);
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to Socket.IO"

**Checklist:**
1. ✅ Server running? `npm run dev`
2. ✅ Port benar? Default: 8080
3. ✅ CORS enabled di server?
4. ✅ Client URL benar?

**Solution:**
```javascript
// Check server logs
console.log('Server running on port', port);

// Check client connection
const socket = io('http://localhost:8080', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Problem: "Messages tidak realtime"

**Checklist:**
1. ✅ Sudah join room? `socket.emit('room:join', ...)`
2. ✅ Event listener sudah setup?
3. ✅ RoomId sama?

**Solution:**
```javascript
// Verify room join
socket.on('user:joined', (data) => {
  console.log('Joined room:', data.roomId);
});

// Check event listener
socket.on('message:receive', (data) => {
  console.log('Message received:', data);
});
```

### Problem: "Database error saat send message"

**Checklist:**
1. ✅ Tables sudah dibuat?
2. ✅ Supabase credentials benar?
3. ✅ Room exists?

**Solution:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check room exists
SELECT * FROM chat_rooms WHERE id = 1;
```

### Problem: "Typing indicator tidak hilang"

**Solution:**
```javascript
// Add timeout to auto-stop typing
let typingTimeout;

const handleTyping = () => {
  socket.emit('typing:start', {});
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', {});
  }, 3000); // Auto stop after 3s
};

// Stop on blur
input.addEventListener('blur', () => {
  socket.emit('typing:stop', {});
  clearTimeout(typingTimeout);
});
```

---

## 📚 Referensi Tambahan

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Hooks](https://react.dev/reference/react)

---

## 🎯 Next Steps

### Fitur yang Bisa Ditambahkan:

1. **File Upload** - Share images, documents
2. **Voice Messages** - Record dan kirim voice notes
3. **Video Call** - Integration dengan WebRTC
4. **Message Reactions** - Emoji reactions
5. **Message Edit/Delete** - Edit pesan yang sudah terkirim
6. **Push Notifications** - Notifikasi untuk new messages
7. **User Mentions** - @mention users
8. **Message Search** - Search messages in history
9. **Threads/Replies** - Reply to specific messages
10. **Group Admin** - Manage permissions

---

**Selamat Mencoba! 🚀**

Untuk bantuan lebih lanjut, lihat dokumentasi lengkap di: `http://localhost:8080/api-docs`
