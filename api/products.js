import {adminDb,publicDb,json,method} from './_lib/supabase.js';
export default async function handler(req,res){
 if(!method(req,res,['GET','POST','PATCH','DELETE']))return;
 try{
  if(req.method==='GET'){
   const db=publicDb();const slug=typeof req.query?.slug==='string'?req.query.slug:null;
   if(slug){const {data,error}=await db.from('products').select('id,name,slug,description,short_description,price_php,image_url').eq('slug',slug).eq('published',true).maybeSingle();if(error)throw error;return json(res,data?200:404,data?{product:data}:{error:'Product not found'})}
   const {data,error}=await db.from('products').select('id,name,slug,description,short_description,price_php,image_url').eq('published',true).order('created_at',{ascending:false});if(error)throw error;return json(res,200,{products:data||[]});
  }
  // Admin product mutations require a verified Supabase Auth bearer token.
  const {requireAdmin}=await import('./_lib/supabase.js');const auth=await requireAdmin(req);if(auth.error)return json(res,auth.status,{error:auth.error});
  if(req.method==='POST'||req.method==='PATCH'){
   const b=req.body||{};const name=String(b.name||'').trim().slice(0,140);const slug=String(b.slug||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,140);const price=Number(b.price_php);
   if(!name||!slug||!Number.isFinite(price)||price<0||price>5000000)return json(res,400,{error:'Valid name, slug, and price are required.'});
   const row={name,slug,price_php:Math.round(price*100)/100,description:String(b.description||'').slice(0,10000),short_description:String(b.short_description||'').slice(0,300),image_url:b.image_url?String(b.image_url).slice(0,1000):null,published:!!b.published,updated_at:new Date().toISOString()};
   const query=req.method==='POST'?auth.db.from('products').insert(row).select().single():auth.db.from('products').update(row).eq('id',b.id).select().single();const {data,error}=await query;if(error)throw error;return json(res,200,{product:data});
  }
  const id=String(req.body?.id||'');if(!id)return json(res,400,{error:'Product id required'});const {error}=await auth.db.from('products').update({published:false,archived:true,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;return json(res,200,{ok:true});
 }catch(e){console.error('products API error',e);return json(res,500,{error:'Request could not be completed.'})}
}
