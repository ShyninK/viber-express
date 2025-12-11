import supabase from "../config/supabase.js";
import { sendTicketAssignedNotification } from "../controllers/notificationController.js";

/**
 * Setup listener for ticket assignment
 * Listens to UPDATE events on 'tickets' table when assigned_to changes
 */
export const setupTicketAssignmentListener = () => {
  console.log("🎧 Setting up Realtime listener for ticket assignments...");

  const channel = supabase
    .channel('public:tickets:assignments')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tickets' },
      async (payload) => {
        console.log('🔄 Ticket updated via Realtime:', payload.new.id);
        
        // Check if assigned_to field changed from null to a value
        const oldAssignedTo = payload.old?.assigned_to;
        const newAssignedTo = payload.new?.assigned_to;
        
        if (!oldAssignedTo && newAssignedTo) {
          console.log('👤 Ticket assigned to technician:', newAssignedTo);
          console.log('📧 Sending assignment notification...');
          
          try {
            const ticketData = payload.new;
            
            // Send notification to reporter
            const result = await sendTicketAssignedNotification(ticketData);
            
            console.log('✅ Assignment notification result:', JSON.stringify(result, null, 2));
          } catch (error) {
            console.error('❌ Error processing ticket assignment notification:', error);
            console.error('❌ Error stack:', error.stack);
          }
        } else {
          console.log('ℹ️ Ticket updated but not assigned (assigned_to was already set or still null)');
        }
      }
    )
    .subscribe((status, error) => {
      console.log('📡 Assignment subscription status:', status);
      if (error) {
        console.error('❌ Assignment subscription error:', error);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to ticket assignment changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Failed to subscribe to ticket assignment changes');
      }
    });
};
