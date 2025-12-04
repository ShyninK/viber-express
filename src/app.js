// // ===========================================
// // 1. SETUP & IMPORT
// // ===========================================
// const express = require("express");
// const { createClient } = require("@supabase/supabase-js");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const cors = require("cors");
// const crypto = require("crypto");
// const cron = require("node-cron");
// const swaggerUi = require("swagger-ui-express");
// const { swaggerDocs, swaggerUiOptions } = require("./swagger.js");
// const http = require("http");
// const { Server } = require("socket.io");
// const { initializeSocket } = require("./socket.js");
// require("dotenv").config();

// // Initialize Express app
// const app = express();
// const httpServer = http.createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });
// const PORT = process.env.PORT || 8080;
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// // Root endpoint
// app.get("/api/v1", (req, res) => {
//   res.json({
//     success: true,
//     message: "Welcome to Service Desk API",
//     version: "2.0.0",
//   });
// });

// // Swagger UI setup
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocs, swaggerUiOptions)
// );

// // ===========================================
// // 2. DATABASE CONNECTION
// // ===========================================
// const supabase = createClient(
//   process.env.DB_SUPABASE_URL,
//   process.env.DB_SUPABASE_KEY
// );

// // Test database connection
// (async () => {
//   try {
//     const { error } = await supabase.from("users").select("count").limit(1);
//     if (error) throw error;
//     console.log("✅ Database Service Desk connected");
//     console.log("✅ SSO Client initialized");
    
//     // Initialize Socket.IO Real-time Chat
//     initializeSocket(io, supabase, JWT_SECRET);
//     console.log("✅ Socket.IO Real-time Chat initialized");
//   } catch (err) {
//     console.error("❌ Database connection error:", err.message);
//   }
// })();

// // ===========================================
// // 3. MIDDLEWARE GLOBAL
// // ===========================================
// app.use(cors());
// app.use(express.json());

// // API v1 router
// const v1Router = express.Router();
// app.use("/api/v1", v1Router);

// // Root API v1 endpoint
// v1Router.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Welcome to Siladan App API",
//     version: "2.0.0",
//   });
// });

// // ===========================================
// // 4. DYNAMIC RBAC CONFIGURATION (DB DRIVEN)
// // ===========================================
// // Variabel Global untuk menyimpan Role di Memory (Cache)
// // Supaya tidak query DB setiap kali ada request (Performance Optimization)
// let RBAC_CACHE = {};

// // Fungsi untuk refresh cache dari Database
// const reloadRbacCache = async () => {
//   try {
//     const { data, error } = await supabase
//       .from("roles_config")
//       .select("role_key, permissions, description");

//     if (error) throw error;

//     // Reset dan isi ulang cache
//     RBAC_CACHE = {};
//     data.forEach((role) => {
//       RBAC_CACHE[role.role_key] = {
//         permissions: role.permissions || [],
//         description: role.description,
//       };
//     });

//     console.log(
//       `🔄 RBAC Cache Reloaded: ${Object.keys(RBAC_CACHE).length} roles loaded.`
//     );
//   } catch (err) {
//     console.error("❌ Gagal memuat RBAC:", err.message);
//   }
// };
// reloadRbacCache();

// // ===========================================
// // 5. AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// // ===========================================
// const authenticate = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Token tidak ditemukan" });
//   }

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: "Token tidak valid" });
//     }
//     req.user = user;
//     next();
//   });
// };

// const authorize = (permission) => {
//   return (req, res, next) => {
//     const userRole = req.user.role;

//     // Ambil config dari Cache
//     const roleConfig = RBAC_CACHE[userRole];

//     if (!roleConfig) {
//       return res.status(403).json({
//         error: "Role pengguna tidak valid atau tidak ditemukan konfigurasi.",
//       });
//     }

//     // Logic Pengecekan Permission (Sama seperti sebelumnya)
//     if (
//       roleConfig.permissions.includes("*") ||
//       roleConfig.permissions.includes(permission) ||
//       roleConfig.permissions.some(
//         (p) => p.endsWith(".*") && permission.startsWith(p.replace(".*", ""))
//       )
//     ) {
//       next();
//     } else {
//       return res.status(403).json({
//         error: "Akses Ditolak: Anda tidak memiliki izin untuk akses ini.",
//         required: permission,
//         your_role: userRole,
//       });
//     }
//   };
// };

// // ===========================================
// // 6. HELPER FUNCTIONS
// // ===========================================
// const calculatePriority = (urgency, impact) => {
//   const score = urgency * impact;
//   let category;
//   if (score >= 1 && score <= 5) category = "low";
//   else if (score >= 6 && score <= 10) category = "medium";
//   else if (score >= 11 && score <= 15) category = "high";
//   else category = "major";
//   return { score, category };
// };

// const generateTicketNumber = (type) => {
//   const prefix = type === "incident" ? "INC" : "REQ";
//   const year = new Date().getFullYear();
//   const random = Math.floor(Math.random() * 10000)
//     .toString()
//     .padStart(4, "0");
//   return `${prefix}-${year}-${random}`;
// };

// const calculateSLADue = async (priority, opdId, startTime) => {
//   try {
//     const { data: sla } = await supabase
//       .from("sla")
//       .select("resolution_time")
//       .eq("opd_id", opdId)
//       .eq("priority", priority)
//       .single();

//     if (!sla || !sla.resolution_time) {
//       console.warn(
//         `PERINGATAN: Konfigurasi SLA tidak ditemukan untuk opd_id: ${opdId}, priority: ${priority}. Menggunakan default null.`
//       );
//       return {
//         sla_due: null,
//         sla_target_date: null,
//         sla_target_time: null,
//       };
//     }

//     const dueDate = new Date(
//       startTime.getTime() + sla.resolution_time * 60 * 60 * 1000
//     );
//     return {
//       sla_due: dueDate,
//       sla_target_date: dueDate.toISOString().split("T")[0],
//       sla_target_time: dueDate.toTimeString().split(" ")[0],
//     };
//   } catch (error) {
//     console.error("Error calculating SLA:", error);
//     return {
//       sla_due: null,
//       sla_target_date: null,
//       sla_target_time: null,
//     };
//   }
// };

// const logTicketActivity = async (
//   ticketId,
//   userId,
//   action,
//   description,
//   oldValue = null,
//   newValue = null
// ) => {
//   try {
//     await supabase.from("ticket_logs").insert({
//       ticket_id: ticketId,
//       user_id: userId,
//       action,
//       description,
//       old_value: oldValue,
//       new_value: newValue,
//     });
//   } catch (error) {
//     console.error("Error logging activity:", error);
//   }
// };

// const sendNotification = async (
//   userId,
//   title,
//   message,
//   type = "info",
//   ticketId = null
// ) => {
//   try {
//     await supabase.from("notifications").insert({
//       user_id: userId,
//       title,
//       message,
//       type,
//       related_ticket_id: ticketId,
//     });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//   }
// };

// // ===========================================
// // 7. AUTHENTICATION ROUTES
// // ===========================================
// // ===========================================
// // HELPER: FORMATTER PERMISSION (Letakkan di atas Route Login)
// // ===========================================
// const transformPermissionsForFrontend = (permissions) => {
//   return permissions.map((perm) => {
//     if (perm === "*") return { action: "manage", subject: "all" };

//     const [subject, action] = perm.split(".");

//     // Mapping Action agar sesuai standar Frontend (CASL)
//     let finalAction = action;
//     if (action === "*" || action === "write") finalAction = "manage";

//     // Mapping Subject (Opsional: ubah jamak ke tunggal)
//     let finalSubject = subject;
//     // if (finalSubject.endsWith('s')) finalSubject = finalSubject.slice(0, -1);

//     return { action: finalAction || "read", subject: finalSubject };
//   });
// };

// v1Router.post("/auth/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res
//         .status(400)
//         .json({ error: "Username dan password harus diisi" });
//     }

//     const { data: user, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("username", username)
//       .single();

//     if (error || !user) {
//       return res.status(401).json({ error: "Username atau password salah" });
//     }

//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ error: "Username atau password salah" });
//     }

//     // Update last login
//     await supabase
//       .from("users")
//       .update({ last_login_at: new Date() })
//       .eq("id", user.id);

//     // Ambil permission dari Cache
//     const rawPermissions = RBAC_CACHE[user.role]?.permissions || [];

//     // --- PERUBAHAN DISINI: Format Permission ---
//     const frontendPermissions = transformPermissionsForFrontend(rawPermissions);

//     // Generate Token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role,
//         opd_id: user.opd_id,
//         // Di token tetap simpan string biar hemat size
//         permissions: rawPermissions,
//       },
//       JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         full_name: user.full_name,
//         email: user.email,
//         nip: user.nip,
//         phone: user.phone,
//         address: user.address,
//         role: { id: user.role, name: user.role }, // Kirim object role
//         opd_id: user.opd_id,
//         // Kirim permission yang sudah diformat
//         permissions: frontendPermissions,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Register
// v1Router.post("/auth/register", async (req, res) => {
//   try {
//     const { username, password, email, full_name, nip, phone, address } =
//       req.body;

