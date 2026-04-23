const SUPABASE_URL = 'https://xxrgxklwahmanxlgioxk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cmd4a2x3YWhtYW54bGdpb3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTE2OTEsImV4cCI6MjA5MTg4NzY5MX0.unV6eUzgQjrrP2oZRllSiSGb7wsxoSJVdG94G6iZUFw';
const PHONE_ID   = '898637856663488';
const WA_TOKEN   = 'EAALfHzPBOzgBQDZCDOv4851nz5XxULTFi6fZAfgY3q8uHgx87jWmgZAs1HjrGv602alwAzoqXytQ4JArFZBcWiLblg5rqxtB4ZCKf093ZCDymBEMt6WaOw7xMnu57YXGL8WVzWAVmdjIhdgC4gy0sI3Uz9NlED942ZCayau3gFdTJ1vYCwkyujkYKDPUvlRHZBHQawZDZD';

async function getPendingLeads() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?whatsapp_sent=eq.false&pdf_url=not.is.null&select=id,name,whatsapp,pdf_url`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  return res.json();
}

async function markSent(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ whatsapp_sent: true })
  });
}

async function sendWhatsApp(lead) {
  const phone     = '55' + lead.whatsapp.replace(/\D/g, '');
  const firstName = lead.name.trim().split(' ')[0];

  const res = await fetch(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: 'diagnostico',
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'header',
            parameters: [{
              type: 'document',
              document: { link: lead.pdf_url, filename: 'Diagnostico_Longevidade.pdf' }
            }]
          },
          {
            type: 'body',
            parameters: [{ type: 'text', text: firstName }]
          }
        ]
      }
    })
  });

  const json = await res.json();
  return !!json.messages;
}

export default async function handler(req, res) {
  // Vercel injeta Authorization: Bearer <CRON_SECRET> nas chamadas de cron
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const leads = await getPendingLeads();

  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(200).json({ sent: 0, message: 'Nenhum lead pendente.' });
  }

  const results = [];
  for (const lead of leads) {
    try {
      const ok = await sendWhatsApp(lead);
      if (ok) await markSent(lead.id);
      results.push({ name: lead.name, ok });
    } catch (e) {
      results.push({ name: lead.name, ok: false, error: e.message });
    }
    // 300ms entre envios para não saturar a API
    await new Promise(r => setTimeout(r, 300));
  }

  const sent = results.filter(r => r.ok).length;
  console.log(`[send-pending] ${sent}/${leads.length} enviados`, results);
  return res.status(200).json({ sent, total: leads.length, results });
}
