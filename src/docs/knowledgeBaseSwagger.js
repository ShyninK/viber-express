/**
 * @swagger
 * tags:
 *   name: Knowledge Base
 *   description: Knowledge base management endpoints
 */

/**
 * @swagger
 * /api/v1/knowledge-base:
 *   get:
 *     summary: Get all knowledge base
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of knowledge base
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
 *                     $ref: '#/components/schemas/KnowledgeBase'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/knowledge-base/{id}:
 *   get:
 *     summary: Get knowledge base by ID
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Knowledge base ID
 *     responses:
 *       200:
 *         description: Knowledge base details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/KnowledgeBase'
 *       404:
 *         description: Knowledge base not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/knowledge-base:
 *   post:
 *     summary: Create new knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul_kb
 *               - deskripsi_kb
 *             properties:
 *               judul_kb:
 *                 type: string
 *                 example: Cara Reset Password
 *               kategori_kb:
 *                 type: string
 *                 example: Tutorial
 *               deskripsi_kb:
 *                 type: string
 *                 example: Panduan lengkap untuk reset password akun
 *     responses:
 *       201:
 *         description: Knowledge base created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Knowledge base berhasil dibuat
 *                 data:
 *                   $ref: '#/components/schemas/KnowledgeBase'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/knowledge-base/{id}:
 *   put:
 *     summary: Update knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Knowledge base ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul_kb:
 *                 type: string
 *                 example: Cara Reset Password - Updated
 *               kategori_kb:
 *                 type: string
 *                 example: Tutorial
 *               deskripsi_kb:
 *                 type: string
 *                 example: Panduan update reset password
 *               is_active:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Knowledge base updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Knowledge base berhasil diupdate
 *                 data:
 *                   $ref: '#/components/schemas/KnowledgeBase'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/knowledge-base/{id}/deactivate:
 *   patch:
 *     summary: Deactivate knowledge base (soft delete)
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Knowledge base ID
 *     responses:
 *       200:
 *         description: Knowledge base deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Knowledge base berhasil dinonaktifkan
 *                 data:
 *                   $ref: '#/components/schemas/KnowledgeBase'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/knowledge-base/{id}:
 *   delete:
 *     summary: Delete knowledge base permanently (hard delete)
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Knowledge base ID
 *     responses:
 *       200:
 *         description: Knowledge base deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Knowledge base berhasil dihapus permanen
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KnowledgeBase:
 *       type: object
 *       properties:
 *         id_kb:
 *           type: integer
 *           example: 1
 *         judul_kb:
 *           type: string
 *           example: Cara Reset Password
 *         kategori_kb:
 *           type: string
 *           example: Tutorial
 *         deskripsi_kb:
 *           type: string
 *           example: Panduan lengkap untuk reset password akun
 *         created_by:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         updated_by:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-12-04T10:30:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-12-04T10:30:00Z
 *         is_active:
 *           type: integer
 *           example: 1
 *           description: 1 = active, 0 = inactive
 */
