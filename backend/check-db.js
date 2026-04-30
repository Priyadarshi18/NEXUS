import { supabase } from "./src/integrations/supabase/client";

async function check() {
    const { data, error } = await supabase.from('candidates').select('count');
    console.log("Candidate count:", data, error);
}
// This won't work easily because it's a frontend file with env vars.
