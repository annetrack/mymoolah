import {json,method,requireAdmin,sendBrevo,cleanString} from '../_lib/supabase.js';
const statuses=['Pending payment','Under review','Paid','Rejected','Cancelled'];
export default async function handler(req,res){
 if(!method(req,res,['GET','PATCH']))return;
 try{const auth=await requireAdmin(req);if(auth.error)return json(res,auth.status,{error:auth.error});const db=auth.db;
 if(req.method==='GET'){const {data,error}=await db.from('orders').select('id,reference,customer_name,customer_email,amount_php,payment_method,status,kind,created_at,transaction_reference').order('created_at',{ascending:false}).limit(500);if(error)throw error;return json(res,200,{orders:data||[]})}
 const b=req.body||{};const id=cleanString(b.id,100);const status=cleanString(b.status,40);const note=cleanString(b.note,1000);if(!id||!statuses.includes(status))return json(res,400,{error:'Order id and valid status are required.'});
 const {data:order,error:fetchError}=await db.from('orders').select('*').eq('id',id).single();if(fetchError||!order)return json(res,404,{error:'Order not found.'});
 const {error}=await db.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
 const {error:histError}=await db.from('order_status_history').insert({order_id:id,previous_status:order.status,new_status:status,changed_by:auth.user.id,note:note||null});if(histError)throw histError;
 if(status==='Paid'&&order.status!=='Paid')await sendBrevo({toEmail:order.customer_email,toName:order.customer_name,subject:`Payment confirmed for ${order.reference}`,htmlContent:`<p>Hi ${order.customer_name.replace(/[&<>"]/g,'')},</p><p>Your payment for order <strong>${order.reference}</strong> has been confirmed.</p><p>Thank you,<br>Digitally Anne</p>`});
 if(status==='Rejected')await sendBrevo({toEmail:order.customer_email,toName:order.customer_name,subject:`Action needed for order ${order.reference}`,htmlContent:`<p>Hi ${order.customer_name.replace(/[&<>"]/g,'')},</p><p>We need to review the payment details for order <strong>${order.reference}</strong>. Please contact Digitally Anne and include your order reference.</p>`});
 return json(res,200,{ok:true,status});
 }catch(e){console.error('admin orders API error',e);return json(res,500,{error:'Could not update order.'})}
}
