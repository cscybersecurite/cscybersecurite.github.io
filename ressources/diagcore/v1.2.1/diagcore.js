/* DiagCore 1.2.1 - extraction minimale du moteur DiagTree (C² D3-01/D3-02). */
(function(global){
  'use strict';
  function mount(container, nodes, options){
    if(options&&options.mode==='vertical')return mountVertical(container,nodes,options);
    const root=typeof container==='string'?document.querySelector(container):container;
    if(!root) throw new Error('DiagCore : conteneur introuvable');
    if(!nodes||typeof nodes!=='object'||!nodes.start) throw new Error('DiagCore : scénario sans nœud start');
    const opts=options||{}, labels=Object.assign({
      subtitle:'Démarche de diagnostic', back:'← Retour', home:'↥ Début du diagnostic',
      verify:'J’ai effectué cette vérification', continue:'Continuer',
      finish:'Terminer le diagnostic', invalid:'Étape de diagnostic introuvable'
    },opts.labels||{});
    const state={history:[], completed:false};
    root.classList.add('diagcore');
    if(opts.theme==='light'||opts.theme==='dark')root.dataset.diagcoreTheme=opts.theme;
    root.replaceChildren();
    const header=document.createElement('header');header.className='diagcore__head';
    const brand=document.createElement('b');brand.className='diagcore__brand';brand.textContent=opts.brand||'Diagnostic';
    const subtitle=document.createElement('span');subtitle.className='diagcore__subtitle';subtitle.textContent=opts.subtitle||labels.subtitle;
    header.append(brand,subtitle);
    const body=document.createElement('div');body.className='diagcore__body';
    const footer=document.createElement('footer');footer.className='diagcore__footer';
    const back=document.createElement('button');back.type='button';back.textContent=labels.back;
    const home=document.createElement('button');home.type='button';home.textContent=labels.home;
    footer.append(back,home);root.append(header,body,footer);
    function render(id,push=true){
      const node=nodes[id];
      if(!node){body.textContent=labels.invalid+' : '+id;return;}
      if(push&&state.history.at(-1)!==id)state.history.push(id);
      state.completed=false;
      back.disabled=state.history.length<2;
      body.replaceChildren();
      const step=document.createElement('section');step.className='diagcore__step';
      const kicker=document.createElement('span');kicker.className='diagcore__kicker';kicker.textContent=labels.subtitle;
      const title=document.createElement('h3');title.textContent=node.title||'';
      const para=document.createElement('p');para.textContent=node.text||'';
      const feedback=document.createElement('div');feedback.className='diagcore__feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
      const actions=document.createElement('div');actions.className='diagcore__actions';
      step.append(kicker,title,para,feedback,actions);body.append(step);
      function button(text,handler){
        const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',handler);actions.append(b);
      }
      if(Array.isArray(node.choices)){
        node.choices.forEach(([to,label])=>button(label,()=>render(to)));
      }else if(node.next){
        button(node.check?labels.verify:labels.continue,()=>{
          let ok=true;
          try{if(typeof node.check==='function')ok=Boolean(node.check(opts.context));}
          catch(err){ok=false;if(typeof opts.onError==='function')opts.onError(err);}
          if(!ok){feedback.textContent='⚠ '+(node.fail||'Vérification non validée.');feedback.classList.add('diagcore__feedback--warn');return;}
          render(node.next);
        });
      }
      if(node.returnToTp||node.complete){
        button(opts.finishLabel||labels.finish,()=>{
          state.completed=true;
          if(typeof opts.onComplete==='function')opts.onComplete({history:[...state.history],node:id});
          root.dispatchEvent(new CustomEvent('diagcore:complete',{bubbles:true,detail:{history:[...state.history],node:id}}));
        });
      }
      if(typeof opts.onStep==='function')opts.onStep({id,node,history:[...state.history]});
    }
    back.addEventListener('click',()=>{
      if(state.history.length<2)return;
      state.history.pop();
      render(state.history.pop());
    });
    home.addEventListener('click',()=>{state.history=[];render('start');});
    render('start');
    return {restart:()=>{state.history=[];render('start');},goTo:id=>render(id),getHistory:()=>[...state.history],destroy:()=>root.replaceChildren()};
  }

  // Mode vertical facultatif : le mode DiagTree historique reste inchangé.
  function mountVertical(container,scenario,options){
    const root=typeof container==='string'?document.querySelector(container):container;
    if(!root)throw Error('DiagCore : conteneur introuvable');
    const s=scenario||{},opts=options||{},groups=s.groups||[];
    if(!Array.isArray(groups)||!groups.length)throw Error('DiagCore : groupes de contrôles manquants');
    const checks=groups.flatMap(group=>group.checks||[]);
    if(checks.some(c=>!c.id||!c.label)||new Set(checks.map(c=>c.id)).size!==checks.length)throw Error('DiagCore : identifiants de contrôles invalides');
    const state={done:new Set(),history:[],phase:'checks',resolved:false,selectedGroup:null};
    root.classList.add('diagcore','diagcore--vertical');
    if(opts.theme==='light'||opts.theme==='dark')root.dataset.diagcoreTheme=opts.theme;
    root.replaceChildren();
    const timeline=document.createElement('div');timeline.className='diagcore__timeline';
    const next=document.createElement('section');next.className='diagcore__next';
    root.append(timeline,next);
    function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
    function btn(parent,label,run,disabled=false){const b=el('button','diagcore__choice',label);b.type='button';b.disabled=disabled;b.addEventListener('click',run);parent.append(b);return b;}
    function appendPart(parent,observation){
      if(observation==null)return;
      const parts=Array.isArray(observation)?observation:[observation];
      parts.forEach(part=>{
        const data=typeof part==='string'?{type:'text',text:part}:part;
        if(!data)return;
        if(data.type==='command'){const p=el('pre','diagcore__terminal');const code=el('code',null,data.text||'');p.append(code);parent.append(p);}
        else if(data.type==='image'){const fig=el('figure','diagcore__figure');const img=el('img');img.src=data.src;img.alt=data.alt||'';img.loading='lazy';fig.append(img);if(data.caption)fig.append(el('figcaption',null,data.caption));parent.append(fig);}
        else parent.append(el('p',null,data.text||''));
      });
    }
    function addEntry(type,title,observation){
      const article=el('article','diagcore__entry diagcore__entry--'+type);
      article.append(el('h3',null,title));
      appendPart(article,observation);
      timeline.append(article);
      state.history.push({type,title});
    }
    function scroll(observation=false){const target=observation?timeline.lastElementChild:next;if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}
    function hasRequired(arr){return (arr||[]).every(id=>state.done.has(id));}
    function show(){
      next.replaceChildren();
      if(state.phase==='checks'){
        if(s.title)next.append(el('h2','diagcore__title',s.title));
        if(s.prompt)next.append(el('p','diagcore__prompt',s.prompt));
        const visible=checks;
        if(s.groupPicker&&state.selectedGroup===null){
          const grid=el('div','diagcore__equipment-grid');
          for(const [index,group] of groups.entries()){
            const pending=(group.checks||[]).filter(c=>visible.includes(c));
            const b=btn(grid,group.title||('Équipement '+(index+1)),()=>{
              state.selectedGroup=index;show();scroll();
            });
             if(pending.length&&pending.every(c=>state.done.has(c.id)))b.classList.add('diagcore__choice--visited');
            b.classList.add('diagcore__equipment');
          }
          next.append(grid);
        }
        for(const [groupIndex,group] of groups.entries()){
          if(s.groupPicker&&state.selectedGroup!==groupIndex)continue;
          const pending=(group.checks||[]).filter(c=>visible.includes(c));
          if(!pending.length)continue;
          const sec=el('div','diagcore__group');
          if(group.title)sec.append(el('h3','diagcore__group-title',group.title));
          for(const c of pending){const control=btn(sec,c.label,()=>{
            if(typeof c.enabled==='function'&&!c.enabled({completed:new Set(state.done)}))return;
            state.done.add(c.id);
            state.selectedGroup=null;
            const result=typeof c.observe==='function'?c.observe({completed:new Set(state.done)}):c.observation;
            addEntry('observation',c.label,[...(c.action?[{type:'text',text:c.action}]:[]),...(Array.isArray(result)?result:[result])]);
            show();scroll(true);
          });
          if(state.done.has(c.id))control.classList.add('diagcore__choice--visited');
          }
          next.append(sec);
        }
        if(s.groupPicker&&state.selectedGroup!==null){
          const back=btn(next,'← Choisir un autre équipement',()=>{state.selectedGroup=null;show();scroll();});
          back.classList.add('diagcore__equipment-back');
        }
        const min=Math.max(0,s.minimumChecks||0);
        if(s.hypotheses?.length&&(!s.hideHypothesisUntilReady||state.done.size>=min)){
          const diagnosticArea=el('div','diagcore__diagnostic-area');
          const diagnosticButton=btn(diagnosticArea,s.hypothesisLabel||'Formuler une hypothèse',()=>{
            state.phase='hypotheses';state.selectedGroup=null;show();scroll();
          },state.done.size<min);
          diagnosticButton.classList.add('diagcore__diagnostic-button');
          next.append(diagnosticArea);
          if(state.done.size<min)next.append(el('p','diagcore__hint',(min-state.done.size)+' contrôle(s) supplémentaire(s) nécessaire(s).'));
        }
      }else if(state.phase==='hypotheses'){
        next.append(el('h2','diagcore__title',s.hypothesisTitle||'Quelle hypothèse retiens-tu ?'));
        for(const h of s.hypotheses||[])btn(next,h.label,()=>{
          const valid=Boolean(h.correct)&&hasRequired(h.requiredChecks);
          addEntry(valid?'decision':'feedback',h.label,valid?(h.feedback||'Hypothèse retenue.'):(!h.correct?(h.feedback||'Cette hypothèse ne correspond pas aux faits observés.'):(h.prematureFeedback||'Certaines vérifications indispensables manquent.')));
          state.phase=valid?'correction':'checks';show();scroll();
        });
        btn(next,s.backLabel||'Poursuivre les contrôles',()=>{state.phase='checks';show();scroll();});
      }else if(state.phase==='correction'){
        const c=s.correction||{};
        next.append(el('h2','diagcore__title',c.title||'Appliquer la correction'));
        btn(next,c.label||'Effectuer la correction',()=>{
          if(!hasRequired(c.requiredChecks)){
            addEntry('feedback','Intervention prématurée',c.prematureFeedback||'Des contrôles indispensables sont manquants.');
            state.phase='checks';show();scroll();return;
          }
          addEntry('action',c.label||'Correction',c.observation||'Correction effectuée.');
          state.phase='verification';show();scroll();
        });
      }else if(state.phase==='verification'){
        const v=s.verification||{};
        next.append(el('h2','diagcore__title',v.title||'Vérifier la correction'));
        btn(next,v.label||'Effectuer le contrôle final',()=>{
          const result=typeof v.check==='function'?v.check({completed:new Set(state.done)}):true;
          const valid=Boolean(result);
          addEntry(valid?'observation':'feedback',v.label||'Contrôle final',valid?v.observation:(v.failure||'La correction n’est pas confirmée.'));
          state.phase=valid?'finished':'checks';show();scroll();
          if(valid){state.resolved=true;if(typeof opts.onComplete==='function')opts.onComplete({history:[...state.history],completed:[...state.done]});root.dispatchEvent(new CustomEvent('diagcore:complete',{bubbles:true,detail:{history:[...state.history],completed:[...state.done]}}));}
        });
      }else next.append(el('p','diagcore__complete',s.success||'Diagnostic terminé : correction vérifiée.'));
    }
    function reset(){state.done.clear();state.history=[];state.phase='checks';state.selectedGroup=null;state.resolved=false;timeline.replaceChildren();show();}
    show();
    return {restart:reset,getHistory:()=>[...state.history],getCompleted:()=>[...state.done],destroy:()=>root.replaceChildren()};
  }

  global.DiagCore=Object.freeze({version:'1.2.1',mount});
})(window);