//     if (!username || !password || !email || !full_name) {
//       return res.status(400).json({
//         error: "Username, password, email, dan nama lengkap harus diisi",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const { data, error } = await supabase
//       .from("users")
//       .insert({
//         username,
//         password: hashedPassword,
//         email,
//         full_name,
//         nip,
//         phone,
//         address,
//         role: "pengguna",
//         opd_id: null,
//         bidang_id: null,
//         seksi_id: null,
//         is_active: true,
//       })
//       .select()
//       .single();

//     if (error) {
//       if (error.code === "23505") {
//         return res
//           .status(400)
//           .json({ error: "Username atau email sudah digunakan" });
//       }
//       throw error;
//     }

//     delete data.password;

//     res.status(201).json({
//       success: true,
//       message: "Registrasi berhasil",
//       user: data,
//     });
//   } catch (error) {
//     console.error("Register error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Logout
// v1Router.post("/auth/logout", authenticate, async (req, res) => {
//   res.json({ success: true, message: "Logout berhasil" });
// });

// // Get Profile
// v1Router.get("/auth/me", authenticate, async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("users")
//       .select(
//         `
//         id, username, email, full_name, nip, phone, address, role,
//         opd:opd_id(id, name, code),
//         bidang:bidang_id(id, name),
//         seksi:seksi_id(id, name),
//         created_at
//       `
//       )
//       .eq("id", req.user.id)
//       .single();

//     if (error) throw error;

//     res.json({ success: true, user: data });
//   } catch (error) {
//     console.error("Profile error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Update Profile
// v1Router.put("/auth/me", authenticate, async (req, res) => {
//   try {
//     const { full_name, phone, address } = req.body;

//     const updateData = {};
//     if (full_name) updateData.full_name = full_name;
//     if (phone) updateData.phone = phone;
//     if (address) updateData.address = address;

