import supabase from "../config/supabase.js";
import { sendTicketNotificationToHelpdesk } from "../controllers/notificationController.js";

/**
 * Setup listener for new tickets
 * Listens to INSERT events on 'tickets' table via Supabase Realtime
 */
export const setupTicketListener = () => {
  console.log("🎧 Setting up Realtime listener for new tickets...");

  const channel = supabase
    .channel('public:tickets')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tickets' },
      async (payload) => {
        console.log('🎫 New ticket detected via Realtime!');
        console.log('🎫 Ticket ID:', payload.new.id);
        console.log('🎫 Ticket Number:', payload.new.ticket_number);
        console.log('🎫 Full payload:', JSON.stringify(payload.new, null, 2));
        
        try {
          const ticketData = payload.new;
          
          // Send notification to reporter
          const result = await sendTicketNotificationToHelpdesk(ticketData);
          
          console.log('✅ Automatic notification result:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('❌ Error processing new ticket notification:', error);
          console.error('❌ Error stack:', error.stack);
        }
      }
    )
    .subscribe((status, error) => {
      console.log('📡 Subscription status:', status);
      if (error) {
        console.error('❌ Subscription error:', error);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to tickets table changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Failed to subscribe to tickets table changes');
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Subscription timed out');
      } else if (status === 'CLOSED') {
        console.warn('⚠️ Channel closed');
      }
    });
};
