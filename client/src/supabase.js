import { createClient } from '@supabase/supabase-js'

// These two values are public by design — they identify the project;
// row-level security + the team login control the actual access.
const SUPABASE_URL = 'https://ekblhmgrlajgdrbxzxnx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_G0jDcAbTpPZeIiZubmRD0Q_i7D4jGAX'

// The shared team login (created in Supabase > Authentication > Users).
export const TEAM_EMAIL = 'team@manageartworks.com'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
