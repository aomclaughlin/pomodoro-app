// Vercel Edge Function: /api/pomodoro-email
export const config = { runtime: 'edge' };

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  try {
    const { to, subject, text, metadata } = await req.json();

    // Use Resend (recommended) — add RESEND_API_KEY in Vercel → Project → Settings → Environment Variables
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return new Response('Missing RESEND_API_KEY', { status: 500, headers: corsHeaders() });

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pomodoro <noreply@your-domain.com>', // set up a verified domain/sender in Resend
        to: [to],
        subject: subject || 'Pomodoro complete',
        text: text || 'Pomodoro complete.',
        headers: { 'X-Pomodoro-Metadata': JSON.stringify(metadata || {}) }
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return new Response(`Email failed: ${body}`, { status: 500, headers: corsHeaders() });
    }

    return new Response('OK', { status: 200, headers: corsHeaders() });
  } catch (e) {
    return new Response('Bad Request', { status: 400, headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
