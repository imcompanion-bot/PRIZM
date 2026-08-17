const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function main() {
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    console.log('Project count:', count);
}
main();
