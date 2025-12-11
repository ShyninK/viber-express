-- ================================================
-- NOTIFIKASI WHATSAPP OTOMATIS UNTUK TIKET BARU
-- ================================================

-- 1. BUAT TABEL NOTIFICATIONS (Jika belum ada)
-- ================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL NOT NULL,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NULL DEFAULT 'info'::VARCHAR,
  related_ticket_id INTEGER NULL,
  is_read BOOLEAN NULL DEFAULT FALSE,
  read_at TIMESTAMP WITHOUT TIME ZONE NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_related_ticket_id_fkey FOREIGN KEY (related_ticket_id) REFERENCES tickets (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT notifications_type_check CHECK (
    (type)::TEXT = ANY (
      ARRAY[
        'info'::VARCHAR,
        'warning'::VARCHAR,
        'error'::VARCHAR,
        'success'::VARCHAR
      ]::TEXT[]
    )
  )
) TABLESPACE pg_default;

-- Create indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications USING btree (user_id, is_read) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notif_ticket ON public.notifications USING btree (related_ticket_id) TABLESPACE pg_default;

COMMENT ON TABLE public.notifications IS 'Tabel untuk menyimpan notifikasi user dan integrasi WhatsApp';


-- 2. BUAT FUNGSI UNTUK MENGIRIM NOTIFIKASI
-- ================================================
-- Function ini akan dipanggil oleh trigger ketika ada tiket baru

CREATE OR REPLACE FUNCTION notify_helpdesk_on_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  helpdesk_user RECORD;
  ticket_message TEXT;
