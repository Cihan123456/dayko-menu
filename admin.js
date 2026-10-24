(() => {
'use strict';
const cfg=window.DAYKO_FIREBASE_CONFIG;const items=window.DAYKO_DATA.items;
const by=id=>document.getElementById(id);const message=by('message');
function notice(t){message.hidden=!t;message.textContent=t}
function view(section){for(const s of ['setup','login','editor'])by(s).hidden=s!==section}
if(!cfg?.apiKey||!cfg?.projectId||!cfg?.authDomain||cfg.apiKey.includes('YOUR_')){view('setup');return}
(async()=>{try{
 const [fa,authmod,fs]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
 ]);
 const app=fa.initializeApp(cfg),auth=authmod.getAuth(app),db=fs.getFirestore(app);
 const docRef=fs.doc(db,'menus','dayko');let latest={};
 by('login-form').addEventListener('submit',async ev=>{ev.preventDefault();const button=by('login-submit');button.disabled=true;notice('Giriş yapılıyor…');try{await authmod.signInWithEmailAndPassword(auth,by('email').value.trim(),by('password').value);notice('')}catch(e){notice('Giriş başarısız. E-posta ve şifreyi kontrol edin.')}finally{button.disabled=false}});
 by('logout').addEventListener('click',async()=>{await authmod.signOut(auth)});
 authmod.onAuthStateChanged(auth,async user=>{
  if(!user){view('login');notice('');return}
  view('editor');notice('Fiyatlar sunucudan alınıyor…');
  try{const snapshot=await fs.getDocFromServer(docRef);latest=snapshot.exists()?snapshot.data()?.prices||{}:{};
   if(!snapshot.exists())notice('İlk kurulum: Başlangıç fiyatları gösteriliyor. Kaydet ile Firestore’a yayınlayabilirsiniz.');else notice('');
   const container=by('fields');container.textContent='';let group=null;
   for(const item of items){if(group!==item.page){group=item.page;const h=document.createElement('h2');h.className='group';h.textContent=window.DAYKO_DATA.pages[group-1];container.append(h)}
    const row=document.createElement('div');row.className='item';const label=document.createElement('label');label.textContent=item.name;label.htmlFor=`price-${item.key}`;
    const box=document.createElement('div');box.className='entry';const inp=document.createElement('input');inp.id=`price-${item.key}`;inp.dataset.key=item.key;inp.type='number';inp.min='1';inp.max='9999';inp.step='1';inp.inputMode='numeric';inp.required=true;inp.value=Number.isInteger(latest[item.key])?latest[item.key]:item.price;
    const tl=document.createElement('span');tl.textContent='TL';box.append(inp,tl);row.append(label,box);container.append(row)}
  }catch(e){console.error(e);notice('Fiyatlar sunucudan okunamadı. Kaydetme kapalı.');by('save').disabled=true}
 });
 by('price-form').addEventListener('submit',async ev=>{
  ev.preventDefault();const prices={};let valid=true;
  for(const input of by('fields').querySelectorAll('input')){const val=Number(input.value);if(!Number.isInteger(val)||val<1||val>9999){valid=false;input.focus();break}prices[input.dataset.key]=val}
  if(!valid||Object.keys(prices).length!==items.length){notice('Lütfen bütün fiyatları 1–9999 arasında tam sayı olarak girin.');return}
  const save=by('save');save.disabled=true;notice('Değişiklikler kaydediliyor…');
  try{await fs.setDoc(docRef,{prices,updatedAt:fs.serverTimestamp()});notice('Fiyatlar kaydedildi. Müşteri menüsünde güncellenecek.')}catch(e){console.error(e);notice('Kayıt başarısız. Yetki veya internet bağlantısını kontrol edin.')}finally{save.disabled=false}
 });
}catch(e){console.error(e);view('setup');notice('Firebase dosyaları yüklenemedi. İnternet bağlantınızı kontrol edin.')}})();
})();
