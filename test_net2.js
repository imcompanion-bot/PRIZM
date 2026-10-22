import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Zmd5ZnV2bGlnYWNqd3hqbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxNjY4MjcsImV4cCI6MjAyMjI0MjgyN30.xxx'); 
// wait I don't have the anon key. 