BEGIN
  -- Format pesan notifikasi
  ticket_message := format(
    'Tiket baru telah dibuat:\n\n📋 ID: #%s\n👤 Pelapor: %s\n📍 Lokasi: %s\n⚡ Prioritas: %s\n📝 Deskripsi: %s',
    NEW.id,
    COALESCE(NEW.reporter_name, 'N/A'),
    COALESCE(NEW.location, 'N/A'),
    COALESCE(NEW.priority, 'normal'),
    COALESCE(SUBSTRING(NEW.description, 1, 100), 'Tidak ada deskripsi')
  );

  -- Loop untuk setiap helpdesk user dan create notification
  FOR helpdesk_user IN 
    SELECT id, username, email, phone_number
    FROM users
    WHERE (role = 'helpdesk' OR role = 'admin')
      AND is_active = TRUE
  LOOP
    -- Insert notification ke database
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_ticket_id,
      is_read
    ) VALUES (
      helpdesk_user.id,
      '🎫 Tiket Baru Masuk',
      ticket_message,
      'info',
      NEW.id,
      FALSE
    );

    -- Log untuk debugging
    RAISE NOTICE 'Notification created for user % (ID: %)', helpdesk_user.username, helpdesk_user.id;
  END LOOP;

  -- Trigger akan memanggil API untuk kirim WhatsApp
  -- (Menggunakan pg_notify atau webhook/API call dari aplikasi)
  PERFORM pg_notify(
    'new_ticket_notification',
    json_build_object(
      'ticket_id', NEW.id,
      'reporter_name', NEW.reporter_name,
      'location', NEW.location,
      'priority', NEW.priority,
      'description', NEW.description,
      'status', NEW.status,
      'reporter_email', NEW.reporter_email,
      'reporter_phone', NEW.reporter_phone
    )::TEXT
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_helpdesk_on_new_ticket() IS 'Function untuk membuat notifikasi ketika ada tiket baru';


-- 3. BUAT TRIGGER UNTUK AUTO-NOTIFICATION
-- ================================================
-- Trigger ini akan otomatis berjalan setiap kali ada INSERT ke tabel tickets

DROP TRIGGER IF EXISTS trigger_notify_helpdesk_on_new_ticket ON tickets;

CREATE TRIGGER trigger_notify_helpdesk_on_new_ticket
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_helpdesk_on_new_ticket();

COMMENT ON TRIGGER trigger_notify_helpdesk_on_new_ticket ON tickets IS 'Trigger untuk mengirim notifikasi ke helpdesk ketika tiket baru dibuat';


-- 4. BUAT TABEL USERS (Jika belum ada) - UNTUK TESTING
-- ================================================
-- Pastikan tabel users memiliki kolom yang diperlukan

-- CREATE TABLE IF NOT EXISTS public.users (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(100) NOT NULL,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   phone_number VARCHAR(20) NULL,
--   role VARCHAR(20) DEFAULT 'user',
--   is_active BOOLEAN DEFAULT TRUE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- 5. INSERT SAMPLE HELPDESK USERS (UNTUK TESTING)
-- ================================================
-- Ganti nomor WA dengan nomor yang valid (format: 6281234567890)

-- INSERT INTO users (username, email, phone_number, role, is_active)
-- VALUES 
--   ('Helpdesk Admin', 'helpdesk@siladan.go.id', '6281234567890', 'helpdesk', TRUE),
--   ('Admin Kota', 'admin@siladan.go.id', '6289876543210', 'admin', TRUE)
-- ON CONFLICT (email) DO NOTHING;


-- ================================================
-- CARA MENGGUNAKAN SISTEM NOTIFIKASI
-- ================================================

/*
LANGKAH-LANGKAH SETUP:

1. INSTALL DEPENDENCIES
   cd /path/to/project
   npm install

2. JALANKAN DATABASE MIGRATION
   - Jalankan script SQL ini di Supabase SQL Editor
   - Pastikan tabel tickets dan users sudah ada

3. START SERVER
   npm run dev

4. SCAN QR CODE WHATSAPP
   - Buka terminal dan lihat QR code
   - Atau akses: http://localhost:8080/api/v1/notifications/whatsapp/qr
   - Scan dengan WhatsApp untuk connect

5. TEST SISTEM
   - Buat tiket baru via API atau form
   - Notifikasi otomatis akan masuk ke database
   - WhatsApp otomatis terkirim ke semua helpdesk

6. CEK STATUS WHATSAPP
   GET http://localhost:8080/api/v1/notifications/whatsapp/status

7. CEK NOTIFIKASI USER
   GET http://localhost:8080/api/v1/notifications/users/{userId}
*/


-- ================================================
-- CONTOH PENGGUNAAN API
-- ================================================

/*
1. CEK STATUS WHATSAPP
   =====================
   GET http://localhost:8080/api/v1/notifications/whatsapp/status
   
   Response:
   {
     "status": true,
     "message": "WhatsApp connected",
     "connected": true
   }

2. GET QR CODE
   ============
   GET http://localhost:8080/api/v1/notifications/whatsapp/qr
   
   Response (jika belum connect):
   {
     "status": true,
     "message": "QR code generated",
     "qr": "2@abc123...",
     "connected": false
   }

3. TEST KIRIM WHATSAPP
   ====================
   POST http://localhost:8080/api/v1/notifications/whatsapp/test
   Content-Type: application/json
   
   {
     "phoneNumber": "6281234567890",
     "message": "Test notifikasi dari SILADAN"
   }
   
   Response:
   {
     "status": true,
     "message": "WhatsApp message sent successfully",
     "data": {
       "success": true,
       "messageId": "3EB0...",
       "to": "6281234567890@s.whatsapp.net"
     }
   }

4. GET NOTIFIKASI USER
   ====================
   GET http://localhost:8080/api/v1/notifications/users/5?limit=10
   
   Response:
   {
     "status": true,
     "message": "Notifications retrieved successfully",
     "data": [
       {
         "id": 1,
         "user_id": 5,
         "title": "🎫 Tiket Baru Masuk",
         "message": "Tiket baru telah dibuat: ...",
         "type": "info",
         "related_ticket_id": 123,
         "is_read": false,
         "read_at": null,
         "created_at": "2024-01-15T10:30:00Z"
       }
     ]
   }

5. MARK NOTIFICATION AS READ
   =========================
   PUT http://localhost:8080/api/v1/notifications/1/read
   
   Response:
   {
     "status": true,
     "message": "Notification marked as read",
     "data": { ... }
   }

6. GET UNREAD COUNT
   ================
   GET http://localhost:8080/api/v1/notifications/users/5/unread
   
   Response:
   {
     "status": true,
     "message": "Unread count retrieved successfully",
     "data": {
       "count": 3
     }
   }
*/


-- ================================================
-- INTEGRASI DENGAN APLIKASI BACKEND
-- ================================================

/*
CARA MEMANGGIL NOTIFIKASI DARI CODE:

// Di dalam controller untuk create ticket
import { sendTicketNotificationToHelpdesk } from "../controllers/notificationController.js";

export const createTicket = async (req, res) => {
  try {
    // 1. Create ticket di database
    const ticket = await createTicketInDatabase(req.body);
    
    // 2. Trigger akan otomatis create notifications di database
    // 3. Manual trigger untuk kirim WhatsApp
    await sendTicketNotificationToHelpdesk(ticket);
    
    res.json({
      status: true,
      message: "Ticket created and notifications sent",
      data: ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
  }
};
*/


-- ================================================
-- LISTEN TO pg_notify (OPTIONAL - Untuk realtime)
-- ================================================

/*
Jika ingin menggunakan PostgreSQL LISTEN/NOTIFY untuk realtime:

// Di src/config/supabase.js atau file terpisah
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Listen to database changes
const subscription = supabase
  .channel('new_ticket_notification')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'tickets' 
    }, 
    async (payload) => {
      console.log('New ticket detected:', payload.new);
      
      // Kirim WhatsApp notification
      await sendTicketNotificationToHelpdesk(payload.new);
    }
  )
  .subscribe();
*/


-- ================================================
-- TROUBLESHOOTING
-- ================================================

/*
MASALAH: WhatsApp tidak terkirim
SOLUSI:
1. Cek status WhatsApp: GET /api/v1/notifications/whatsapp/status
2. Scan QR code jika belum connected
3. Pastikan phone_number di users table valid (format: 6281234567890)

MASALAH: Notifikasi tidak masuk ke database
SOLUSI:
1. Cek apakah trigger sudah dibuat: SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_helpdesk_on_new_ticket';
2. Cek apakah ada helpdesk users: SELECT * FROM users WHERE role IN ('helpdesk', 'admin') AND is_active = TRUE;
3. Cek logs di terminal backend

MASALAH: QR Code tidak muncul
SOLUSI:
1. Restart server: npm run dev
2. Hapus folder auth_info_baileys dan scan ulang
3. Cek logs di terminal

MASALAH: Database error foreign key
SOLUSI:
1. Pastikan tabel tickets dan users sudah ada sebelum create notifications table
2. Pastikan kolom id di tickets dan users adalah PRIMARY KEY
*/

-- ================================================
-- END OF SQL SCRIPT
-- ================================================
