/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Notification ID
 *         user_id:
 *           type: integer
 *           description: User ID who receives the notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message content
 *         type:
 *           type: string
 *           enum: [info, warning, error, success]
 *           description: Notification type
 *         related_ticket_id:
 *           type: integer
 *           nullable: true
 *           description: Related ticket ID (if applicable)
 *         is_read:
 *           type: boolean
 *           description: Whether notification has been read
 *         read_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When notification was read
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When notification was created
 *       example:
 *         id: 1
 *         user_id: 5
 *         title: "🎫 Tiket Baru Masuk"
 *         message: "Tiket baru telah dibuat dengan ID #123"
 *         type: "info"
 *         related_ticket_id: 123
 *         is_read: false
 *         read_at: null
 *         created_at: "2024-01-15T10:30:00Z"
 *
 *     WhatsAppStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         connected:
 *           type: boolean
 *       example:
 *         status: true
 *         message: "WhatsApp connected"
 *         connected: true
 */

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification management and WhatsApp integration
 */

/**
 * @swagger
 * /api/v1/notifications/users/{userId}:
 *   get:
 *     summary: Get all notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of notifications to retrieve
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/users/{userId}/unread:
 *   get:
 *     summary: Get unread notifications count for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
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
 *             example:
 *               status: true
 *               message: "Unread count retrieved successfully"
 *               data:
 *                 count: 5
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
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
 *                   $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/tickets/{ticketId}:
 *   get:
 *     summary: Get all notifications for a specific ticket
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket notifications retrieved successfully
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
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                   $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/users/{userId}/read-all:
 *   put:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               status: true
 *               message: "Notification deleted successfully"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/whatsapp/qr:
 *   get:
 *     summary: Get WhatsApp QR code for authentication
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 qr:
 *                   type: string
 *                   description: QR code string (if not connected)
 *                 connected:
 *                   type: boolean
 *             example:
 *               status: true
 *               message: "QR code generated"
 *               qr: "2@abc123..."
 *               connected: false
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/whatsapp/status:
 *   get:
 *     summary: Check WhatsApp connection status
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhatsAppStatus'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/whatsapp/logout:
 *   post:
 *     summary: Logout from WhatsApp
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               status: true
 *               message: "WhatsApp logged out successfully"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/notifications/whatsapp/test:
 *   post:
 *     summary: Test send WhatsApp message
 *     tags: [Notifications]
 *     description: Mengirim pesan WhatsApp test. Bisa menggunakan phoneNumber langsung atau userId untuk mengambil nomor dari database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number with country code (e.g., "6281234567890"). Required if userId not provided.
 *               userId:
 *                 type: integer
 *                 description: User ID to fetch phone number from database. Required if phoneNumber not provided.
 *               message:
 *                 type: string
 *                 description: Message to send
 *             example:
 *               userId: 1
 *               message: "Test message from SILADAN"
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                     success:
 *                       type: boolean
 *                     messageId:
 *                       type: string
 *                     to:
 *                       type: string
 *       400:
 *         description: Bad request (missing parameters, WhatsApp not connected, or user has no phone number)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

export default {};
