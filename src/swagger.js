const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "SILADAN APP API",
    version: "2.0.0",
    description:
      "Dokumentasi API lengkap untuk sistem Service Desk. API ini mengelola insiden, permintaan layanan, basis pengetahuan, dan pengguna. Semua response dibungkus dalam format standar JSON.",
    contact: {
      name: "Contact Developer Ganteng",
      url: "http://wa.me/+6281357571468",
    },
  },
  servers: [
    {
      url: "https://manpro-473802.et.r.appspot.com/api/v1",
      description: "Production Server",
    },
    {
      url: "https://siladan-app.onrender.com/api/v1",
      description: "Secondary Production Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT yang didapat dari endpoint /auth/login",
      },
    },
    // ==========================================
    // SCHEMAS (DATA MODELS)
    // ==========================================
    schemas: {
      // --- WRAPPERS ---
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Deskripsi error yang terjadi" },
        },
      },
      PaginationInfo: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 150 },
          total_pages: { type: "integer", example: 8 },
        },
      },

      // --- AUTH & USER ---
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin_kota" },
          password: {
            type: "string",
            example: "password123",
            format: "password",
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "password", "email", "full_name"],
        properties: {
          username: { type: "string", example: "warga01" },
          password: {
            type: "string",
            example: "rahasia123",
            format: "password",
          },
          email: {
            type: "string",
            format: "email",
            example: "warga@email.com",
          },
          full_name: { type: "string", example: "Warga Teladan" },
          nip: {
            type: "string",
            example: "3201123456780001",
            description: "NIK untuk publik, NIP untuk pegawai",
          },
          phone: { type: "string", example: "08123456789" },
          address: { type: "string", example: "Jl. Sudirman No. 10" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string" },
          full_name: { type: "string" },
          nip: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          role: {
            type: "string",
            enum: [
              "super_admin",
              "admin_kota",
              "admin_opd",
              "bidang",
              "seksi",
              "helpdesk",
              "teknisi",
              "pegawai_opd",
              "pengguna",
            ],
          },
          opd: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          bidang: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          seksi: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          is_active: { type: "boolean" },
          last_login_at: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
        },
      },

      // --- INCIDENTS & REQUESTS (TICKETS) ---
      IncidentCreateAuth: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string", example: "Koneksi Internet Putus" },
          description: {
            type: "string",
            example: "Wifi di lantai 3 tidak bisa connect sejak pagi.",
          },
          category: { type: "string", example: "Jaringan", default: "Umum" },
          incident_location: {
            type: "string",
            example: "Gedung B, Ruang Rapat",
          },
          incident_date: {
            type: "string",
            format: "date",
            example: "2023-10-27",
          },
          opd_id: {
            type: "integer",
            description:
              "Isi jika melapor untuk OPD lain. Jika kosong, akan menggunakan OPD pelapor.",
          },
          asset_identifier: { type: "string", example: "RT-001" },
          attachment_url: {
            type: "string",
            example: "https://storage.com/img.jpg",
          },
        },
      },
      IncidentCreatePublic: {
        type: "object",
        required: [
          "title",
          "description",
          "opd_id",
          "reporter_name",
          "reporter_email",
          "reporter_phone",
        ],
        properties: {
          title: { type: "string", example: "Lampu Taman Mati" },
          description: {
            type: "string",
            example: "Lampu taman kota mati total.",
          },
          category: { type: "string", default: "Umum" },
          incident_location: {
            type: "string",
            example: "Taman Kota Sisi Utara",
          },
          opd_id: { type: "integer", example: 5 },
          asset_identifier: { type: "string" },
          reporter_name: { type: "string", example: "Budi Santoso" },
          reporter_email: {
            type: "string",
            format: "email",
            example: "budi@gmail.com",
          },
          reporter_phone: { type: "string", example: "08123456789" },
          reporter_nik: { type: "string", example: "3271000000000001" },
          reporter_address: { type: "string" },
          attachment_url: { type: "string" },
        },
      },
      RequestCreate: {
        type: "object",
        required: ["title", "description", "service_item_id"],
        properties: {
          title: { type: "string", example: "Permintaan Email Dinas" },
          description: {
            type: "string",
            example: "Mohon dibuatkan email untuk pegawai baru.",
          },
          service_item_id: {
            type: "string",
            format: "uuid",
            example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          },
          service_detail: {
            type: "object",
            example: { username_request: "budi.s", unit: "Keuangan" },
            description: "JSON object dinamis sesuai form layanan",
          },
          attachment_url: { type: "string" },
          requested_date: { type: "string", format: "date" },
        },
      },
      TicketDetailResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticket_number: { type: "string", example: "INC-2023-1234" },
          type: { type: "string", enum: ["incident", "request"] },
          title: { type: "string" },
          description: { type: "string" },
          urgency: { type: "integer" },
          impact: { type: "integer" },
          priority_score: { type: "integer" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "major"],
          },
          category: { type: "string" },
          status: {
            type: "string",
            enum: [
              "open",
              "verified",
              "assigned",
              "in_progress",
              "resolved",
              "closed",
              "pending_approval",
              "rejected",
              "merged",
            ],
          },
          verification_status: {
            type: "string",
            enum: ["pending", "verified", "rejected"],
          },
          incident_location: { type: "string" },
          incident_date: { type: "string", format: "date" },
          reporter_nip: { type: "string" },
          asset_name_reported: { type: "string" },
          reporter_attachment_url: { type: "string" },
          resolution: { type: "string" },
          resolved_at: { type: "string", format: "date-time" },
          closed_at: { type: "string", format: "date-time" },
          sla_due: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          // Relations
          reporter: { $ref: "#/components/schemas/UserResponse" },
          recorder: { $ref: "#/components/schemas/UserResponse" },
          verifier: { $ref: "#/components/schemas/UserResponse" },
          technician: { $ref: "#/components/schemas/UserResponse" },
          opd: { $ref: "#/components/schemas/OPDResponse" },
          bidang: { $ref: "#/components/schemas/BidangResponse" },
          seksi: { $ref: "#/components/schemas/SeksiResponse" },
          service_catalog: { $ref: "#/components/schemas/ServiceCatalogItem" },
          service_item: { $ref: "#/components/schemas/ServiceItem" },
          // Related data arrays
          attachments: { type: "array", items: { type: "object" } },
          progress_updates: {
            type: "array",
            items: { $ref: "#/components/schemas/ProgressUpdate" },
          },
          comments: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketComment" },
          },
          logs: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketLog" },
          },
          approvals: {
            type: "array",
            items: { $ref: "#/components/schemas/ApprovalWorkflow" },
          },
        },
      },
      TicketListResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticket_number: { type: "string", example: "INC-2023-1234" },
          title: { type: "string" },
          type: { type: "string", enum: ["incident", "request"] },
          status: {
            type: "string",
            enum: [
              "open",
              "verified",
              "assigned",
              "in_progress",
              "resolved",
              "closed",
              "pending_approval",
              "rejected",
              "merged",
            ],
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "major"],
          },
          category: { type: "string" },
          sla_due: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
          // Simplified relations for list view
          reporter: {
            type: "object",
            properties: {
              id: { type: "string" },
              full_name: { type: "string" },
            },
          },
          technician: {
            type: "object",
            properties: {
              id: { type: "string" },
              full_name: { type: "string" },
            },
          },
          opd: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
        },
      },
      ProgressUpdate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          update_number: { type: "integer" },
          status_change: { type: "string" },
          reason: { type: "string" },
          problem_detail: { type: "string" },
          handling_description: { type: "string" },
          final_solution: { type: "string" },
          updated_by_user: { $ref: "#/components/schemas/UserResponse" },
          update_time: { type: "string", format: "date-time" },
        },
      },
      TicketComment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string" },
          is_internal: { type: "boolean" },
          user: { $ref: "#/components/schemas/UserResponse" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      TicketLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticket_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          action: { type: "string" },
          description: { type: "string" },
          user: {
            type: "object",
            properties: {
              username: { type: "string" },
              full_name: { type: "string" },
            },
          },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ApprovalWorkflow: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticket_id: { type: "string", format: "uuid" },
          workflow_level: { type: "integer" },
          approver_role: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          approver_id: { type: "string", format: "uuid" },
          notes: { type: "string" },
          responded_at: { type: "string", format: "date-time" },
        },
      },

      // --- ACTIONS (PROGRESS, COMMENT) ---
      ProgressUpdateInput: {
        type: "object",
        required: ["update_number", "status_change"],
        properties: {
          update_number: { type: "integer", example: 1 },
          status_change: {
            type: "string",
            example: "Sedang ditangani",
            description:
              "Label status yang akan muncul di riwayat (misal: 'Sedang ditangani', 'Selesai')",
          },
          reason: { type: "string", example: "Sedang dikerjakan teknisi" },
          problem_detail: { type: "string" },
          handling_description: {
            type: "string",
            example: "Melakukan restart router",
          },
          final_solution: {
            type: "string",
            description:
              "Wajib diisi jika status akhir adalah 'Selesai' atau 'Ditutup'",
          },
        },
      },
      CommentInput: {
        type: "object",
        required: ["content"],
        properties: {
          content: {
            type: "string",
            example: "Mohon update estimasi waktunya.",
          },
          is_internal: {
            type: "boolean",
            default: false,
            description:
              "Jika true, hanya terlihat oleh staff (role selain pengguna)",
          },
        },
      },

      // --- KNOWLEDGE BASE ---
      ArticleInput: {
        type: "object",
        required: ["title", "content"],
        properties: {
          title: { type: "string", example: "Cara Mengatasi Printer Error" },
          content: {
            type: "string",
            example: "<p>Langkah 1: Cek kabel...</p>",
          },
          category: { type: "string", example: "Hardware" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["printer", "error", "guide"],
          },
          opd_id: { type: "integer" },
        },
      },
      KBArticle: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          content: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          view_count: { type: "integer" },
          status: { type: "string", enum: ["draft", "published"] },
          author: { $ref: "#/components/schemas/UserResponse" },
          opd: { $ref: "#/components/schemas/OPDResponse" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },

      // --- SERVICE CATALOG ---
      ServiceCatalogResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          count: { type: "integer" },
          catalogs: {
            type: "array",
            items: { $ref: "#/components/schemas/ServiceCatalogItem" },
          },
        },
      },
      ServiceCatalogItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          catalog_name: { type: "string" },
          description: { type: "string" },
          opd_id: { type: "integer" },
          is_active: { type: "boolean" },
          sub_layanan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                sub_catalog_name: { type: "string" },
                description: { type: "string" },
                approval_required: { type: "boolean" },
                service_items: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ServiceItem" },
                },
              },
            },
          },
          total_items: { type: "integer" },
        },
      },
      ServiceItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          item_name: { type: "string" },
        },
      },

      // --- ADMIN & MASTER DATA ---
      UserCreateAdmin: {
        type: "object",
        required: ["username", "password", "email", "role", "full_name"],
        properties: {
          username: { type: "string" },
          password: { type: "string", format: "password" },
          email: { type: "string", format: "email" },
          full_name: { type: "string" },
          role: {
            type: "string",
            enum: [
              "super_admin",
              "admin_kota",
              "admin_opd",
              "bidang",
              "seksi",
              "helpdesk",
              "teknisi",
              "pegawai_opd",
            ],
          },
          opd_id: { type: "integer" },
          bidang_id: { type: "integer" },
          seksi_id: { type: "integer" },
          nip: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
        },
      },
      OPDResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          code: { type: "string" },
          address: { type: "string" },
          is_active: { type: "boolean" },
        },
      },
      BidangResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
      SeksiResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
      PublicTicketTrackResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              ticket_info: {
                type: "object",
                properties: {
                  ticket_number: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" },
                  category: { type: "string" },
                  opd_name: { type: "string" },
                  location: { type: "string" },
                  reporter_name: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                  last_updated: { type: "string", format: "date-time" },
                },
              },
              timeline: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    update_time: { type: "string", format: "date-time" },
                    status_change: { type: "string" },
                    handling_description: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      SearchResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          query: { type: "string" },
          results: {
            type: "object",
            properties: {
              tickets: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TicketListResponse" },
                  },
                  count: { type: "integer" },
                },
              },
              kb: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/KBArticle" },
                  },
                  count: { type: "integer" },
                },
              },
            },
          },
        },
      },
      SyncResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          results: {
            type: "object",
            properties: {
              tickets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    local_id: { type: "string" },
                    server_id: { type: "string", format: "uuid" },
                    ticket_number: { type: "string" },
                  },
                },
              },
              progress_updates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    local_id: { type: "string" },
                    server_id: { type: "string", format: "uuid" },
                  },
                },
              },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    local_id: { type: "string" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      AssetScanResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          action: {
            type: "string",
            enum: ["create_ticket", "technician_check_in"],
          },
          message: { type: "string" },
          asset: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              type: { type: "string" },
              location: { type: "string" },
              opd: { type: "string" },
            },
          },
        },
      },
      AuditLogResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticket_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          action: { type: "string" },
          description: { type: "string" },
          user: { $ref: "#/components/schemas/UserResponse" },
          ticket: {
            type: "object",
            properties: {
              ticket_number: { type: "string" },
              title: { type: "string" },
            },
          },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ==========================================
    // GENERAL
    // ==========================================
    "/": {
      get: {
        tags: ["General"],
        summary: "Check API Status",
        description:
          "Endpoint untuk memeriksa apakah API berjalan dengan baik.",
        responses: {
          200: {
            description: "API Berjalan",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example:
                            "Welcome to Service Desk API v2.0 (SSO Enabled)",
                        },
                        version: { type: "string", example: "2.0.0" },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/dashboard": {
      get: {
        tags: ["General"],
        security: [{ bearerAuth: [] }],
        summary: "Get Dashboard Stats",
        description:
          "Mengambil data statistik untuk dashboard pengguna. Data yang ditampilkan akan difilter berdasarkan role pengguna.",
        responses: {
          200: {
            description: "Berhasil mengambil data dashboard",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    dashboard: {
                      type: "object",
                      properties: {
                        total_tickets: { type: "integer" },
                        by_status: {
                          type: "object",
                          example: { open: 5, resolved: 20 },
                        },
                        by_priority: {
                          type: "object",
                          example: { high: 2, medium: 10 },
                        },
                        role: { type: "string" },
                        scope: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/search": {
      get: {
        tags: ["General"],
        security: [{ bearerAuth: [] }],
        summary: "Global Search",
        description:
          "Melakukan pencarian global pada tiket (insiden & permintaan) dan artikel basis pengetahuan.",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Query pencarian",
          },
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["tickets", "kb"] },
            description:
              "Filter tipe hasil pencarian. Jika kosong, akan mencari di semua.",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Hasil Pencarian",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SearchResponse" },
              },
            },
          },
        },
      },
    },
    "/sync": {
      post: {
        tags: ["General"],
        security: [{ bearerAuth: [] }],
        summary: "Offline Sync (Mobile)",
        description:
          "Endpoint untuk sinkronisasi data yang dibuat saat aplikasi mobile dalam mode offline.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tickets: {
                    type: "array",
                    items: { $ref: "#/components/schemas/IncidentCreateAuth" },
                    description: "Array of tickets created offline",
                  },
                  progress_updates: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProgressUpdateInput" },
                    description: "Array of updates made offline",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Laporan Sinkronisasi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SyncResponse" },
              },
            },
          },
        },
      },
    },
    "/assets/qr/{qr_code}": {
      get: {
        tags: ["General"],
        security: [{ bearerAuth: [] }],
        summary: "Scan QR Asset",
        description:
          "Memindai QR code pada aset. Aksi yang dihasilkan tergantung pada role pengguna.",
        parameters: [
          {
            name: "qr_code",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Informasi Aset atau Aksi Check-in",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AssetScanResponse" },
              },
            },
          },
          404: {
            description: "Aset tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login User",
        description:
          "Login untuk pengguna yang sudah terdaftar di sistem. Mengembalikan token JWT untuk digunakan pada request selanjutnya.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login berhasil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
          401: {
            description: "Username/Password salah",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register Public User",
        description:
          "Mendaftarkan pengguna baru dengan role 'pengguna'. Akun akan langsung aktif.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Registrasi berhasil",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example: "Registrasi berhasil",
                        },
                        user: { $ref: "#/components/schemas/UserResponse" },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "Data tidak valid atau username/email sudah digunakan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        summary: "Logout User",
        description:
          "Logout pengguna. Di sisi server, ini hanya menghapus token dari client. Token JWT tidak bisa di-invalidate secara langsung.",
        responses: {
          200: {
            description: "Logout berhasil",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        summary: "Get Current User Profile",
        description:
          "Mengambil data profil pengguna yang sedang login berdasarkan token.",
        responses: {
          200: {
            description: "Data profil pengguna",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        summary: "Update Current User Profile",
        description:
          "Memperbarui data profil pengguna yang sedang login (nama, telepon, alamat).",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profil berhasil diperbarui",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request Password Reset",
        description:
          "Mengirim link reset password ke email pengguna. Untuk keamanan, response akan selalu sukses meskipun email tidak terdaftar.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Jika email terdaftar, link reset password akan dikirim",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 2. INCIDENTS
    // ==========================================
    "/incidents": {
      get: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "List Incidents (Filtered)",
        description:
          "Mengambil daftar tiket insiden. Hasil akan difilter berdasarkan role dan OPD pengguna. Memerlukan permission `tickets.read`.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "open",
                "verified",
                "assigned",
                "in_progress",
                "resolved",
                "closed",
              ],
            },
          },
          {
            name: "priority",
            in: "query",
            schema: {
              type: "string",
              enum: ["low", "medium", "high", "major"],
            },
          },
          { name: "opd_id", in: "query", schema: { type: "integer" } },
          {
            name: "verification_status",
            in: "query",
            schema: {
              type: "string",
              enum: ["pending", "verified", "rejected"],
            },
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Cari judul/nomor tiket/deskripsi",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Daftar insiden",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/TicketListResponse",
                      },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Create Incident (Authenticated)",
        description:
          "Membuat laporan insiden baru oleh pengguna yang sudah login. Memerlukan permission `incidents.create`.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IncidentCreateAuth" },
            },
          },
        },
        responses: {
          201: {
            description: "Insiden berhasil dibuat",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    ticket: {
                      $ref: "#/components/schemas/TicketDetailResponse",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Data tidak lengkap",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/incidents/{id}": {
      get: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Get Incident Detail",
        description:
          "Mengambil detail lengkap sebuah tiket insiden beserta riwayat, lampiran, dan komentar. Memerlukan permission `tickets.read`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Detail lengkap insiden",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    ticket: {
                      $ref: "#/components/schemas/TicketDetailResponse",
                    },
                    attachments: { type: "array" },
                    progress_updates: { type: "array" },
                    comments: { type: "array" },
                    logs: { type: "array" },
                  },
                },
              },
            },
          },
          404: {
            description: "Tiket tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Akses ditolak",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Update Incident",
        description:
          "Memperbarui data insiden seperti judul, deskripsi, kategori, atau status. Memerlukan permission `tickets.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["open", "in_progress", "resolved", "closed"],
                  },
                  assigned_to: { type: "string", format: "uuid" },
                  verification_status: {
                    type: "string",
                    enum: ["pending", "verified", "rejected"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Insiden berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/incidents/{id}/classify": {
      put: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Classify Incident (Set Priority)",
        description:
          "Digunakan oleh staff (seksi/bidang) untuk menentukan urgensi dan dampak. Sistem akan otomatis menghitung ulang prioritas dan SLA. Memerlukan permission `tickets.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["urgency", "impact"],
                properties: {
                  urgency: {
                    type: "integer",
                    minimum: 1,
                    maximum: 5,
                    example: 3,
                  },
                  impact: {
                    type: "integer",
                    minimum: 1,
                    maximum: 5,
                    example: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Insiden berhasil diklasifikasi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    ticket: {
                      $ref: "#/components/schemas/TicketDetailResponse",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/incidents/{id}/progress": {
      post: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Add Progress Update",
        description:
          "Menambahkan pembaruan progress pada tiket, biasanya dilakukan oleh teknisi atau penanggung jawab. Memerlukan permission `tickets.update_progress`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProgressUpdateInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Progress berhasil ditambahkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    progress_update: {
                      $ref: "#/components/schemas/ProgressUpdate",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/incidents/{id}/comments": {
      post: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Add Comment to Incident",
        description:
          "Menambahkan komentar pada tiket insiden. Bisa komentar publik atau internal (staff only).",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommentInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Komentar berhasil ditambahkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    comment: { $ref: "#/components/schemas/TicketComment" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/incidents/merge": {
      post: {
        tags: ["Incidents"],
        security: [{ bearerAuth: [] }],
        summary: "Merge Incidents",
        description:
          "Menggabungkan beberapa tiket insiden (duplikat) menjadi satu tiket target. Memerlukan permission `tickets.write`.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["source_ticket_ids", "target_ticket_id", "reason"],
                properties: {
                  source_ticket_ids: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                  target_ticket_id: { type: "string", format: "uuid" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Insiden berhasil digabungkan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 3. PUBLIC ENDPOINTS (NO AUTH)
    // ==========================================
    "/public/incidents": {
      post: {
        tags: ["Public"],
        summary: "Report Incident (No Login)",
        description:
          "Endpoint untuk publik (masyarakat umum) untuk melaporkan insiden tanpa perlu login.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IncidentCreatePublic" },
            },
          },
        },
        responses: {
          201: {
            description: "Laporan insiden berhasil diterima",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    ticket: { $ref: "#/components/schemas/TicketListResponse" },
                  },
                },
              },
            },
          },
          400: {
            description: "Data laporan tidak lengkap",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/public/opd": {
      get: {
        tags: ["Public"],
        summary: "Get OPD List",
        description:
          "Mengambil daftar OPD yang aktif. Digunakan untuk dropdown saat pelaporan publik.",
        responses: {
          200: {
            description: "Daftar OPD",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/OPDResponse" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/public/tickets/{ticket_number}": {
      get: {
        tags: ["Public"],
        summary: "Track Ticket Status",
        description:
          "Melacak status tiket (baik insiden maupun permintaan) menggunakan nomor tiket. Tidak memerlukan login.",
        parameters: [
          {
            name: "ticket_number",
            in: "path",
            required: true,
            schema: { type: "string", example: "INC-2023-0001" },
          },
        ],
        responses: {
          200: {
            description: "Informasi pelacakan tiket",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PublicTicketTrackResponse",
                },
              },
            },
          },
          404: {
            description: "Tiket tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 4. REQUESTS (LAYANAN)
    // ==========================================
    "/catalog": {
      get: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Get Service Catalog",
        description:
          "Mengambil katalog layanan yang tersedia, lengkap dengan sub-layanan dan item layanan.",
        parameters: [
          {
            name: "opd_id",
            in: "query",
            schema: { type: "integer" },
            description: "Filter katalog berdasarkan OPD",
          },
          {
            name: "is_active",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter katalog aktif/non-aktif",
          },
        ],
        responses: {
          200: {
            description: "Struktur katalog layanan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ServiceCatalogResponse" },
              },
            },
          },
        },
      },
    },
    "/requests": {
      get: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "List Service Requests",
        description:
          "Mengambil daftar permintaan layanan. Hasil difilter berdasarkan role dan OPD pengguna. Memerlukan permission `tickets.read`.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "pending_approval",
                "open",
                "in_progress",
                "resolved",
                "rejected",
              ],
            },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "opd_id", in: "query", schema: { type: "integer" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Daftar permintaan layanan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/TicketListResponse",
                      },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Create Service Request",
        description:
          "Membuat permintaan layanan baru. Jika layanan memerlukan approval, status awal akan 'pending_approval'. Memerlukan permission `requests.create`.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Permintaan layanan berhasil dibuat",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    ticket: {
                      $ref: "#/components/schemas/TicketDetailResponse",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Data tidak lengkap atau item layanan tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/{id}": {
      get: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Get Request Detail",
        description:
          "Mengambil detail permintaan layanan beserta alur approval dan riwayatnya. Memerlukan permission `tickets.read`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Detail permintaan layanan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    ticket: {
                      $ref: "#/components/schemas/TicketDetailResponse",
                    },
                    approvals: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApprovalWorkflow" },
                    },
                    progress_updates: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProgressUpdate" },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Tiket tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Akses ditolak",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Update Service Request",
        description:
          "Memperbarui data permintaan layanan. Memerlukan permission `tickets.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "pending_approval",
                      "open",
                      "in_progress",
                      "resolved",
                      "rejected",
                    ],
                  },
                  progress_notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Permintaan layanan berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/{id}/approve": {
      post: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Approve Request",
        description:
          "Menyetujui permintaan layanan. Endpoint ini hanya bisa diakses oleh role yang sesuai dengan alur approval.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notes: {
                    type: "string",
                    description: "Catatan opsional saat menyetujui",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Permintaan berhasil disetujui",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: {
                      type: "string",
                      example: "Service request berhasil disetujui",
                    },
                    all_approved: {
                      type: "boolean",
                      description:
                        "True jika semua level approval sudah selesai",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Approval tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/{id}/reject": {
      post: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Reject Request",
        description:
          "Menolak permintaan layanan. Permintaan akan ditutup secara otomatis.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["notes"],
                properties: {
                  notes: {
                    type: "string",
                    description: "Alasan penolakan wajib diisi",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Permintaan berhasil ditolak",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Alasan penolakan harus diisi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Approval tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/{id}/progress": {
      post: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Add Progress Update",
        description:
          "Menambahkan pembaruan progress pada tiket permintaan layanan. Memerlukan permission `tickets.update_progress`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["update_number", "status_change"],
                properties: {
                  update_number: { type: "integer", example: 1 },
                  status_change: {
                    type: "string",
                    example: "Sedang dikerjakan",
                  },
                  notes: {
                    type: "string",
                    description: "Catatan atau deskripsi pembaruan",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Progress berhasil ditambahkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    progress_update: {
                      $ref: "#/components/schemas/ProgressUpdate",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/requests/{id}/comments": {
      post: {
        tags: ["Service Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Add Comment to Request",
        description:
          "Menambahkan komentar pada tiket permintaan layanan. Bisa komentar publik atau internal (staff only).",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommentInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Komentar berhasil ditambahkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    comment: { $ref: "#/components/schemas/TicketComment" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 5. KNOWLEDGE BASE
    // ==========================================
    "/kb": {
      get: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "List Articles",
        description:
          "Mengambil daftar artikel basis pengetahuan. Secara default hanya menampilkan artikel yang sudah dipublikasi. Memerlukan permission `kb.read`.",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Pencarian di judul dan konten",
          },
          { name: "category", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["draft", "published"] },
            description: "Jika kosong, default 'published'",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Daftar artikel KB",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/KBArticle" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "Create Article",
        description:
          "Membuat artikel baru. Artikel baru akan memiliki status 'draft'. Memerlukan permission `kb.write`.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ArticleInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Artikel berhasil dibuat (draft)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    article: { $ref: "#/components/schemas/KBArticle" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/kb/suggest": {
      get: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "Suggest Articles",
        description:
          "Memberikan saran artikel yang relevan berdasarkan query. Digunakan untuk fitur auto-complete. Memerlukan permission `kb.read`.",
        parameters: [
          {
            name: "query",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Daftar saran artikel",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "integer" },
                    suggestions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/KBArticle" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/kb/{id}": {
      get: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "Get Article Detail",
        description:
          "Mengambil detail dan konten lengkap sebuah artikel. Jumlah view akan bertambah. Memerlukan permission `kb.read`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Detail artikel",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    article: { $ref: "#/components/schemas/KBArticle" },
                  },
                },
              },
            },
          },
          404: {
            description: "Artikel tidak ditemukan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "Update Article",
        description:
          "Memperbarui data artikel (judul, konten, kategori, dll). Memerlukan permission `kb.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  status: { type: "string", enum: ["draft", "published"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Artikel berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Knowledge Base"],
        security: [{ bearerAuth: [] }],
        summary: "Delete Article",
        description:
          "Menghapus artikel secara permanen. Memerlukan permission `kb.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Artikel berhasil dihapus",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          403: {
            description: "Anda tidak memiliki izin menghapus artikel",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // 6. ADMIN OPERATIONS
    // ==========================================
    // ... (di dalam object paths)
    "/admin/roles": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "List RBAC Roles",
        description:
          "Mengambil daftar role dan permission yang tersimpan di database.",
        responses: {
          200: {
            description: "Daftar Role",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role_key: { type: "string" },
                          description: { type: "string" },
                          permissions: {
                            type: "array",
                            items: { type: "string" },
                          },
                          is_system: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Create Custom Role",
        description:
          "Membuat role baru secara dinamis. Memerlukan permission `rbac.manage`.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role_key", "description"],
                properties: {
                  role_key: {
                    type: "string",
                    example: "supervisor_lapangan",
                    description: "Harus huruf kecil dan underscore (a-z_)",
                  },
                  description: { type: "string" },
                  permissions: {
                    type: "array",
                    items: { type: "string" },
                    example: ["tickets.read", "incidents.create"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Role berhasil dibuat",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/roles/{id}": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Update Role Permissions",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  permissions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Role berhasil diupdate",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Delete Role",
        description: "Role sistem (bawaan) tidak bisa dihapus.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Role berhasil dihapus",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },

    "/admin/users": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "List Users",
        description:
          "Mengambil daftar semua pengguna sistem, dengan filter role dan OPD. Memerlukan permission `users.read`.",
        parameters: [
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "super_admin",
                "admin_kota",
                "admin_opd",
                "bidang",
                "seksi",
                "helpdesk",
                "teknisi",
                "pegawai_opd",
                "pengguna",
              ],
            },
          },
          { name: "opd_id", in: "query", schema: { type: "integer" } },
          { name: "is_active", in: "query", schema: { type: "boolean" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Daftar pengguna",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UserResponse" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Create User (Admin)",
        description:
          "Membuat pengguna baru oleh admin. Role dan OPD dapat ditentukan. Memerlukan permission `users.write`.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserCreateAdmin" },
            },
          },
        },
        responses: {
          201: {
            description: "Pengguna berhasil dibuat",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
          400: {
            description: "Data tidak valid atau role tidak ada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/users/{id}/role": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Update User Role/OPD",
        description:
          "Memperbarui role, OPD, bidang, atau seksi seorang pengguna. Memerlukan permission `users.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  opd_id: { type: "integer" },
                  bidang_id: { type: "integer" },
                  seksi_id: { type: "integer" },
                  is_active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Role pengguna berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/opd": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "List OPD",
        description:
          "Mengambil daftar semua OPD (Organisasi Perangkat Daerah). Memerlukan permission `opd.read`.",
        parameters: [
          { name: "is_active", in: "query", schema: { type: "boolean" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Daftar OPD",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/OPDResponse" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/opd/{id}/calendar": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Update OPD Calendar",
        description:
          "Memperbarui jam kerja dan daftar hari libur untuk perhitungan SLA. Memerlukan permission `opd.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  working_hours: {
                    type: "object",
                    description: "JSON object untuk jam kerja",
                  },
                  holidays: {
                    type: "array",
                    items: { type: "string", format: "date" },
                    description: "Array tanggal hari libur",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Kalender OPD berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/technicians/{id}/skills": {
      put: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Update Technician Skills",
        description:
          "Memperbarui daftar keahlian (skills) seorang teknisi. Memerlukan permission `users.write`.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        level: {
                          type: "string",
                          enum: ["beginner", "intermediate", "expert"],
                        },
                        category: { type: "string" },
                      },
                    },
                  },
                  expertise_level: { type: "string" },
                  certifications: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Skills teknisi berhasil diperbarui",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        summary: "Get Audit Logs",
        description:
          "Mengambil log audit aktivitas yang terjadi di dalam sistem. Memerlukan permission `reports.read`.",
        parameters: [
          {
            name: "user_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
          { name: "action", in: "query", schema: { type: "string" } },
          {
            name: "date_from",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "date_to",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 100 },
          },
        ],
        responses: {
          200: {
            description: "Daftar log audit",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AuditLogResponse" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationInfo" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [], // We are using inline definitions
};

const swaggerDocs = swaggerJsdoc(options);

const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "Service Desk API Docs",
};

module.exports = { swaggerDocs, swaggerUiOptions };
