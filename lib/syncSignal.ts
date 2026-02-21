import { supabase } from '@/lib/supabase';

export async function emitirSyncSignal(
    motivo: string
) {
    await supabase
        .from('sync_signal')
        .update({
            updated_at: new Date().toISOString(),
            motivo
        })
        .eq('id', 1);
}