//     const { data, error } = await supabase
//       .from("users")
//       .update(updateData)
//       .eq("id", req.user.id)
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({
//       success: true,
//       message: "Profil berhasil diperbarui",
//       user: data,
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Forgot Password
// v1Router.post("/auth/forgot-password", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ error: "Email harus diisi" });
//     }

//     const { data: user } = await supabase
//       .from("users")
//       .select("id, email")
//       .eq("email", email)
//       .single();

//     if (!user) {
//       return res.json({
//         success: true,
//         message: "Jika email terdaftar, link reset password akan dikirim",
//       });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     await supabase.from("password_reset_tokens").insert({
//       user_id: user.id,
//       token: hashedToken,
//       expires_at: new Date(Date.now() + 3600000), // 1 hour
//     });

//     console.log(`Reset token for ${email}: ${resetToken}`);

//     res.json({
//       success: true,
//       message: "Link reset password telah dikirim ke email Anda",
//     });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 8. INCIDENT MANAGEMENT ROUTES
// // ===========================================
// // Create Incident
// v1Router.post(
//   "/incidents",
//   authenticate,
//   authorize("incidents.create"),
//   async (req, res) => {
//     try {
//       const {
//         title,
//         description,
//         category,
//         incident_location,
//         incident_date,
//         opd_id,
//         asset_identifier,
//         attachment_url,
//       } = req.body;

//       if (!title || !description) {
//         return res.status(400).json({ error: "Data tidak lengkap" });
//       }

//       const urgencyVal = 3;
//       const impactVal = 3;

//       const { score: priorityScore, category: priorityCategory } =
//         calculatePriority(urgencyVal, impactVal);

//       const ticketNumber = generateTicketNumber("incident");
//       const targetOpdId = opd_id || req.user.opd_id;
//       const creationTime = new Date();

//       const slaData = await calculateSLADue(
//         priorityCategory,
//         targetOpdId,
//         creationTime
//       );

//       const { data: reporter } = await supabase
//         .from("users")
//         .select("nip")
//         .eq("id", req.user.id)
//         .single();

//       const { data: ticket, error } = await supabase
//         .from("tickets")
//         .insert({
//           ticket_number: ticketNumber,
//           type: "incident",
//           title,
//           description,
//           urgency: urgencyVal,
//           impact: impactVal,
//           priority_score: priorityScore,
//           priority: priorityCategory,
//           category: category || "Umum",
//           incident_location,
//           incident_date: incident_date || null,
//           opd_id: targetOpdId,
//           reporter_id: req.user.id,
//           reporter_nip: reporter?.nip,
//           status: "open",
//           verification_status: "pending",
//           ...slaData,
//           asset_name_reported: asset_identifier || null,
//           reporter_attachment_url: attachment_url || null,
//           created_at: creationTime,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       await logTicketActivity(
//         ticket.id,
//         req.user.id,
//         "create",
//         `Incident created: ${ticketNumber}`
//       );

//       res
//         .status(201)
//         .json({ success: true, message: "Incident berhasil dibuat", ticket });
//     } catch (error) {
//       console.error("Create incident error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Create Public Incident
// v1Router.post("/public/incidents", async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       incident_location,
//       incident_date,
//       opd_id,
//       asset_identifier,
//       reporter_name,
//       reporter_email,
//       reporter_phone,
//       reporter_address,
//       reporter_nik,
//       attachment_url,
//     } = req.body;

//     if (
//       !title ||
//       !description ||
//       !opd_id ||
//       !reporter_name ||
//       !reporter_email ||
//       !reporter_phone
//     ) {
//       return res.status(400).json({
//         error:
//           "Data insiden dan data pelapor (nama, email, HP, OPD) tidak boleh kosong",
//       });
//     }

//     const urgencyVal = 3;
//     const impactVal = 3;
//     const { score: priorityScore, category: priorityCategory } =
//       calculatePriority(urgencyVal, impactVal);

//     const ticketNumber = generateTicketNumber("incident");
//     const creationTime = new Date();

//     const slaData = await calculateSLADue(
//       priorityCategory,
//       opd_id,
//       creationTime
//     );

//     const { data: ticket, error } = await supabase
//       .from("tickets")
//       .insert({
//         ticket_number: ticketNumber,
//         type: "incident",
//         title,
//         description,
//         urgency: urgencyVal,
//         impact: impactVal,
//         priority_score: priorityScore,
//         priority: priorityCategory,
//         category: category || "Umum",
//         incident_location,
//         incident_date: incident_date || null,
//         opd_id: opd_id,
//         reporter_id: null,
//         reporter_nip: reporter_nik || null,
//         status: "open",
//         ...slaData,
//         reporter_name: reporter_name,
//         reporter_email: reporter_email,
//         reporter_phone: reporter_phone,
//         reporter_address: reporter_address || null,
//         asset_name_reported: asset_identifier || null,
//         reporter_attachment_url: attachment_url || null,
//         created_at: creationTime,
//       })
//       .select()
//       .single();

//     if (error) throw error;

//     await logTicketActivity(
//       ticket.id,
//       null,
//       "create_public",
//       `Public Incident created: ${ticketNumber}`
//     );

//     res.status(201).json({
//       success: true,
//       message: "Insiden berhasil dilaporkan",
//       ticket: ticket,
//     });
//   } catch (error) {
//     console.error("Create public incident error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Public OPD
// v1Router.get("/public/opd", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("opd")
//       .select("id, name")
//       .eq("is_active", true)
//       .order("name");

//     if (error) throw error;
//     res.json({ success: true, data });
//   } catch (error) {
//     console.error("Get public OPD error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Public Ticket
// v1Router.get("/public/tickets/:ticket_number", async (req, res) => {
//   try {
//     const { ticket_number } = req.params;

//     console.log("🔍 Mencari tiket:", ticket_number);

//     const { data: ticket, error } = await supabase
//       .from("tickets")
//       .select(
//         `
//         id,
//         ticket_number,
//         title,
//         description,
//         status,
//         category,
//         priority,
//         incident_location,
//         created_at,
//         updated_at,
//         opd:opd_id ( name ), 
//         reporter_name
//       `
//       )
//       .ilike("ticket_number", ticket_number)
//       .maybeSingle();

//     if (error) {
//       console.error("❌ Supabase Error:", error);
//       return res.status(500).json({
//         error: "Terjadi kesalahan database",
//         details: error.message,
//       });
//     }

//     if (!ticket) {
//       console.warn("⚠️ Tiket tidak ditemukan di DB");
//       return res.status(404).json({
//         error: "Tiket tidak ditemukan. Periksa kembali nomor tiket Anda.",
//       });
//     }

//     await supabase.from("ticket_progress_updates").insert({
//       ticket_id: ticket.id,
//       update_number: 1,
//       updated_by: req.user?.id || null,
//       status_change: "Open",
//       handling_description: "Tiket berhasil dibuat dan masuk antrian.",
//       update_time: new Date(),
//     });

//     const { data: history } = await supabase
//       .from("ticket_progress_updates")
//       .select("update_time, status_change, handling_description")
//       .eq("ticket_id", ticket.id)
//       .order("update_time", { ascending: false });

//     res.json({
//       success: true,
//       data: {
//         ticket_info: {
//           ticket_number: ticket.ticket_number,
//           title: ticket.title,
//           description: ticket.description,
//           status: ticket.status,
//           category: ticket.category,
//           opd_name: ticket.opd?.name,
//           location: ticket.incident_location,
//           reporter_name: ticket.reporter_name,
//           created_at: ticket.created_at,
//           last_updated: ticket.updated_at,
//         },
//         timeline: history || [],
//       },
//     });
//   } catch (error) {
//     console.error("Track ticket error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Incidents
// v1Router.get("/incidents", authenticate, async (req, res) => {
//   try {
//     const {
//       status,
//       priority,
//       search,
//       opd_id,
//       verification_status,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const offset = (parseInt(page) - 1) * parseInt(limit);

//     let query = supabase
//       .from("tickets")
//       .select(
//         `
//         *,
//         reporter:reporter_id(id, username, full_name, email, nip, phone),
//         recorder:recorder_id(id, username, full_name),
//         verifier:verifier_id(id, username, full_name),
//         technician:assigned_to(id, username, full_name),
//         opd:opd_id(id, name, code)
//       `,
//         { count: "exact" }
//       )
//       .eq("type", "incident")
//       .order("created_at", { ascending: false })
//       .range(offset, offset + parseInt(limit) - 1);

//     if (req.user.role === "pengguna" || req.user.role === "pegawai_opd") {
//       query = query.eq("reporter_id", req.user.id);
//     } else if (req.user.role === "teknisi") {
//       query = query.eq("assigned_to", req.user.id);
//     } else if (
//       ["admin_opd", "bidang", "seksi", "helpdesk"].includes(req.user.role)
//     ) {
//       query = query.eq("opd_id", req.user.opd_id);
//     }

//     if (status) query = query.eq("status", status);
//     if (priority) query = query.eq("priority", priority);
//     if (opd_id) query = query.eq("opd_id", opd_id);
//     if (verification_status)
//       query = query.eq("verification_status", verification_status);
//     if (search) {
//       query = query.or(
//         `title.ilike.%${search}%,ticket_number.ilike.%${search}%,description.ilike.%${search}%`
//       );
//     }

//     const { data, count, error } = await query;
//     if (error) throw error;

//     res.json({
//       success: true,
//       data,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: count,
//         total_pages: Math.ceil(count / parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     console.error("Get incidents error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Incident Detail
// v1Router.get(
//   "/incidents/:id",
//   authenticate,
//   authorize("tickets.read"),
//   async (req, res) => {
//     try {
//       const { data: ticket, error } = await supabase
//         .from("tickets")
//         .select(
//           `
//         *,
//         reporter:reporter_id(id, username, full_name, email, nip, phone, address),
//         recorder:recorder_id(id, username, full_name, nip),
//         verifier:verifier_id(id, username, full_name, nip),
//         technician:assigned_to(id, username, full_name, phone, nip),
//         opd:opd_id(id, name, code, address),
//         bidang:bidang_id(id, name),
//         seksi:seksi_id(id, name)
//       `
//         )
//         .eq("id", req.params.id)
//         .eq("type", "incident")
//         .single();

//       if (error) throw error;
//       if (!ticket) {
//         return res.status(404).json({ error: "Incident tidak ditemukan" });
//       }

//       if (req.user.role === "pengguna" && ticket.reporter_id !== req.user.id) {
//         return res.status(403).json({ error: "Akses ditolak" });
//       }

//       const { data: attachments } = await supabase
//         .from("ticket_attachments")
//         .select("*")
//         .eq("ticket_id", req.params.id)
//         .is("progress_update_id", null);

//       const { data: progressUpdates } = await supabase
//         .from("ticket_progress_updates")
//         .select(`*, updated_by_user:updated_by(id, username, full_name)`)
//         .eq("ticket_id", req.params.id)
//         .order("update_number");

//       const { data: comments } = await supabase
//         .from("ticket_comments")
//         .select(`*, user:user_id(id, username, full_name)`)
//         .eq("ticket_id", req.params.id)
//         .order("created_at");

//       const { data: logs } = await supabase
//         .from("ticket_logs")
//         .select(`*, user:user_id(username, full_name)`)
//         .eq("ticket_id", req.params.id)
//         .order("created_at", { ascending: false })
//         .limit(20);

//       res.json({
//         success: true,
//         ticket,
//         attachments: attachments || [],
//         progress_updates: progressUpdates || [],
//         comments: comments || [],
//         logs: logs || [],
//       });
//     } catch (error) {
//       console.error("Get incident detail error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Classify Incident
// v1Router.put(
//   "/incidents/:id/classify",
//   authenticate,
//   authorize("tickets.write"),
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { urgency, impact } = req.body;
//       const userId = req.user.id;

//       if (!urgency || !impact) {
//         return res
//           .status(400)
//           .json({ error: "Urgency dan impact harus diisi" });
//       }

//       const urgencyVal = parseInt(urgency);
//       const impactVal = parseInt(impact);

//       const { data: currentTicket, error: getError } = await supabase
//         .from("tickets")
//         .select("opd_id, created_at")
//         .eq("id", id)
//         .single();

//       if (getError || !currentTicket) {
//         return res.status(404).json({ error: "Tiket tidak ditemukan" });
//       }

//       const { score: priorityScore, category: priorityCategory } =
//         calculatePriority(urgencyVal, impactVal);

//       const slaData = await calculateSLADue(
//         priorityCategory,
//         currentTicket.opd_id,
//         new Date(currentTicket.created_at)
//       );

//       const { data: updatedTicket, error: updateError } = await supabase
//         .from("tickets")
//         .update({
//           urgency: urgencyVal,
//           impact: impactVal,
//           priority: priorityCategory,
//           priority_score: priorityScore,
//           ...slaData,
//           updated_at: new Date(),
//         })
//         .eq("id", id)
//         .select()
//         .single();

//       if (updateError) throw updateError;

//       await logTicketActivity(
//         id,
//         userId,
//         "classify",
//         `Tiket diklasifikasi oleh Seksi. Prioritas baru: ${priorityCategory} (U: ${urgencyVal}, I: ${impactVal})`
//       );

//       res.json({
//         success: true,
//         message: "Insiden berhasil diklasifikasi dan prioritas diperbarui",
//         ticket: updatedTicket,
//       });
//     } catch (error) {
//       console.error("Classify incident error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Update Incident
// v1Router.put(
//   "/incidents/:id",
//   authenticate,
//   authorize("tickets.write"),
//   async (req, res) => {
//     try {
//       const updateData = {};
//       const allowedFields = [
//         "title",
//         "description",
//         "category",
//         "status",
//         "assigned_to",
//         "verification_status",
//       ];

//       allowedFields.forEach((field) => {
//         if (req.body[field] !== undefined) {
//           updateData[field] = req.body[field];
//         }
//       });

//       if (Object.keys(updateData).length === 0) {
//         return res.status(400).json({ error: "Tidak ada data untuk diupdate" });
//       }

//       updateData.updated_at = new Date();

//       const { data, error } = await supabase
//         .from("tickets")
//         .update(updateData)
//         .eq("id", req.params.id)
//         .eq("type", "incident")
//         .select()
//         .single();

//       if (error) throw error;

//       await logTicketActivity(
//         req.params.id,
//         req.user.id,
//         "update",
//         `Incident diperbarui oleh ${req.user.role}`
//       );

//       res.json({
//         success: true,
//         message: "Incident berhasil diperbarui",
//         ticket: data,
//       });
//     } catch (error) {
//       console.error("Update incident error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Merge Incidents
// v1Router.post(
//   "/incidents/merge",
//   authenticate,
//   authorize("tickets.write"),
//   async (req, res) => {
//     try {
//       const { source_ticket_ids, target_ticket_id, reason } = req.body;

//       if (!source_ticket_ids || !target_ticket_id || !reason) {
//         return res.status(400).json({ error: "Data tidak lengkap" });
//       }

//       await supabase
//         .from("tickets")
//         .update({
//           status: "merged",
//           merged_to: target_ticket_id,
//           merge_reason: reason,
//           closed_at: new Date(),
//         })
//         .in("id", source_ticket_ids)
//         .eq("type", "incident");

//       for (const ticketId of source_ticket_ids) {
//         await logTicketActivity(
//           ticketId,
//           req.user.id,
//           "merge",
//           `Merged to incident ${target_ticket_id}: ${reason}`
//         );
//       }

//       await logTicketActivity(
//         target_ticket_id,
//         req.user.id,
//         "merge",
//         `Received merged incidents: ${source_ticket_ids.join(", ")}`
//       );

//       res.json({ success: true, message: "Incidents berhasil di-merge" });
//     } catch (error) {
//       console.error("Merge incidents error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // ===========================================
// // 9. SERVICE REQUEST MANAGEMENT ROUTES
// // ===========================================
// // Get Service Catalog
// v1Router.get("/catalog", authenticate, async (req, res) => {
//   try {
//     const { opd_id, is_active } = req.query;

//     let query = supabase
//       .from("service_catalog")
//       .select("*")
//       .order("display_order");

//     if (opd_id) query = query.eq("opd_id", opd_id);
//     if (is_active !== undefined) {
//       const isActiveValue = is_active === "true" || is_active === '"true"';
//       query = query.eq("is_active", isActiveValue);
//     }

//     const { data: catalogs, error } = await query;
//     if (error) throw error;

//     const formattedData = [];

//     for (const catalog of catalogs || []) {
//       // 1. Ambil semua items untuk catalog ini
//       const { data: items } = await supabase
//         .from("service_items")
//         .select(
//           "id, item_code, parent_item_id, item_name, item_level, description, approval_required, required_fields"
//         )
//         .eq("catalog_id", catalog.id)
//         .eq("is_active", true)
//         .order("display_order");

//       // Filter Level 2 (Sub-Layanan / Parent)
//       const subLayanan_raw =
//         items?.filter(
//           (i) => i.item_level === "sub_layanan" && !i.parent_item_id
//         ) || [];

//       // Mapping Level 2 -> Format Frontend
//       const childrenLevel2 = subLayanan_raw.map((sub) => {
//         // Filter Level 3 (Service Items / Child)
//         const level3_items_raw =
//           items?.filter((i) => i.parent_item_id === sub.id) || [];

//         // Mapping Level 3 -> Format Frontend
//         const childrenLevel3 = level3_items_raw.map((item) => ({
//           id: item.id, // Atau item.item_code jika ingin string "SRV-001"
//           name: item.item_name,
//           desc: item.description,
//           // Custom logic: jika ada field 'asset_id' di required_fields, berarti butuh aset
//           needAsset: JSON.stringify(item.required_fields || {}).includes(
//             "asset"
//           ),
//           workflow: item.approval_required ? "approval" : "internal",
//         }));

//         return {
//           id: sub.id, // Atau sub.item_code
//           name: sub.item_name,
//           // Logic: Jika sub-layanan butuh aset (bisa diset manual atau cek anak-anaknya)
//           needAsset: childrenLevel3.some((c) => c.needAsset),
//           workflow: "internal", // Default untuk grouping
//           children: childrenLevel3,
//         };
//       });

//       // Mapping Level 1 (Catalog) -> Format Frontend
//       formattedData.push({
//         id: catalog.id, // Atau catalog.catalog_code ("CAT-001")
//         name: catalog.catalog_name,
//         icon: catalog.icon || "folder",
//         isReadOnly: true, // Level 1 biasanya hanya judul
//         children: childrenLevel2,
//       });
//     }

//     // Kirim response langsung array (atau bungkus data jika perlu)
//     res.json({
//       success: true,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Get catalogs error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Create Service Request
// v1Router.post(
//   "/requests",
//   authenticate,
//   authorize("requests.create"),
//   async (req, res) => {
//     try {
//       const {
//         title,
//         description,
//         service_item_id,
//         service_detail,
//         attachment_url,
//         requested_date,
//       } = req.body;

//       if (!title || !description || !service_item_id) {
//         return res.status(400).json({
//           error: "Title, description, dan service_item_id tidak boleh kosong",
//         });
//       }

//       const targetOpdId = req.user.opd_id;
//       if (!targetOpdId) {
//         return res
//           .status(400)
//           .json({ error: "Akun Anda tidak terhubung ke OPD manapun." });
//       }

//       const { data: itemData, error: itemError } = await supabase
//         .from("service_items")
//         .select("catalog_id, approval_required, approval_levels")
//         .eq("id", service_item_id)
//         .single();

//       if (itemError || !itemData) {
//         return res
//           .status(404)
//           .json({ error: "Service Item (Layanan) tidak ditemukan" });
//       }

//       const initialStatus = itemData.approval_required
//         ? "pending_approval"
//         : "open";

//       const ticketNumber = generateTicketNumber("request");
//       const creationTime = new Date();

//       const { data: reporter } = await supabase
//         .from("users")
//         .select("nip")
//         .eq("id", req.user.id)
//         .single();

//       const priorityCategory = "medium";

//       const slaData = await calculateSLADue(
//         priorityCategory,
//         targetOpdId,
//         creationTime
//       );

//       const { data: ticket, error } = await supabase
//         .from("tickets")
//         .insert({
//           ticket_number: ticketNumber,
//           type: "request",
//           title,
//           description,
//           service_catalog_id: itemData.catalog_id,
//           service_item_id: service_item_id,
//           service_detail: service_detail,
//           opd_id: targetOpdId,
//           reporter_id: req.user.id,
//           reporter_nip: reporter?.nip,
//           status: initialStatus,
//           priority: priorityCategory,
//           ...slaData,
//           reporter_attachment_url: attachment_url || null,
//           requested_date: requested_date || null,
//           created_at: creationTime,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       if (itemData.approval_required && itemData.approval_levels) {
//         const levels = itemData.approval_levels;

//         if (Array.isArray(levels) && levels.length > 0) {
//           const workflowInserts = levels.map((roleName, index) => ({
//             ticket_id: ticket.id,
//             workflow_level: index + 1,
//             approver_role: roleName,
//             status: "pending",
//             created_at: new Date(),
//           }));

//           const { error: wfError } = await supabase
//             .from("approval_workflows")
//             .insert(workflowInserts);

//           if (wfError) {
//             console.error(
//               "CRITICAL: Gagal membuat approval workflow",
//               wfError.message
//             );
//           }
//         }
//       }

//       await logTicketActivity(
//         ticket.id,
//         req.user.id,
//         "create",
//         `Service request created: ${ticketNumber}`
//       );

//       res.status(201).json({
//         success: true,
//         message: "Service request berhasil dibuat",
//         ticket,
//       });
//     } catch (error) {
//       console.error("Create request error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Get Service Requests
// v1Router.get("/requests", authenticate, async (req, res) => {
//   try {
//     const { status, search, opd_id, page = 1, limit = 20 } = req.query;

//     const offset = (parseInt(page) - 1) * parseInt(limit);

//     let query = supabase
//       .from("tickets")
//       .select(
//         `
//         *,
//         reporter:reporter_id(id, username, full_name, email, nip, phone),
//         technician:assigned_to(id, username, full_name),
//         opd:opd_id(id, name, code),
//         service_catalog:service_catalog_id(id, catalog_name),
//         service_item:service_item_id(id, item_name)
//       `,
//         { count: "exact" }
//       )
//       .eq("type", "request")
//       .order("created_at", { ascending: false })
//       .range(offset, offset + parseInt(limit) - 1);

//     if (req.user.role === "pengguna" || req.user.role === "pegawai_opd") {
//       query = query.eq("reporter_id", req.user.id);
//     } else if (req.user.role === "teknisi") {
//       query = query.eq("assigned_to", req.user.id);
//     } else if (
//       ["admin_opd", "bidang", "seksi", "helpdesk"].includes(req.user.role)
//     ) {
//       query = query.eq("opd_id", req.user.opd_id);
//     }

//     if (status) query = query.eq("status", status);
//     if (opd_id) query = query.eq("opd_id", opd_id);
//     if (search) {
//       query = query.or(
//         `title.ilike.%${search}%,ticket_number.ilike.%${search}%,description.ilike.%${search}%`
//       );
//     }

//     const { data, count, error } = await query;
//     if (error) throw error;

//     res.json({
//       success: true,
//       data,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: count,
//         total_pages: Math.ceil(count / parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     console.error("Get requests error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Service Request Detail
// v1Router.get(
//   "/requests/:id",
//   authenticate,
//   authorize("tickets.read"),
//   async (req, res) => {
//     try {
//       const { data: ticket, error } = await supabase
//         .from("tickets")
//         .select(
//           `
//         *,
//         reporter:reporter_id(id, username, full_name, email, nip, phone),
//         technician:assigned_to(id, username, full_name, phone, nip),
//         opd:opd_id(id, name, code),
//         service_catalog:service_catalog_id(id, catalog_name, description),
//         service_item:service_item_id(id, item_name, description)
//       `
//         )
//         .eq("id", req.params.id)
//         .eq("type", "request")
//         .single();

//       if (error) throw error;
//       if (!ticket) {
//         return res
//           .status(404)
//           .json({ error: "Service request tidak ditemukan" });
//       }

//       if (
//         (req.user.role === "pengguna" || req.user.role === "pegawai_opd") &&
//         ticket.reporter_id !== req.user.id
//       ) {
//         return res.status(403).json({ error: "Akses ditolak" });
//       }

//       const { data: approvals } = await supabase
//         .from("approval_workflows")
//         .select("*")
//         .eq("ticket_id", req.params.id)
//         .order("workflow_level");

//       const { data: progressUpdates } = await supabase
//         .from("ticket_progress_updates")
//         .select(`*, updated_by_user:updated_by(id, username, full_name)`)
//         .eq("ticket_id", req.params.id)
//         .order("update_number");

//       res.json({
//         success: true,
//         ticket,
//         approvals: approvals || [],
//         progress_updates: progressUpdates || [],
//       });
//     } catch (error) {
//       console.error("Get request detail error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Update Service Request
// v1Router.put(
//   "/requests/:id",
//   authenticate,
//   authorize("tickets.write"),
//   async (req, res) => {
//     try {
//       const { status, progress_notes } = req.body;

//       const updateData = { updated_at: new Date() };
//       if (status) updateData.status = status;
//       if (progress_notes) updateData.progress_notes = progress_notes;

//       const { data, error } = await supabase
//         .from("tickets")
//         .update(updateData)
//         .eq("id", req.params.id)
//         .eq("type", "request")
//         .select()
//         .single();

//       if (error) throw error;

//       await logTicketActivity(
//         req.params.id,
//         req.user.id,
//         "update",
//         "Service request diperbarui"
//       );

//       res.json({
//         success: true,
//         message: "Service request berhasil diperbarui",
//         ticket: data,
//       });
//     } catch (error) {
//       console.error("Update request error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Approve Service Request
// v1Router.post("/requests/:id/approve", authenticate, async (req, res) => {
//   try {
//     const { notes } = req.body;

//     const { data: approval } = await supabase
//       .from("approval_workflows")
//       .select("*, ticket:ticket_id(*)")
//       .eq("ticket_id", req.params.id)
//       .eq("approver_role", req.user.role)
//       .eq("status", "pending")
//       .single();

//     if (!approval) {
//       return res.status(404).json({ error: "Approval tidak ditemukan" });
//     }

//     await supabase
//       .from("approval_workflows")
//       .update({
//         approver_id: req.user.id,
//         status: "approved",
//         notes,
//         responded_at: new Date(),
//       })
//       .eq("id", approval.id);

//     const { data: allApprovals } = await supabase
//       .from("approval_workflows")
//       .select("status")
//       .eq("ticket_id", req.params.id)
//       .order("workflow_level");

//     const allApproved = allApprovals?.every((a) => a.status === "approved");

//     if (allApproved) {
//       await supabase
//         .from("tickets")
//         .update({ status: "open", updated_at: new Date() })
//         .eq("id", req.params.id);
//     }

//     await logTicketActivity(
//       req.params.id,
//       req.user.id,
//       "approve",
//       `Approved by ${req.user.role}. ${notes || ""}`
//     );

//     res.json({
//       success: true,
//       message: "Service request berhasil disetujui",
//       all_approved: allApproved,
//     });
//   } catch (error) {
//     console.error("Approve request error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Reject Service Request
// v1Router.post("/requests/:id/reject", authenticate, async (req, res) => {
//   try {
//     const { notes } = req.body;

//     if (!notes) {
//       return res.status(400).json({ error: "Alasan penolakan harus diisi" });
//     }

//     const { data: approval } = await supabase
//       .from("approval_workflows")
//       .select("*, ticket:ticket_id(*)")
//       .eq("ticket_id", req.params.id)
//       .eq("approver_role", req.user.role)
//       .eq("status", "pending")
//       .single();

//     if (!approval) {
//       return res.status(404).json({ error: "Approval tidak ditemukan" });
//     }

//     await supabase
//       .from("approval_workflows")
//       .update({
//         approver_id: req.user.id,
//         status: "rejected",
//         notes,
//         responded_at: new Date(),
//       })
//       .eq("id", approval.id);

//     await supabase
//       .from("tickets")
//       .update({ status: "rejected", closed_at: new Date() })
//       .eq("id", req.params.id);

//     await logTicketActivity(
//       req.params.id,
//       req.user.id,
//       "reject",
//       `Rejected by ${req.user.role}. Reason: ${notes}`
//     );

//     res.json({ success: true, message: "Service request berhasil ditolak" });
//   } catch (error) {
//     console.error("Reject request error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 10. KNOWLEDGE BASE ROUTES
// // ===========================================
// // Get Knowledge Base Articles
// v1Router.get("/kb", authenticate, async (req, res) => {
//   try {
//     const { category, status, search, page = 1, limit = 20 } = req.query;

//     const offset = (parseInt(page) - 1) * parseInt(limit);

//     let query = supabase
//       .from("knowledge_base")
//       .select(
//         `
//         *,
//         author:created_by(id, username, full_name),
//         opd:opd_id(id, name)
//       `,
//         { count: "exact" }
//       )
//       .order("created_at", { ascending: false })
//       .range(offset, offset + parseInt(limit) - 1);

//     if (category) query = query.eq("category", category);
//     if (status) query = query.eq("status", status);
//     else query = query.eq("status", "published");

//     if (search) {
//       query = query.or(
//         `title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`
//       );
//     }

//     const { data, count, error } = await query;
//     if (error) throw error;

//     res.json({
//       success: true,
//       data,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: count,
//         total_pages: Math.ceil(count / parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     console.error("Get KB articles error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Suggest Knowledge Base Articles
// v1Router.get("/kb/suggest", authenticate, async (req, res) => {
//   try {
//     const { query } = req.query;

//     if (!query) {
//       return res.status(400).json({ error: "Query harus diisi" });
//     }

//     const { data, error } = await supabase
//       .from("knowledge_base")
//       .select("id, title, content, category")
//       .eq("status", "published")
//       .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
//       .limit(5);

//     if (error) throw error;

//     res.json({ success: true, count: data.length, suggestions: data });
//   } catch (error) {
//     console.error("Suggest KB articles error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Get Knowledge Base Article Detail
// v1Router.get("/kb/:id", authenticate, async (req, res) => {
//   try {
//     const { data: article, error } = await supabase
//       .from("knowledge_base")
//       .select(
//         `
//         *,
//         author:created_by(id, username, full_name),
//         opd:opd_id(id, name)
//       `
//       )
//       .eq("id", req.params.id)
//       .single();

//     if (error) throw error;
//     if (!article) {
//       return res.status(404).json({ error: "Artikel tidak ditemukan" });
//     }

//     await supabase
//       .from("knowledge_base")
//       .update({ view_count: (article.view_count || 0) + 1 })
//       .eq("id", req.params.id);

//     res.json({ success: true, article });
//   } catch (error) {
//     console.error("Get KB article error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Create Knowledge Base Article
// v1Router.post("/kb", authenticate, authorize("kb.write"), async (req, res) => {
//   try {
//     const { title, content, category, tags, opd_id } = req.body;

//     if (!title || !content) {
//       return res.status(400).json({ error: "Title dan content harus diisi" });
//     }

//     const { data, error } = await supabase
//       .from("knowledge_base")
//       .insert({
//         title,
//         content,
//         category,
//         tags: tags || [],
//         opd_id: opd_id || req.user.opd_id,
//         created_by: req.user.id,
//         status: "draft",
//       })
//       .select()
//       .single();

//     if (error) throw error;

//     res.status(201).json({
//       success: true,
//       message: "Artikel KB berhasil dibuat (draft)",
//       article: data,
//     });
//   } catch (error) {
//     console.error("Create KB article error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Update Knowledge Base Article
// v1Router.put(
//   "/kb/:id",
//   authenticate,
//   authorize("kb.write"),
//   async (req, res) => {
//     try {
//       const { title, content, category, tags } = req.body;

//       const updateData = { updated_at: new Date() };
//       if (title) updateData.title = title;
//       if (content) updateData.content = content;
//       if (category) updateData.category = category;
//       if (tags) updateData.tags = tags;

//       const { data, error } = await supabase
//         .from("knowledge_base")
//         .update(updateData)
//         .eq("id", req.params.id)
//         .select()
//         .single();

//       if (error) throw error;

//       res.json({
//         success: true,
//         message: "Artikel KB berhasil diperbarui",
//         article: data,
//       });
//     } catch (error) {
//       console.error("Update KB article error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Delete Knowledge Base Article
// v1Router.delete(
//   "/kb/:id",
//   authenticate,
//   authorize("kb.write"),
//   async (req, res) => {
//     try {
//       const { error } = await supabase
//         .from("knowledge_base")
//         .delete()
//         .eq("id", req.params.id);

//       if (error) throw error;

//       res.json({
//         success: true,
//         message: "Artikel KB berhasil dihapus",
//       });
//     } catch (error) {
//       console.error("Delete KB article error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // ===========================================
// // 11. DASHBOARD ROUTE
// // ===========================================
// v1Router.get("/dashboard", authenticate, async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     const opdId = req.user.opd_id;

//     let ticketFilter = {};

//     if (userRole === "pengguna") {
//       ticketFilter = { reporter_id: req.user.id };
//     } else if (userRole === "teknisi") {
//       ticketFilter = { assigned_to: req.user.id };
//     } else if (
//       ["admin_opd", "bidang", "seksi", "helpdesk"].includes(userRole)
//     ) {
//       ticketFilter = { opd_id: opdId };
//     }

//     let query = supabase
//       .from("tickets")
//       .select("status, priority, type", { count: "exact" });

//     Object.entries(ticketFilter).forEach(([key, value]) => {
//       query = query.eq(key, value);
//     });

//     const { data: tickets, count: totalTickets } = await query;

//     const statusCounts = {
//       open: 0,
//       assigned: 0,
//       in_progress: 0,
//       resolved: 0,
//       closed: 0,
//     };

//     const priorityCounts = {
//       low: 0,
//       medium: 0,
//       high: 0,
//       major: 0,
//     };

//     tickets?.forEach((ticket) => {
//       if (statusCounts[ticket.status] !== undefined) {
//         statusCounts[ticket.status]++;
//       }
//       if (priorityCounts[ticket.priority] !== undefined) {
//         priorityCounts[ticket.priority]++;
//       }
//     });

//     res.json({
//       success: true,
//       dashboard: {
//         total_tickets: totalTickets,
//         by_status: statusCounts,
//         by_priority: priorityCounts,
//         role: userRole,
//         scope:
//           userRole === "admin_kota"
//             ? "All OPD"
//             : opdId
//             ? `OPD ${opdId}`
//             : "Personal",
//       },
//     });
//   } catch (error) {
//     console.error("Get dashboard error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 12. SEARCH ROUTE
// // ===========================================
// v1Router.get("/search", authenticate, async (req, res) => {
//   try {
//     const { q, type, page = 1, limit = 20 } = req.query;

//     if (!q) {
//       return res.status(400).json({ error: "Query pencarian harus diisi" });
//     }

//     const offset = (parseInt(page) - 1) * parseInt(limit);
//     const results = {};

//     // Search tickets
//     if (!type || type === "tickets") {
//       let ticketQuery = supabase
//         .from("tickets")
//         .select("id, ticket_number, title, type, status, created_at", {
//           count: "exact",
//         })
//         .or(
//           `title.ilike.%${q}%,ticket_number.ilike.%${q}%,description.ilike.%${q}%`
//         )
//         .range(offset, offset + parseInt(limit) - 1);

//       if (req.user.role === "pengguna") {
//         ticketQuery = ticketQuery.eq("reporter_id", req.user.id);
//       } else if (
//         ["admin_opd", "bidang", "seksi", "helpdesk"].includes(req.user.role)
//       ) {
//         ticketQuery = ticketQuery.eq("opd_id", req.user.opd_id);
//       }

//       const { data: tickets, count: ticketCount } = await ticketQuery;
//       results.tickets = { data: tickets, count: ticketCount };
//     }

//     // Search KB
//     if (!type || type === "kb") {
//       const { data: articles, count: kbCount } = await supabase
//         .from("knowledge_base")
//         .select("id, title, category, created_at", { count: "exact" })
//         .eq("status", "published")
//         .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
//         .range(offset, offset + parseInt(limit) - 1);

//       results.kb = { data: articles, count: kbCount };
//     }

//     res.json({
//       success: true,
//       query: q,
//       results,
//     });
//   } catch (error) {
//     console.error("Search error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 13. SYNC ROUTE (Mobile Offline)
// // ===========================================
// v1Router.post("/sync", authenticate, async (req, res) => {
//   try {
//     const { tickets, progress_updates } = req.body;

//     const results = {
//       tickets: [],
//       progress_updates: [],
//       errors: [],
//     };

//     // Sync tickets
//     if (tickets && Array.isArray(tickets)) {
//       for (const ticket of tickets) {
//         try {
//           const ticketNumber = generateTicketNumber(ticket.type || "incident");
//           const { data } = await supabase
//             .from("tickets")
//             .insert({
//               ...ticket,
//               ticket_number: ticketNumber,
//               reporter_id: req.user.id,
//               created_at: ticket.created_at || new Date(),
//             })
//             .select()
//             .single();

//           results.tickets.push({
//             local_id: ticket.local_id,
//             server_id: data.id,
//             ticket_number: ticketNumber,
//           });
//         } catch (error) {
//           results.errors.push({
//             type: "ticket",
//             local_id: ticket.local_id,
//             error: error.message,
//           });
//         }
//       }
//     }

//     // Sync progress updates
//     if (progress_updates && Array.isArray(progress_updates)) {
//       for (const update of progress_updates) {
//         try {
//           const { data } = await supabase
//             .from("ticket_progress_updates")
//             .insert({
//               ...update,
//               updated_by: req.user.id,
//               created_at: update.created_at || new Date(),
//             })
//             .select()
//             .single();

//           results.progress_updates.push({
//             local_id: update.local_id,
//             server_id: data.id,
//           });
//         } catch (error) {
//           results.errors.push({
//             type: "progress_update",
//             local_id: update.local_id,
//             error: error.message,
//           });
//         }
//       }
//     }

//     res.json({
//       success: true,
//       message: "Sinkronisasi selesai",
//       results,
//     });
//   } catch (error) {
//     console.error("Sync error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 14. ADMIN OPERATIONS ROUTES
// // ===========================================
// // GET /admin/roles - List Semua Role & Permission-nya
// v1Router.get(
//   "/admin/roles",
//   authenticate,
//   authorize("rbac.manage"),
//   async (req, res) => {
//     try {
//       const { data, error } = await supabase
//         .from("roles_config")
//         .select("*")
//         .order("role_key");

//       if (error) throw error;
//       res.json({ success: true, data });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

// // POST /admin/roles - Buat Role Baru (Custom Role)
// v1Router.post(
//   "/admin/roles",
//   authenticate,
//   authorize("rbac.manage"), // Hanya Super Admin / Admin Kota
//   async (req, res) => {
//     try {
//       const { role_key, description, permissions } = req.body;

//       // Validasi: role_key tidak boleh spasi, harus unik
//       if (!role_key || !/^[a-z0-9_]+$/.test(role_key)) {
//         return res
//           .status(400)
//           .json({ error: "Role Key harus huruf kecil dan underscore (a-z_)" });
//       }

//       const { data, error } = await supabase
//         .from("roles_config")
//         .insert({
//           role_key,
//           description,
//           permissions: permissions || [],
//           is_system: false, // Role buatan user bukan sistem
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       // PENTING: Refresh Cache agar role baru langsung aktif
//       await reloadRbacCache();

//       // PENTING: Perbarui Constraint Check di Database (Opsional tapi disarankan)
//       // Note: Di Supabase/Postgres, mengubah CHECK constraint kolom 'role' di tabel users
//       // butuh query ALTER TABLE. Untuk MVP, abaikan dulu atau handle manual.

//       res.status(201).json({
//         success: true,
//         message: "Role baru berhasil dibuat",
//         role: data,
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

// // PUT /admin/roles/:id - Edit Permission Role
// v1Router.put(
//   "/admin/roles/:id",
//   authenticate,
//   authorize("rbac.manage"),
//   async (req, res) => {
//     try {
//       const { permissions, description } = req.body;
//       const roleId = req.params.id;

//       // Validasi input
//       if (!Array.isArray(permissions)) {
//         return res
//           .status(400)
//           .json({ error: "Permissions harus berupa array string" });
//       }

//       // Update Database
//       const { data, error } = await supabase
//         .from("roles_config")
//         .update({
//           permissions,
//           description,
//           updated_at: new Date(),
//         })
//         .eq("id", roleId)
//         .select()
//         .single();

//       if (error) throw error;

//       // PENTING: Refresh Cache agar perubahan permission langsung berlaku
//       await reloadRbacCache();

//       await logTicketActivity(
//         0,
//         req.user.id,
//         "rbac_update",
//         `Update permissions for role ${data.role_key}`
//       );

//       res.json({
//         success: true,
//         message: "Permissions role berhasil diupdate",
//         role: data,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

// // DELETE /admin/roles/:id - Hapus Role
// v1Router.delete(
//   "/admin/roles/:id",
//   authenticate,
//   authorize("rbac.manage"),
//   async (req, res) => {
//     try {
//       // Cek apakah role system (tidak boleh dihapus)
//       const { data: roleCheck } = await supabase
//         .from("roles_config")
//         .select("is_system, role_key")
//         .eq("id", req.params.id)
//         .single();

//       if (roleCheck && roleCheck.is_system) {
//         return res
//           .status(403)
//           .json({ error: "Role sistem bawaan tidak dapat dihapus." });
//       }

//       // Hapus
//       const { error } = await supabase
//         .from("roles_config")
//         .delete()
//         .eq("id", req.params.id);

//       if (error) throw error;

//       await reloadRbacCache();

//       res.json({ success: true, message: "Role berhasil dihapus" });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// );
// v1Router.get(
//   "/admin/users",
//   authenticate,
//   authorize("users.read"),
//   async (req, res) => {
//     try {
//       const { role, opd_id, is_active, page = 1, limit = 20 } = req.query;

//       const offset = (parseInt(page) - 1) * parseInt(limit);

//       let query = supabase
//         .from("users")
//         .select(
//           `
//         id, username, email, full_name, nip, phone, role, is_active,
//         opd:opd_id(id, name),
//         bidang:bidang_id(id, name),
//         seksi:seksi_id(id, name),
//         created_at, last_login_at
//       `,
//           { count: "exact" }
//         )
//         .order("created_at", { ascending: false })
//         .range(offset, offset + parseInt(limit) - 1);

//       if (role) query = query.eq("role", role);
//       if (opd_id) query = query.eq("opd_id", opd_id);
//       if (is_active !== undefined)
//         query = query.eq("is_active", is_active === "true");

//       const { data, count, error } = await query;
//       if (error) throw error;

//       res.json({
//         success: true,
//         data,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total: count,
//           total_pages: Math.ceil(count / parseInt(limit)),
//         },
//       });
//     } catch (error) {
//       console.error("Get users error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Create User
// v1Router.post(
//   "/admin/users",
//   authenticate,
//   authorize("users.write"),
//   async (req, res) => {
//     try {
//       const {
//         username,
//         password,
//         email,
//         full_name,
//         nip,
//         phone,
//         address,
//         role,
//         opd_id,
//         bidang_id,
//         seksi_id,
//       } = req.body;

//       if (!username || !password || !email || !role || !full_name) {
//         return res.status(400).json({
//           error:
//             "Username, password, email, nama lengkap, dan role harus diisi",
//         });
//       }

//       if (role !== "admin_kota" && !opd_id) {
//         return res
//           .status(400)
//           .json({ error: "Hanya Admin Kota yang boleh tidak memiliki OPD ID" });
//       }

//       if (!RBAC_ROLES[role]) {
//         return res.status(400).json({ error: "Role tidak valid" });
//       }

//       const hashedPassword = await bcrypt.hash(password, 10);

//       const { data, error } = await supabase
//         .from("users")
//         .insert({
//           username,
//           password: hashedPassword,
//           email,
//           full_name,
//           nip,
//           phone,
//           address,
//           role: role,
//           opd_id: opd_id || null,
//           bidang_id: bidang_id || null,
//           seksi_id: seksi_id || null,
//           is_active: true,
//         })
//         .select()
//         .single();

//       if (error) {
//         if (error.code === "23505") {
//           return res
//             .status(400)
//             .json({ error: "Username atau email sudah digunakan" });
//         }
//         throw error;
//       }

//       delete data.password;

//       res.status(201).json({
//         success: true,
//         message: `Akun pegawai (${role}) berhasil dibuat`,
//         user: data,
//       });
//     } catch (error) {
//       console.error("Admin create user error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Update User Role
// v1Router.put(
//   "/admin/users/:id/role",
//   authenticate,
//   authorize("users.write"),
//   async (req, res) => {
//     try {
//       const { role, opd_id, bidang_id, seksi_id, is_active } = req.body;

//       const updateData = {};
//       if (role) updateData.role = role;
//       if (opd_id !== undefined) updateData.opd_id = opd_id;
//       if (bidang_id !== undefined) updateData.bidang_id = bidang_id;
//       if (seksi_id !== undefined) updateData.seksi_id = seksi_id;
//       if (is_active !== undefined) updateData.is_active = is_active;

//       const { data, error } = await supabase
//         .from("users")
//         .update(updateData)
//         .eq("id", req.params.id)
//         .select()
//         .single();

//       if (error) throw error;

//       res.json({
//         success: true,
//         message: "Role user berhasil diperbarui",
//         user: data,
//       });
//     } catch (error) {
//       console.error("Update user role error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Get OPDs
// v1Router.get(
//   "/admin/opd",
//   authenticate,
//   authorize("opd.read"),
//   async (req, res) => {
//     try {
//       const { is_active, page = 1, limit = 20 } = req.query;

//       const offset = (parseInt(page) - 1) * parseInt(limit);

//       let query = supabase
//         .from("opd")
//         .select("*", { count: "exact" })
//         .order("name")
//         .range(offset, offset + parseInt(limit) - 1);

//       if (is_active !== undefined)
//         query = query.eq("is_active", is_active === "true");

//       const { data, count, error } = await query;
//       if (error) throw error;

//       res.json({
//         success: true,
//         data,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total: count,
//           total_pages: Math.ceil(count / parseInt(limit)),
//         },
//       });
//     } catch (error) {
//       console.error("Get OPD error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Update OPD Calendar
// v1Router.put(
//   "/admin/opd/:id/calendar",
//   authenticate,
//   authorize("opd.write"),
//   async (req, res) => {
//     try {
//       const { working_hours, holidays } = req.body;

//       const updateData = {};
//       if (working_hours) updateData.working_hours = working_hours;
//       if (holidays) updateData.holidays = holidays;

//       const { data, error } = await supabase
//         .from("opd")
//         .update(updateData)
//         .eq("id", req.params.id)
//         .select()
//         .single();

//       if (error) throw error;

//       res.json({
//         success: true,
//         message: "Kalender OPD berhasil diperbarui",
//         opd: data,
//       });
//     } catch (error) {
//       console.error("Update OPD calendar error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Update Technician Skills
// v1Router.put(
//   "/admin/technicians/:id/skills",
//   authenticate,
//   authorize("users.write"),
//   async (req, res) => {
//     try {
//       const { skills, expertise_level, certifications } = req.body;

//       if (!skills || !Array.isArray(skills)) {
//         return res.status(400).json({ error: "Skills harus berupa array" });
//       }

//       // Delete existing skills
//       await supabase
//         .from("technician_skills")
//         .delete()
//         .eq("user_id", req.params.id);

//       // Insert new skills
//       const skillsData = skills.map((skill) => ({
//         user_id: req.params.id,
//         skill_name: skill.name,
//         skill_level: skill.level || "intermediate",
//         category: skill.category,
//       }));

//       const { data, error } = await supabase
//         .from("technician_skills")
//         .insert(skillsData)
//         .select();

//       if (error) throw error;

//       // Update user record
//       await supabase
//         .from("users")
//         .update({
//           expertise_level,
//           certifications,
//         })
//         .eq("id", req.params.id);

//       res.json({
//         success: true,
//         message: "Skills teknisi berhasil diperbarui",
//         skills: data,
//       });
//     } catch (error) {
//       console.error("Update technician skills error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // ===========================================
// // 15. QR CODE SCANNING ROUTE
// // ===========================================
// v1Router.get("/assets/qr/:qr_code", authenticate, async (req, res) => {
//   try {
//     const qrCode = req.params.qr_code;
//     const userRole = req.user.role;

//     const { data: asset, error } = await supabase
//       .from("assets")
//       .select(
//         `
//         *,
//         opd:opd_id(id, name),
//         location:location_id(id, name, address)
//       `
//       )
//       .eq("qr_code", qrCode)
//       .single();

//     if (error || !asset) {
//       return res.status(404).json({ error: "Asset tidak ditemukan" });
//     }

//     if (userRole === "pengguna") {
//       res.json({
//         success: true,
//         action: "create_ticket",
//         message: "Gunakan informasi ini untuk membuat tiket",
//         asset: {
//           id: asset.id,
//           name: asset.name,
//           type: asset.asset_type,
//           location: asset.location?.name,
//           opd: asset.opd?.name,
//         },
//       });
//     } else if (userRole === "teknisi") {
//       await supabase.from("technician_check_ins").insert({
//         technician_id: req.user.id,
//         asset_id: asset.id,
//         check_in_time: new Date(),
//         qr_code: qrCode,
//       });

//       res.json({
//         success: true,
//         action: "technician_check_in",
//         message: "Check-in berhasil",
//         asset: {
//           id: asset.id,
//           name: asset.name,
//           type: asset.asset_type,
//         },
//       });
//     } else {
//       res.status(403).json({ error: "Role tidak valid untuk scan QR" });
//     }
//   } catch (error) {
//     console.error("QR scan error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 16. COMMENTS ROUTES
// // ===========================================
// // Add Comment to Incident
// v1Router.post("/incidents/:id/comments", authenticate, async (req, res) => {
//   try {
//     const { content, is_internal } = req.body;

//     if (!content) {
//       return res.status(400).json({ error: "Konten komentar harus diisi" });
//     }

//     const { data, error } = await supabase
//       .from("ticket_comments")
//       .insert({
//         ticket_id: req.params.id,
//         user_id: req.user.id,
//         content,
//         is_internal: is_internal || false,
//       })
//       .select(`*, user:user_id(id, username, full_name, role)`)
//       .single();

//     if (error) throw error;

//     await logTicketActivity(
//       req.params.id,
//       req.user.id,
//       "comment",
//       is_internal ? "Added internal note" : "Added comment"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Komentar berhasil ditambahkan",
//       comment: data,
//     });
//   } catch (error) {
//     console.error("Add comment error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // Add Comment to Request
// v1Router.post("/requests/:id/comments", authenticate, async (req, res) => {
//   try {
//     const { content, is_internal } = req.body;

//     if (!content) {
//       return res.status(400).json({ error: "Konten komentar harus diisi" });
//     }

//     const { data, error } = await supabase
//       .from("ticket_comments")
//       .insert({
//         ticket_id: req.params.id,
//         user_id: req.user.id,
//         content,
//         is_internal: is_internal || false,
//       })
//       .select(`*, user:user_id(id, username, full_name, role)`)
//       .single();

//     if (error) throw error;

//     await logTicketActivity(
//       req.params.id,
//       req.user.id,
//       "comment",
//       is_internal ? "Added internal note" : "Added comment"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Komentar berhasil ditambahkan",
//       comment: data,
//     });
//   } catch (error) {
//     console.error("Add comment error:", error);
//     res.status(500).json({ error: "Terjadi kesalahan server" });
//   }
// });

// // ===========================================
// // 17. PROGRESS UPDATES ROUTES
// // ===========================================
// // Add Progress Update to Incident
// v1Router.post(
//   "/incidents/:id/progress",
//   authenticate,
//   authorize("tickets.update_progress"),
//   async (req, res) => {
//     try {
//       const {
//         update_number,
//         status_change,
//         reason,
//         problem_detail,
//         handling_description,
//         final_solution,
//       } = req.body;

//       if (!update_number || !status_change) {
//         return res
//           .status(400)
//           .json({ error: "Update number dan status harus diisi" });
//       }

//       const { data: progressUpdate, error } = await supabase
//         .from("ticket_progress_updates")
//         .insert({
//           ticket_id: req.params.id,
//           update_number: parseInt(update_number),
//           updated_by: req.user.id,
//           status_change,
//           reason,
//           problem_detail,
//           handling_description,
//           final_solution,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       let dbStatus = null;
//       let updatePayload = { updated_at: new Date() };

//       const statusInput = status_change.toLowerCase();

//       if (
//         statusInput.includes("selesai") ||
//         statusInput.includes("ditutup") ||
//         statusInput === "resolved"
//       ) {
//         dbStatus = "resolved";
//         updatePayload.resolution = final_solution;
//         updatePayload.resolved_at = new Date();
//       } else if (
//         statusInput.includes("ditangani") ||
//         statusInput.includes("proses") ||
//         statusInput === "in_progress"
//       ) {
//         dbStatus = "in_progress";
//       } else if (statusInput === "closed") {
//         dbStatus = "closed";
//         updatePayload.closed_at = new Date();
//       }

//       if (dbStatus) {
//         updatePayload.status = dbStatus;

//         await supabase
//           .from("tickets")
//           .update(updatePayload)
//           .eq("id", req.params.id);
//       }

//       await logTicketActivity(
//         req.params.id,
//         req.user.id,
//         "progress_update",
//         `Progress Update ${update_number}: ${status_change}`
//       );

//       res.status(201).json({
//         success: true,
//         message: "Progress update berhasil ditambahkan",
//         progress_update: progressUpdate,
//       });
//     } catch (error) {
//       console.error("Update progress error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // Add Progress Update to Request
// v1Router.post(
//   "/requests/:id/progress",
//   authenticate,
//   authorize("tickets.update_progress"),
//   async (req, res) => {
//     try {
//       const { update_number, status_change, notes } = req.body;

//       if (!update_number || !status_change) {
//         return res
//           .status(400)
//           .json({ error: "Update number dan status harus diisi" });
//       }

//       const { data: progressUpdate, error } = await supabase
//         .from("ticket_progress_updates")
//         .insert({
//           ticket_id: req.params.id,
//           update_number: parseInt(update_number),
//           updated_by: req.user.id,
//           status_change,
//           handling_description: notes,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       let dbStatus = null;
//       let updatePayload = { updated_at: new Date() };

//       const statusInput = status_change.toLowerCase();

//       if (statusInput.includes("selesai") || statusInput === "resolved") {
//         dbStatus = "resolved";
//         updatePayload.resolved_at = new Date();
//       } else if (
//         statusInput.includes("proses") ||
//         statusInput.includes("dikerjakan") ||
//         statusInput === "in_progress"
//       ) {
//         dbStatus = "in_progress";
//       }

//       if (dbStatus) {
//         updatePayload.status = dbStatus;

//         await supabase
//           .from("tickets")
//           .update(updatePayload)
//           .eq("id", req.params.id);
//       }

//       await logTicketActivity(
//         req.params.id,
//         req.user.id,
//         "progress_update",
//         `Progress Update ${update_number}: ${status_change}`
//       );

//       res.status(201).json({
//         success: true,
//         message: "Progress update berhasil ditambahkan",
//         progress_update: progressUpdate,
//       });
//     } catch (error) {
//       console.error("Update progress error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // ===========================================
// // 18. AUDIT LOGS ROUTE
// // ===========================================
// v1Router.get(
//   "/admin/audit-logs",
//   authenticate,
//   authorize("reports.read"),
//   async (req, res) => {
//     try {
//       const {
//         user_id,
//         action,
//         date_from,
//         date_to,
//         page = 1,
//         limit = 100,
//       } = req.query;

//       const offset = (parseInt(page) - 1) * parseInt(limit);

//       let query = supabase
//         .from("ticket_logs")
//         .select(
//           `
//         *,
//         user:user_id(id, username, full_name, role),
//         ticket:ticket_id(ticket_number, title)
//       `,
//           { count: "exact" }
//         )
//         .order("created_at", { ascending: false })
//         .range(offset, offset + parseInt(limit) - 1);

//       if (user_id) query = query.eq("user_id", user_id);
//       if (action) query = query.eq("action", action);
//       if (date_from) query = query.gte("created_at", date_from);
//       if (date_to) query = query.lte("created_at", date_to);

//       const { data, count, error } = await query;
//       if (error) throw error;

//       res.json({
//         success: true,
//         data,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total: count,
//           total_pages: Math.ceil(count / parseInt(limit)),
//         },
//       });
//     } catch (error) {
//       console.error("Get audit logs error:", error);
//       res.status(500).json({ error: "Terjadi kesalahan server" });
//     }
//   }
// );

// // ===========================================
// // 19. ERROR HANDLING
// // ===========================================
// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({
//     error:
//       "BASE URL-NYA SALAH YA GAIS. YANG BENAR BASE URL: https://manpro-473802.et.r.appspot.com/api/v1",
//     path: req.path,
//     method: req.method,
//   });
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error("Global error:", err);

//   if (err.code === "LIMIT_FILE_SIZE") {
//     return res.status(400).json({ error: "File terlalu besar. Maksimal 10MB" });
//   }

//   if (err.message === "Invalid file type") {
//     return res.status(400).json({ error: "Tipe file tidak didukung" });
//   }

//   res.status(err.status || 500).json({
//     error: err.message || "Terjadi kesalahan server",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });

// // ===========================================
// // 20. SERVER START
// // ===========================================
// httpServer.listen(PORT, () => {
//   console.log(`
// ================================================================
// 🚀 SERVICE DESK API V2.0 + REAL-TIME CHAT 💬
// ================================================================
// Port: ${PORT}
// Environment: ${process.env.NODE_ENV || "development"}
// Status: ✅ Running
// Socket.IO: ✅ Enabled (Real-time Chat)
// Roles:
// - super_admin       : Full access
// - admin_kota        : City-level admin
// - admin_opd         : Department admin
// - bidang            : Section head (verifier)
// - seksi             : Unit head (recorder)
// - teknisi           : Technician (handler)
// - pegawai_opd       : OPD Employee
// - pengguna          : End user

// API Documentation: http://localhost:${PORT}/api-docs
// Socket Events:
// - join_ticket_chat  : Join chat room for ticket
// - send_message      : Send chat message
// - typing_start      : Notify typing
// - typing_stop       : Stop typing
// ================================================================
//   `);
// });

// // ===========================================
// // 21. GRACEFUL SHUTDOWN
// // ===========================================
// process.on("SIGTERM", () => {
//   console.log("SIGTERM received, shutting down gracefully...");
//   httpServer.close(() => {
//     console.log("Server closed");
//     process.exit(0);
//   });
// });

// process.on("SIGINT", () => {
//   console.log("SIGINT received, shutting down gracefully...");
//   httpServer.close(() => {
//     console.log("Server closed");
//     process.exit(0);
//   });
// });

// module.exports = { app, httpServer, io };

console.log("app.js loaded");
