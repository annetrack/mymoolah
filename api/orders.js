import {adminDb,json,method,cleanString,sendBrevo} from './_lib/supabase.js';
function orderRef(){return 'DA-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase()}
export default async function handler(req,res){
 if(!method(req,res,['POST']))return;
 try{
  const b=req.body||{};const name=cleanString(b.name,120);const email=cleanString(b.email,254).toLowerCase();const phone=cleanString(b.phone,40);const paymentMethod=cleanString(b.paymentMethod,20).toLowerCase();const kind=b.kind;
  if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'Enter a valid name and email.'});
  if(!['gcash','gotyme','bpi','paypal'].includes(paymentMethod))return json(res,400,{error:'Choose a supported payment method.'});
  if(paymentMethod==='paypal'&&!cleanString(b.transactionReference,120))return json(res,400,{error:'Enter the PayPal transaction reference after paying.'});
  const db=adminDb();let total;let product=null;let quantity=1;let donation=false;
  if(kind==='donation'){total=Number(b.amount);donation=true;if(!Number.isFinite(total)||total<1||total>500000||Math.round(total*100)!==total*100)return json(res,400,{error:'Enter a valid donation amount.'})}
  else if(kind==='product'){quantity=Math.max(1,Math.min(20,Math.floor(Number(b.quantity)||1)));const productId=cleanString(b.productId,100);if(!productId)return json(res,400,{error:'Product is required.'});const {data,error}=await db.from('products').select('id,name,slug,price_php,published,archived').eq('id',productId).eq('published',true).eq('archived',false).single();if(error||!data)return json(res,400,{error:'This product is not available.'});product=data;total=Number(data.price_php)*quantity}
  else return json(res,400,{error:'Invalid order type.'});
  if(!Number.isFinite(total)||total<=0||total>5000000)return json(res,400,{error:'Invalid order total.'});
  const reference=orderRef();const status='Under review';
  const row={reference,customer_name:name,customer_email:email,customer_phone:phone||null,kind:donation?'donation':'product',amount_php:Math.round(total*100)/100,payment_method:paymentMethod,transaction_reference:cleanString(b.transactionReference,120)||null,status};
  const {data:order,error}=await db.from('orders').insert(row).select('id,reference,amount_php,payment_method,status,customer_email,customer_name,kind').single();if(error)throw error;
  if(product){const {error:lineError}=await db.from('order_items').insert({order_id:order.id,product_id:product.id,product_name:product.name,product_slug:product.slug,unit_price_php:product.price_php,quantity,line_total_php:Math.round(total*100)/100});if(lineError)throw lineError}
  await db.from('order_status_history').insert({order_id:order.id,new_status:status,changed_by:null,note:'Order submitted by customer.'});
  await sendBrevo({toEmail:email,toName:name,subject:`We received your order ${reference}`,htmlContent:`<p>Hi ${name.replace(/[&<>"]/g,'')},</p><p>We received your order <strong>${reference}</strong> for <strong>₱${Number(total).toFixed(2)}</strong>.</p><p>Status: Under review. Your payment is not confirmed until it has been manually verified.</p><p>Thank you,<br>Digitally Anne</p>`});
  return json(res,201,{order:{id:order.id,reference:order.reference,amount:order.amount_php,paymentMethod:order.payment_method,status:order.status}});
 }catch(e){console.error('orders API error',e);return json(res,500,{error:'Could not create order. Please try again.'})}
}
