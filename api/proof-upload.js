import {adminDb,json,method,cleanString,requireAdmin,sendBrevo} from './_lib/supabase.js';
const allowedTypes=['image/jpeg','image/png','image/webp','application/pdf'];
export default async function handler(req,res){
 if(!method(req,res,['POST','PATCH']))return;
 try{
  const b=req.body||{};const orderId=cleanString(b.orderId,100);if(!orderId)return json(res,400,{error:'Order id required.'});
  const db=adminDb();const {data:order,error}=await db.from('orders').select('id,reference,status,customer_email,customer_name,created_at').eq('id',orderId).single();if(error||!order)return json(res,404,{error:'Order not found.'});
  if(req.method==='POST'){
   const mimeType=cleanString(b.mimeType,100);const size=Number(b.size);const fileName=cleanString(b.fileName,180);
   if(!allowedTypes.includes(mimeType))return json(res,400,{error:'Only JPG, PNG, WEBP, or PDF files are accepted.'});
   if(!Number.isFinite(size)||size<1||size>5*1024*1024)return json(res,400,{error:'File must be under 5 MB.'});
   // Guest uploads are allowed only against a recently-created order in this starter.
   const createdAt=new Date(order.created_at||Date.now()).getTime();if(Date.now()-createdAt>30*60*1000)return json(res,403,{error:'Upload window expired. Contact support with your order reference.'});
   const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'})[mimeType];const path=`${order.id}/${crypto.randomUUID()}.${ext}`;
   const {data,error:signError}=await db.storage.from('payment-proofs').createSignedUploadUrl(path,{upsert:false});if(signError)throw signError;
   return json(res,200,{signedUrl:signDataUrl(signError,data),storagePath:path});
  }
  const auth=await requireAdmin(req);if(auth.error)return json(res,auth.status,{error:auth.error});
  const storagePath=cleanString(b.storagePath,500);if(!storagePath.startsWith(order.id+'/'))return json(res,400,{error:'Invalid proof path.'});
  const {error}=await db.from('payment_submissions').insert({order_id:order.id,storage_path:storagePath,submitted_by_email:order.customer_email,notes:'Proof uploaded by customer.'});if(error)throw error;
  await db.from('orders').update({status:'Under review'}).eq('id',order.id);
  return json(res,200,{ok:true});
 }catch(e){console.error('proof upload API error',e);return json(res,500,{error:'Could not process proof upload.'})}
}
function signDataUrl(err,data){return data?.signedUrl||data?.signedURL||data?.url||''}
