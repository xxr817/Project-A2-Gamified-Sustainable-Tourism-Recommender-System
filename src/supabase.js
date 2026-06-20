import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oisejxasfycdkafckpfe.supabase.co'
const supabaseAnonKey = 'sb_publishable_c7JJ0bUk8HAKI0YGRSnUDg_zLAqcOBL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (_name, _timeout, fn) => fn(),
  },
})
