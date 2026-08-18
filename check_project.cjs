const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function main() {
    const { data: projects } = await supabase.from('projects').select('*').eq('id', '4374255d-4343-57d0-b641-f85a66839e37');
    console.log(projects);
}
main();
