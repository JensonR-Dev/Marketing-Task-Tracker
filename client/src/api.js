// Backend selector:
//  - default              -> local Express + SQLite server (office version)
//  - VITE_BACKEND=supabase -> Supabase cloud (public GitHub Pages version)
import { api as restApi } from './api-rest.js'
import { api as supabaseApi } from './api-supabase.js'

export const api = import.meta.env.VITE_BACKEND === 'supabase' ? supabaseApi : restApi
