const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function main() {
    const { data: projects } = await supabase.from('projects').select('id, title');
    projects.filter(p => p.title.toLowerCase().includes('king')).forEach(p => console.log(p.id, p.title));
}
main();
