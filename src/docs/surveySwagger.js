/**
 * @swagger
 * tags:
 *   name: Surveys
 *   description: Survey management endpoints
 */

/**
 * @swagger
 * /api/v1/surveys:
 *   get:
 *     summary: Get all surveys
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: List of all surveys with ticket details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Survey'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/surveys/{id}:
 *   get:
 *     summary: Get survey by ID
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Survey'
 *       404:
 *         description: Survey not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Survey tidak ditemukan
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/surveys/my-surveys:
 *   get:
 *     summary: Get surveys by current user
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's surveys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Survey'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/surveys/check/{ticket_id}:
 *   get:
 *     summary: Check if ticket has survey (one-to-one)
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticket_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID to check
 *     responses:
 *       200:
 *         description: Survey status for ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hasSurvey:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/surveys:
 *   post:
 *     summary: Submit a new survey
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *               - rating
 *               - feedback
 *             properties:
 *               ticket_id:
 *                 type: integer
 *                 example: 123
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               feedback:
 *                 type: string
 *                 example: Pelayanan sangat baik dan cepat
 *               category:
 *                 type: string
 *                 nullable: true
 *                 example: Complaint
 *     responses:
 *       201:
 *         description: Survey created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Survey berhasil dibuat
 *                 data:
 *                   $ref: '#/components/schemas/Survey'
 *       400:
 *         description: Ticket already has survey (one-to-one constraint)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Tiket ini sudah memiliki survey
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Survey:
 *       type: object
 *       properties:
 *         id_surveys:
 *           type: integer
 *           example: 1
 *         ticket_id:
 *           type: integer
 *           example: 123
 *         created_by:
 *           type: integer
 *           example: 45
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         feedback:
 *           type: string
 *           example: Pelayanan sangat memuaskan
 *         category:
 *           type: string
 *           nullable: true
 *           example: Service
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-12-04T10:30:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-12-04T10:30:00Z
 *         ticket:
 *           type: object
 *           nullable: true
 *           description: Associated ticket details (manual join)
 *         creator:
 *           type: object
 *           nullable: true
 *           description: User who created the survey (manual join)
 *           properties:
 *             id:
 *               type: integer
 *             username:
 *               type: string
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Error message
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
