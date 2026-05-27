import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if keys are present
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Keep our mock implementations for APIs
export const zoopApi = {
  verifyIdentity: async (data) => {
    console.log('Mocking Zoop API identity verification', data);
    return { success: true, message: 'Identity verified' };
  }
};

export const metaApi = {
  sendWhatsAppGroupLink: async (phoneNumber, link, workName) => {
    console.log(`Mocking Meta API: Sending WhatsApp link for ${workName} to ${phoneNumber}`);
    return { success: true };
  }
};
