// Configuração do Supabase Client
const SUPABASE_URL = 'https://cmkjlgnputqqvdwnhljk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3_hB0Z5S-_fRNC9A2CSMbQ_y4XYe31s';

// Verifica se a biblioteca foi carregada
if (typeof supabase === 'undefined') {
    console.error('Supabase client library not loaded. Please ensure the CDN script is included.');
} else {
    // Inicializa o cliente do Supabase
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully.');
}