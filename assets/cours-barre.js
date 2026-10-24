/* Projection ponctuelle des cours : inspirée du cours DHCP. */
(()=>{
 const chapters=[...document.querySelectorAll('main>details.chapter')];
 if(!chapters.length)return;
 const old=document.getElementById('cours-mode-presentation');
 if(old)old.remove();
 const button=document.createElement('button');
 button.type='button';button.id='cours-projection';button.className='cours-projection-float';
 button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Activer la projection');
 button.title='Activer la projection';
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4M8 21h8"/></svg><span>Projection</span>';
 document.body.append(button);
 button.addEventListener('click',()=>{
  const root=document.documentElement;
  const visibleContent=[...document.querySelectorAll('main>details.chapter[open] p,main>details.chapter[open] figure,main>details.chapter[open] table,main>details.chapter[open] li')];
  const anchor=visibleContent.find(el=>{const r=el.getBoundingClientRect();return r.bottom>90&&r.top<innerHeight-90})||chapters.find(c=>c.open)||null;
  const anchorTop=anchor?.getBoundingClientRect().top??0;
  const activating=!root.classList.contains('cours-presentation');
  if(activating&&!chapters.some(c=>c.open)){
    const closest=chapters.find(c=>c.getBoundingClientRect().bottom>100)||chapters[0];
    closest.open=true;
  }
  root.classList.toggle('cours-presentation',activating);
  button.setAttribute('aria-pressed',String(activating));
  button.setAttribute('aria-label',activating?'Quitter la projection':'Activer la projection');
  button.title=activating?'Quitter la projection':'Activer la projection';
  button.querySelector('span').textContent=activating?'Affichage normal':'Projection';
  requestAnimationFrame(()=>{
   if(anchor&&anchor.isConnected&&anchor.getClientRects().length){
    window.scrollBy(0,anchor.getBoundingClientRect().top-anchorTop);
   }
  });
 });
})();
