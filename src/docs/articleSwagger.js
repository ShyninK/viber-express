/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Knowledge base articles management
 */

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Get all articles
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: kategori_artikel
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: target_pembaca
 *         schema:
 *           type: string
 *         description: Filter by target reader
 *       - in: query
 *         name: kata_kunci
 *         schema:
 *           type: string
 *         description: Filter by keyword
 *     responses:
 *       200:
 *         description: Articles retrieved successfully
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
 *                     $ref: '#/components/schemas/Article'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles/search:
 *   get:
 *     summary: Search articles by keyword
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Articles searched successfully
 *       400:
 *         description: Keyword is required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Get article by ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article retrieved successfully
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
 *                   $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles/ticket/{ticketId}:
 *   get:
 *     summary: Get articles by ticket ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Articles retrieved successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles:
 *   post:
 *     summary: Create new article
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul_artikel
 *               - kategori_artikel
 *               - target_pembaca
 *               - kata_kunci
 *               - deskripsi_artikel
 *               - penyelesaian
 *             properties:
 *               id_ticket:
 *                 type: integer
 *               judul_artikel:
 *                 type: string
 *               kategori_artikel:
 *                 type: string
 *               target_pembaca:
 *                 type: string
 *               kata_kunci:
 *                 type: string
 *               deskripsi_artikel:
 *                 type: string
 *               penyebab:
 *                 type: string
 *               penyelesaian:
 *                 type: string
 *               lampiran:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Article created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   put:
 *     summary: Update article
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_ticket:
 *                 type: integer
 *               judul_artikel:
 *                 type: string
 *               kategori_artikel:
 *                 type: string
 *               target_pembaca:
 *                 type: string
 *               kata_kunci:
 *                 type: string
 *               deskripsi_artikel:
 *                 type: string
 *               penyebab:
 *                 type: string
 *               penyelesaian:
 *                 type: string
 *               lampiran:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   delete:
 *     summary: Delete article (soft delete)
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article deleted successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         id_artikel:
 *           type: integer
 *         id_ticket:
 *           type: integer
 *         judul_artikel:
 *           type: string
 *         kategori_artikel:
 *           type: string
 *         target_pembaca:
 *           type: string
 *         kata_kunci:
 *           type: string
 *         deskripsi_artikel:
 *           type: string
 *         penyebab:
 *           type: string
 *         penyelesaian:
 *           type: string
 *         lampiran:
 *           type: string
 *         created_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 */
