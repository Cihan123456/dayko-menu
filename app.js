/* DAYKO: layer-accurate pricing, static preview plus authenticated Firestore live prices. */
(() => {
'use strict';
const DATA=window.DAYKO_DATA;
const menu=document.getElementById('menu');
const status=document.getElementById('net-status');
const config=window.DAYKO_FIREBASE_CONFIG;
const defaults=Object.fromEntries(DATA.items.map(x=>[x.key,x.price]));
const url={phone:'tel:+905540053500',instagram:'https://www.instagram.com/daykobufe/',map:'https://maps.google.com/maps?q=38.3815185%2C27.1703165&z=17&hl=tr',reviews:'https://search.google.com/local/reviews?placeid=ChIJSRyt0PTfuxQR5X49Du_aac0'};
const glyphs={};
const getAsset = path => window.DAYKO_ASSET_MAP?.[path] || `assets/${path}`;
function notice(msg){status.textContent=msg;status.hidden=!msg}
const rect=(x,y,w,h)=>`left:${(x*100).toFixed(5)}%;top:${(y*100).toFixed(5)}%;width:${(w*100).toFixed(5)}%;height:${(h*100).toFixed(5)}%;`;
function touch(art,href,label,box){const a=document.createElement('a');a.className='touch';a.href=href;a.title=label;a.setAttribute('aria-label',label);a.style.cssText=rect(...box);if(href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer'}art.append(a);return a}
const refs=new Map();
for(let p=1;p<=7;p++){
 const sec=document.createElement('section');sec.className='page';sec.setAttribute('aria-label',`Sayfa ${p}: ${DATA.pages[p-1]}`);sec.dataset.page=p;
 const bg=document.createElement('div');bg.className='page-bg';sec.append(bg);
 const art=document.createElement('div');art.className='art';art.setAttribute('role','group');art.setAttribute('aria-label',DATA.pages[p-1]);
 const bgImg=document.createElement('img');bgImg.className='art-img';bgImg.alt=DATA.pages[p-1];bgImg.dataset.src=getAsset(`page-${p}.webp`);if(p===1){bgImg.src=bgImg.dataset.src;bgImg.fetchPriority='high'}else{bgImg.loading='lazy'}art.append(bgImg);
 for(const item of DATA.items.filter(x=>x.page===p)){
  const img=document.createElement('img');img.className='original-price';img.src=getAsset(`prices/${item.key}.png`);
  img.alt=`${item.price} TL`;img.style.cssText=rect(...item.image);img.setAttribute('aria-label',`${item.name}: ${item.price} TL`);
  const canvas=document.createElement('canvas');canvas.className='price-changed';canvas.style.cssText=`left:${item.anchor[0]*100}%;top:${item.anchor[1]*100}%;width:${item.brush[2]*100}%;height:${item.brush[3]*100}%;`;canvas.hidden=true;
  const message=document.createElement('span');message.className='price-loading';message.textContent='—';message.style.cssText=`left:${item.anchor[0]*100}%;top:${item.anchor[1]*100}%;`;message.hidden=true;
  art.append(img,canvas,message);refs.set(item.key,{item,img,canvas,message});
 }
 if(p===1){const a=touch(art,'#menu-page-2','Menüyü aç',[.21,.85,.59,.11]);a.addEventListener('click',e=>{e.preventDefault();document.getElementById('menu-page-2').scrollIntoView({behavior:'smooth',block:'start'})})}
 if(p===7){touch(art,url.phone,'0554 005 35 00 numarasını ara',[.047,.274,.56,.099]);touch(art,url.map,'DAYKO konumunu Google Haritalar’da aç',[.048,.381,.57,.108]);touch(art,url.reviews,'DAYKO Google yorumlarını aç',[.046,.501,.57,.104]);touch(art,url.instagram,'DAYKO Instagram sayfasını aç',[.635,.273,.313,.32]);}
 sec.append(art);sec.id=`menu-page-${p}`;menu.append(sec);
}
// Nearest-next page preload; avoids loading 7 original images simultaneously.
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;const i=Number(e.target.dataset.page);for(let j=i;j<=Math.min(7,i+1);j++){const section=document.getElementById(`menu-page-${j}`);if(!section)continue;const im=section.querySelector('.art-img');if(!im.src)im.src=im.dataset.src;section.style.setProperty('--blur-image',`url("${im.dataset.src}")`)}}},{root:menu,rootMargin:'80% 0px',threshold:.01});
menu.querySelectorAll('.page').forEach(x=>observer.observe(x));

function showUnavailable(message){for(const obj of refs.values()){obj.img.hidden=true;obj.canvas.hidden=true;obj.message.hidden=false}notice(message)}
function showData(prices){
 for(const [key,o] of refs){const val=prices[key];if(!Number.isInteger(val)||val<1||val>9999){o.img.hidden=true;o.canvas.hidden=true;o.message.hidden=false;continue}o.message.hidden=true;
  o.img.alt=`${val} TL`;o.img.setAttribute('aria-label',`${o.item.name}: ${val} TL`);
  if(val===o.item.price){o.img.hidden=false;o.canvas.hidden=true}else{o.img.hidden=true;o.canvas.hidden=false;drawChanged(o,val)}
 }
}
function loadGlyph(char){if(glyphs[char])return glyphs[char];const img=new Image();img.src=getAsset(`glyphs/${char}.png`);glyphs[char]=img;return img}
async function ensureGlyphs(){await Promise.all([...'0123456789','TL'].map(x=>new Promise(res=>{const g=loadGlyph(x);if(g.complete){res();return}g.onload=res;g.onerror=res})))}
let glyphReady=ensureGlyphs();
async function drawChanged(obj,amount){await glyphReady;const {item,canvas}=obj;const brushW=item.brush[2]*941,brushH=item.brush[3]*1672;
 const factor=2;canvas.width=Math.max(1,Math.round(brushW*factor));canvas.height=Math.max(1,Math.round(brushH*factor));const ctx=canvas.getContext('2d');ctx.scale(factor,factor);ctx.clearRect(0,0,brushW,brushH);
 const digitHeight=Math.min(item.original_height*.87,brushH*.76);const tlHeight=digitHeight*.72;
 let chars=String(amount).split('').map(ch=>({img:loadGlyph(ch),h:digitHeight}));chars.push({img:loadGlyph('TL'),h:tlHeight});
 const gap=Math.max(.7,digitHeight*.035);const bigGap=digitHeight*.15;
 let widths=chars.map(o=>o.img.naturalWidth*Math.min(o.h/(o.img.naturalHeight||1),100));
 let total=widths.reduce((x,y)=>x+y,0)+gap*(chars.length-2)+bigGap;
 const maxW=brushW*.82;let scale=Math.min(1,maxW/total);total*=scale;
 let xx=(brushW-total)/2;
 for(let i=0;i<chars.length;i++){const c=chars[i],ww=widths[i]*scale,hh=c.h*scale,base=brushH*.50;const yy=base-hh*.49+(i===chars.length-1?hh*.12:0);if(c.img.complete && c.img.naturalWidth)ctx.drawImage(c.img,xx,yy,ww,hh);xx+=ww+((i===chars.length-2?bigGap:gap)*scale)}
}
function hasConfig(){return Boolean(config?.apiKey && config?.projectId && config?.authDomain && !config.apiKey.includes('YOUR_'))}
if(!hasConfig()){
 // Preview mode: initial raster text is an exact copy of the original menu art.
 showData(defaults);
 window.DAYKO_PREVIEW_TEST_PRICE = (key,number) => {if(!(key in defaults))return false;showData({...defaults,[key]:Number(number)});return true};
 console.info('DAYKO: Önizleme modu. Başlangıç fiyatları gösteriliyor; DAYKO_PREVIEW_TEST_PRICE ile yerel görüntü testi yapılabilir.');
}else{
 showUnavailable('Fiyatlar yükleniyor…');
 (async()=>{try{
  const [{initializeApp},{getFirestore,doc,onSnapshot}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')]);
  const app=initializeApp(config),db=getFirestore(app);
  onSnapshot(doc(db,'menus','dayko'),{includeMetadataChanges:true},snap=>{
   if(snap.metadata.fromCache){showUnavailable('Güncel fiyatlar doğrulanıyor…');return}
   const prices=snap.exists()?snap.data().prices:null;
   if(!prices){showUnavailable('Fiyatlar henüz yayınlanmadı.');return}
   showData(prices);notice('');
  },err=>{console.error('Fiyat okuma hatası:',err);showUnavailable('Güncel fiyatlara ulaşılamıyor.')});
 }catch(e){console.error(e);showUnavailable('Fiyat bağlantısı kurulamadı.')}})();
}
})();
