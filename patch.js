/* patch.js - Biashara Rahisi
   Marekebisho: reset password, onyesha/ficha nenosiri, msimamizi kufuta akaunti, badilisha nenosiri.
   Inapakiwa baada ya script kuu ya index.html. */
(function(){
const nav=((performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{}).name||location.href;
const recLoad=/type=recovery/.test(nav)||/type=recovery/.test(location.hash);
const linkErr=/error_code=|error=access_denied/.test(location.hash);
const FLAG='pw_rec';
const setFlag=v=>{try{v?sessionStorage.setItem(FLAG,'1'):sessionStorage.removeItem(FLAG)}catch(_){}};
const hasFlag=()=>{try{return sessionStorage.getItem(FLAG)==='1'}catch(_){return false}};

/* ---------- onyesha / ficha nenosiri ---------- */
const st=document.createElement('style');
st.textContent='.pw{position:relative}.pw input{padding-right:52px}.pw .eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:auto;margin:0;padding:6px 10px;background:transparent;color:#6b7280;border:0;font-size:1.1rem}';
document.head.appendChild(st);
function eye(el){
  if(!el||el.parentElement.classList.contains('pw'))return;
  const w=document.createElement('div');w.className='pw';
  el.parentNode.insertBefore(w,el);w.appendChild(el);
  const b=document.createElement('button');b.type='button';b.className='eye';b.textContent='👁';
  b.setAttribute('aria-label','Onyesha au ficha nenosiri');
  b.onclick=()=>{const s=el.type==='password';el.type=s?'text':'password';b.textContent=s?'🙈':'👁'};
  w.appendChild(b);
}

/* ---------- kuingia ---------- */
const _lv=loginView;
loginView=function(){_lv();const p=G('pw');if(p){p.removeAttribute('minlength');eye(p)}};

/* ---------- usiingie dashibodi wakati wa kuweka nenosiri jipya ---------- */
const _ad=admin;
admin=function(){if(recovering)return;return _ad.apply(this,arguments)};

/* ---------- fomu ya nenosiri jipya ---------- */
recoveryView=function(){
  recovering=true;setFlag(true);
  app.innerHTML='<div class="card"><h2>Weka nenosiri jipya</h2><div class="mut">Andika nenosiri jipya la akaunti yako (angalau herufi 8).</div>'
   +'<form id="rf"><label>Nenosiri jipya</label><input id="np1" type="password" minlength="8" required autocomplete="new-password">'
   +'<button class="pri">Hifadhi nenosiri</button><button type="button" class="ghost" id="rcancel">Ghairi</button></form><div id="rm"></div></div>';
  eye(G('np1'));
  G('rcancel').onclick=async()=>{setFlag(false);recovering=false;await sb.auth.signOut();location.href=location.pathname};
  G('rf').onsubmit=async e=>{
    e.preventDefault();
    const {error}=await sb.auth.updateUser({password:G('np1').value});
    if(error){G('rm').innerHTML='<div class="msg err">'+esc(error.message)+'</div>';return}
    setFlag(false);recovering=false;
    history.replaceState(null,'',location.pathname+'#admin');admin();
  };
};

/* ---------- ukurasa usijipakie upya wakati tokeni inafutwa kwenye anwani ---------- */
window.addEventListener('hashchange',e=>{
  if(recovering||(recLoad&&location.hash===''))e.stopImmediatePropagation();
},true);

/* ---------- anza: kiungo cha reset, au kiungo kilichoisha muda ---------- */
if(linkErr){
  recovering=true;
  history.replaceState(null,'',location.pathname+'#admin');
  loginView();
  G('lm').innerHTML='<div class="msg err">Kiungo cha kubadilisha nenosiri kimeisha muda au kimeshatumika. Bonyeza "Umesahau nenosiri?" upate kipya.</div>';
  setTimeout(()=>{recovering=false},800);
}else if(recLoad||hasFlag()){
  recovering=true;setFlag(true);
  sb.auth.getSession().then(({data:{session}})=>{
    if(session){recoveryView();return}
    setFlag(false);recovering=false;
    if(recLoad){loginView();G('lm').innerHTML='<div class="msg err">Kiungo hakikufanya kazi. Omba kipya hapa chini.</div>'}
  });
}
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT')setFlag(false)});

/* ---------- msimamizi: biashara zote + kufuta akaunti ---------- */
platformView=async function(){
  V().innerHTML='<div id="pl">Inapakia...</div>';
  const [a,b]=await Promise.all([sb.rpc('platform_list'),sb.rpc('platform_orphans')]);
  const el=G('pl');if(!el)return;
  if(a.error){el.innerHTML='<div class="msg err">'+esc(a.error.message)+'</div>';return}
  const biz=a.data||[],orp=(b&&b.data)||[],d=s=>s?fmtTime(s):'—';
  el.innerHTML='<div class="mut">Biashara '+biz.length+'. Zenye ⏳ zinasubiri idhini yako. Sehemu hii inaonekana kwako msimamizi pekee.</div>'
  +biz.map(x=>'<div class="card"><div class="top"><b>'+esc(x.name)+'</b><span class="badge '+(x.active?'paid':'')+'">'+(x.active?'Hai':'⏳ Inasubiri / Imesimamishwa')+'</span></div>'
   +'<div class="mut">'+esc(x.owner||'-')+' · oda '+esc(x.orders)+'<br>Alijisajili: '+d(x.created_at)+' · Aliingia mwisho: '+d(x.last_sign_in)+'<br>Link: ?b='+esc(x.slug)+'</div>'
   +'<button class="sm '+(x.active?'danger':'ok2')+'" data-a="pact" data-id="'+x.id+'" data-v="'+x.active+'">'+(x.active?'Simamisha':'Idhinisha')+'</button>'
   +(x.is_admin?'<span class="mut">(akaunti yako ya msimamizi)</span>':'<button class="sm danger" data-x="pdel" data-id="'+x.id+'" data-n="'+esc(x.name)+'" data-o="'+esc(x.orders)+'">🗑 Futa akaunti kabisa</button>')
   +'</div>').join('')
  +'<div class="card"><h3>Akaunti zisizo na biashara ('+orp.length+')</h3><div class="mut">Waliojisajili lakini hawajatengeneza biashara.</div>'
  +(orp.map(u=>'<div class="row"><span>'+esc(u.email)+'<br><small class="mut">'+(u.confirmed?'Email imethibitishwa':'Email haijathibitishwa')+' · '+d(u.created_at)+'</small></span><button class="sm danger" data-x="pudel" data-id="'+u.id+'" data-n="'+esc(u.email)+'">🗑</button></div>').join('')||'<div class="mut">Hakuna.</div>')
  +'</div>';
};

/* ---------- mipangilio: badilisha nenosiri ---------- */
const _ls=loadSettings;
loadSettings=async function(){
  await _ls();
  if(!G('pwcard')&&V()){
    const c=document.createElement('div');c.className='card';c.id='pwcard';
    c.innerHTML='<h3>Badilisha nenosiri</h3><label>Nenosiri jipya (angalau herufi 8)</label><input id="npw" type="password" minlength="8" autocomplete="new-password"><button class="pri" data-x="pwsave">Hifadhi nenosiri</button>';
    V().appendChild(c);eye(G('npw'));
  }
};

/* ---------- vitendo vipya ---------- */
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-x]');if(!b)return;
  const x=b.dataset.x,id=b.dataset.id;
  if(x==='pdel'){
    const t='Utafuta KABISA akaunti ya "'+b.dataset.n+'": biashara, oda '+b.dataset.o+', bidhaa, gharama na akaunti ya kuingia. Haitarudi. Andika FUTA kuthibitisha:';
    if(prompt(t)!=='FUTA')return;
    b.disabled=true;
    const {data,error}=await sb.rpc('platform_delete_account',{p_business_id:id});
    if(error){b.disabled=false;return alert(error.message)}
    alert('Imefutwa: '+data.name+' (oda '+data.orders+').');platformView();
  }else if(x==='pudel'){
    if(!confirm('Futa akaunti '+b.dataset.n+'?'))return;
    const {error}=await sb.rpc('platform_delete_user',{p_user_id:id});
    if(error)return alert(error.message);platformView();
  }else if(x==='pwsave'){
    const p=G('npw').value;
    if(p.length<8)return alert('Nenosiri liwe angalau herufi 8.');
    const {error}=await sb.auth.updateUser({password:p});
    if(error)return alert(error.message);
    G('npw').value='';alert('Nenosiri limebadilishwa ✓');
  }
});
})();
