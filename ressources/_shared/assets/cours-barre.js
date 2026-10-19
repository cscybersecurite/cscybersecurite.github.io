/* Commande commune du mode présentation, sans altérer les exercices. */
(()=>{
  const mode=document.querySelector('#cours-mode-presentation');
  if(!mode)return;
  const update=active=>{
    document.documentElement.classList.toggle('cours-presentation',active);
    mode.setAttribute('aria-pressed',String(active));
    const label=active?'Quitter la présentation':'Mode présentation';
    mode.setAttribute('aria-label',label);
    mode.title=label;
  };
  mode.addEventListener('click',()=>update(!document.documentElement.classList.contains('cours-presentation')));
  update(false);
})();
