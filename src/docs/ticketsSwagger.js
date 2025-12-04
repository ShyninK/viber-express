/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID dari ticket
 *         title:
 *           type: string
 *           description: Judul ticket
 *         description:
 *           type: string
 *           description: Deskripsi detail dari ticket
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *           description: Status ticket
 *           default: open
 *         assigned_to:
 *           type: integer
 *           description: ID user yang ditugaskan
 *         created_by:
 *           type: integer
 *           description: ID user yang membuat ticket
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu ticket dibuat
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Waktu ticket terakhir diupdate
 *       example:
 *         id: 1
 *         title: "Test Tiket Notifikasi"
 *         description: "Ini test realtime"
 *         status: "open"
 *         assigned_to: 1
 *         created_by: 2
 *         created_at: "2025-12-04T10:00:00Z"
 *         updated_at: "2025-12-04T10:00:00Z"
 *
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID dari notification
 *         user_id:
 *           type: integer
 *           description: ID user penerima notifikasi
 *         type:
 *           type: string
 *           description: Tipe notifikasi (new_ticket, ticket_status_update, dll)
 *         title:
 *           type: string
 *           description: Judul notifikasi
 *         message:
 *           type: string
 *           description: Pesan notifikasi
 *         reference_id:
 *           type: integer
 *           description: ID referensi (misal ticket_id)
 *         reference_type:
 *           type: string
 *           description: Tipe referensi (misal 'ticket')
 *         is_read:
 *           type: boolean
 *           description: Status sudah dibaca atau belum
 *           default: false
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: Waktu notifikasi dibaca
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu notifikasi dibuat
 *       example:
 *         id: 1
 *         user_id: 1
 *         type: "new_ticket"
 *         title: "Tiket Baru Ditugaskan"
 *         message: "Anda mendapat tiket baru: Test Tiket Notifikasi"
 *         reference_id: 1
 *         reference_type: "ticket"
 *         is_read: false
 *         created_at: "2025-12-04T10:00:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: API untuk manajemen tickets
 *   - name: Notifications
 *     description: API untuk manajemen notifications
 */

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     summary: Mendapatkan semua tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan list tickets
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
 *                     $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Membuat ticket baru (OTOMATIS TRIGGER NOTIFIKASI)
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Test Tiket Notifikasi"
 *               description:
 *                 type: string
 *                 example: "Ini test realtime"
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 default: open
 *               assigned_to:
 *                 type: integer
 *                 example: 1
 *               created_by:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Ticket berhasil dibuat dan notifikasi otomatis terkirim
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
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   get:
 *     summary: Mendapatkan ticket berdasarkan ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID ticket
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan ticket
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
 *                   $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket tidak ditemukan
 *
 *   put:
 *     summary: Update ticket (OTOMATIS TRIGGER NOTIFIKASI jika status berubah)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               assigned_to:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ticket berhasil diupdate
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Update sebagian data ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               assigned_to:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ticket berhasil diupdate
 *
 *   delete:
 *     summary: Hapus ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID ticket
 *     responses:
 *       200:
 *         description: Ticket berhasil dihapus
 */

/**
 * @swagger
 * /api/v1/tickets/status/{status}:
 *   get:
 *     summary: Mendapatkan tickets berdasarkan status
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         required: true
 *         description: Status ticket
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan tickets
 */

/**
 * @swagger
 * /api/v1/tickets/assigned/{userId}:
 *   get:
 *     summary: Mendapatkan tickets yang ditugaskan ke user tertentu
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan tickets
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Mendapatkan semua notifications untuk user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan notifications
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
 *                     $ref: '#/components/schemas/Notification'
 */

/**
 * @swagger
 * /api/v1/notifications/unread:
 *   get:
 *     summary: Mendapatkan notifications yang belum dibaca
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan unread notifications
 */

/**
 * @swagger
 * /api/v1/notifications/unread/count:
 *   get:
 *     summary: Mendapatkan jumlah notifications yang belum dibaca
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan count
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
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Tandai notification sebagai sudah dibaca
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID notification
 *     responses:
 *       200:
 *         description: Notification berhasil ditandai sebagai dibaca
 */

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Tandai semua notifications sebagai sudah dibaca
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Semua notifications berhasil ditandai sebagai dibaca
 */

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Hapus notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID notification
 *     responses:
 *       200:
 *         description: Notification berhasil dihapus
 */

/**
 * @swagger
 * /api/v1/notifications/read/clear:
 *   delete:
 *     summary: Hapus semua notifications yang sudah dibaca
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Read notifications berhasil dihapus
 */
