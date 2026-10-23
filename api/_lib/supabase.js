import { createClient } from '@supabase/supabase-js';
export function adminDb() {
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Supabase server environment variables are missing.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function publicDb() {
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_ANON_KEY;
  if(!url||!key) throw new Error('Supabase public environment variables are missing.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function json(res,status,body){res.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(body));}
export function method(req,res,allowed){if(!allowed.includes(req.method)){res.setHeader('Allow',allowed.join(', '));json(res,405,{error:'Method not allowed'});return false}return true}
export function cleanString(v,max=200){return typeof v==='string'?v.trim().slice(0,max):''}
export function isAdminEmail(email){const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);return !!email&&allowed.includes(email.toLowerCase())}
export async function requireAdmin(req){const header=req.headers.authorization||'';const token=header.startsWith('Bearer ')?header.slice(7):'';if(!token)return {error:'Sign in required',status:401};const db=adminDb();const {data,error}=await db.auth.getUser(token);if(error||!data?.user)return {error:'Invalid session',status:401};if(!isAdminEmail(data.user.email))return {error:'Admin access denied',status:403};return {user:data.user,db}}
export async function sendBrevo({toEmail,toName,subject,htmlContent}) {
  if(!process.env.BREVO_API_KEY||!process.env.BREVO_SENDER_EMAIL)return;
  const r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'accept':'application/json','api-key':process.env.BREVO_API_KEY,'content-type':'application/json'},body:JSON.stringify({sender:{name:process.env.BREVO_SENDER_NAME||'Digitally Anne',email:process.env.BREVO_SENDER_EMAIL},to:[{email:toEmail,name:toName||toEmail}],subject,htmlContent})});
  if(!r.ok){const detail=await r.text();console.error('Brevo send failed',r.status,detail.slice(0,500));}
}
