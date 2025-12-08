/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated room ID
 *         name:
 *           type: string
 *           description: Nama chat room
 *         type:
 *           type: string
 *           enum: [direct, group]
 *           description: Tipe room (direct message atau group chat)
 *           default: group
 *         created_by:
 *           type: integer
 *           description: ID user yang membuat room
 *         last_message:
 *           type: string
 *           description: Pesan terakhir di room
 *         last_message_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pesan terakhir
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         name: "General Discussion"
 *         type: "group"
 *         created_by: 1
 *         last_message: "Hello everyone!"
 *         last_message_at: "2025-12-07T10:30:00Z"
 *
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated message ID
 *         room_id:
 *           type: integer
 *           description: ID room tempat pesan dikirim
 *         user_id:
 *           type: integer
 *           description: ID user pengirim
 *         message:
 *           type: string
 *           description: Isi pesan
 *         is_read:
 *           type: boolean
 *           description: Status sudah dibaca
 *           default: false
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pesan dibaca
 *         created_at:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         room_id: 1
 *         user_id: 2
 *         message: "Hello everyone!"
 *         is_read: false
 *         created_at: "2025-12-07T10:30:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: API untuk realtime chat dengan Socket.IO
 */

/**
 * @swagger
 * /api/v1/chat/rooms:
 *   get:
 *     summary: Mendapatkan semua chat rooms
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan list chat rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatRoom'
 *
 *   post:
 *     summary: Membuat chat room baru
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "General Discussion"
 *               type:
 *                 type: string
 *                 enum: [direct, group]
 *                 default: group
 *               created_by:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Chat room berhasil dibuat
 *       400:
 *         description: Data tidak valid
 */

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}:
 *   get:
 *     summary: Mendapatkan detail chat room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chat room
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail room
 *       404:
 *         description: Room tidak ditemukan
 */

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Mendapatkan pesan-pesan dalam room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chat room
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Jumlah pesan yang ingin diambil
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan pesan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 */

/**
 * @swagger
 * /api/v1/chat/users/{userId}/rooms:
 *   get:
 *     summary: Mendapatkan chat rooms milik user
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan rooms user
 */

/**
 * @swagger
 * /api/v1/chat/users/{userId}/unread:
 *   get:
 *     summary: Mendapatkan jumlah pesan belum dibaca
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/participants:
 *   post:
 *     summary: Menambahkan participant ke room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chat room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Participant berhasil ditambahkan
 */
