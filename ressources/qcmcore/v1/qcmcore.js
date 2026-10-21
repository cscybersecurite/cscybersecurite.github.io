/* QCMCore 1.0.0 - Entraînement pédagogique sans serveur. */
(function(global){
'use strict';
const instances=new Set();
function fail(message){throw new Error('QCMCore : '+message);}
function validate(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||!Array.isArray(data.quizzes)||!data.quizzes.length)fail('la racine doit contenir un tableau quizzes non vide.');
 const quizIds=new Set();
 data.quizzes.forEach((quiz,qi)=>{
  if(!quiz||typeof quiz.id!=='string'||!quiz.id.trim()||quizIds.has(quiz.id))fail('identifiant de questionnaire absent ou en doublon (index '+qi+').');
  quizIds.add(quiz.id);
  if(quiz.shuffleQuestions!==undefined&&typeof quiz.shuffleQuestions!=='boolean')fail(quiz.id+' : shuffleQuestions doit être booléen.');
  if(quiz.shuffleAnswers!==undefined&&typeof quiz.shuffleAnswers!=='boolean')fail(quiz.id+' : shuffleAnswers doit être booléen.');
  if(!Array.isArray(quiz.questions)||!quiz.questions.length)fail(quiz.id+' : questions manquantes.');
  const ids=new Set();
  quiz.questions.forEach((q,i)=>{
   const loc=quiz.id+'/question '+(i+1);
   if(!q||typeof q.id!=='string'||!q.id.trim()||ids.has(q.id))fail(loc+' : id absent ou doublon.');
   ids.add(q.id);
   if(typeof q.text!=='string'||!q.text.trim())fail(loc+' : énoncé manquant.');
   if(!Array.isArray(q.answers)||q.answers.length<2)fail(loc+' : au moins deux propositions sont nécessaires.');
   const aIds=new Set();
   q.answers.forEach((a,j)=>{
    if(!a||typeof a.id!=='string'||!a.id.trim()||aIds.has(a.id)||typeof a.text!=='string'||!a.text.trim())fail(loc+' : proposition '+(j+1)+' invalide ou dupliquée.');
    aIds.add(a.id);
   });
   if(typeof q.correctAnswerId!=='string'||!aIds.has(q.correctAnswerId))fail(loc+' : identifiant de bonne réponse introuvable.');
   if(typeof q.explanation!=='string'||!q.explanation.trim())fail(loc+' : explication manquante.');
   if(typeof q.hint!=='string'||!q.hint.trim())fail(loc+' : indice manquant.');
  });
 });
 return data;
}
function shuffle(source){const list=source.slice();for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
async function load(url){
 if(typeof url!=='string'||!url.trim())fail('URL du JSON manquante.');
 let response;
 try{response=await fetch(url,{cache:'no-cache'});}catch(e){fail('impossible de charger '+url+' ('+e.message+').');}
 if(!response.ok)fail('JSON inaccessible : HTTP '+response.status+' ('+url+').');
 let data;try{data=await response.json();}catch(e){fail('JSON mal formé : '+e.message);}
 return validate(data);
}
function mount(container,data,id,options={}){
 const target=typeof container==='string'?document.querySelector(container):container;
 if(!target)fail('élément HTML cible introuvable.');
 validate(data);
 const quiz=data.quizzes.find(q=>q.id===id);
 if(!quiz)fail('questionnaire introuvable : '+id);
 const state={rows:[],destroyed:false};
 target.classList.add('qcmcore');
 function element(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function clearMark(row){row.card.classList.remove('qcmcore__card--correct','qcmcore__card--wrong','qcmcore__card--incomplete');row.feedback.replaceChildren();row.feedback.hidden=true;}
 function start(){
  if(state.destroyed)return;
  target.replaceChildren();state.rows=[];
  const form=element('form','qcmcore__form');form.autocomplete='off';form.setAttribute('autocomplete','off');
  const ordered=quiz.shuffleQuestions===false?quiz.questions.slice():shuffle(quiz.questions);
  ordered.forEach((q,index)=>{
   const card=element('section','qcmcore__card');
   const label=element('label','qcmcore__question',(index+1)+'. '+q.text);
   const select=element('select','qcmcore__select');
   select.name='qcmcore-'+q.id;select.id='qcmcore-'+id+'-'+q.id;select.autocomplete='off';
   label.htmlFor=select.id;
   const blank=element('option','', 'Choisir…');blank.value='';blank.defaultSelected=true;blank.selected=true;select.append(blank);
   const answers=quiz.shuffleAnswers===false?q.answers.slice():shuffle(q.answers);
   answers.forEach(answer=>{const opt=element('option','',answer.text);opt.value=answer.id;select.append(opt);});
   select.selectedIndex=0;select.value='';
   const feedback=element('div','qcmcore__feedback');feedback.hidden=true;feedback.setAttribute('aria-live','polite');
   select.addEventListener('change',()=>{
    if(select.disabled)return;
    clearMark(row);
    summary.hidden=true;summary.textContent='';
   });
   card.append(label,select,feedback);form.append(card);
   const row={q,card,select,feedback};state.rows.push(row);
  });
  const button=element('button','qcmcore__verify','Vérifier mes réponses');button.type='submit';
  const summary=element('p','qcmcore__summary');summary.hidden=true;summary.setAttribute('role','status');
  form.append(button,summary);
  form.addEventListener('submit',event=>{
   event.preventDefault();let correct=0,missing=0;
   state.rows.forEach(row=>{
    clearMark(row);
    const value=row.select.value;
    if(!value){missing++;row.card.classList.add('qcmcore__card--incomplete');return;}
    const ok=value===row.q.correctAnswerId;
    row.card.classList.add(ok?'qcmcore__card--correct':'qcmcore__card--wrong');
    row.select.disabled=ok;
    if(ok)correct++;
    const heading=element('div','qcmcore__feedback-heading');
    const icon=element('span','qcmcore__icon',ok?'✓':'!');
    icon.setAttribute('aria-hidden','true');
    heading.append(icon,element('strong','',ok?'Bravo ! Bonne réponse.':'À revoir !'));
    row.feedback.append(heading,element('p','',ok?row.q.explanation:row.q.hint));
    row.feedback.hidden=false;
   });
   summary.hidden=false;
   if(correct===state.rows.length)summary.textContent='Bravo ! Toutes les réponses sont correctes.';
   else summary.textContent=correct+' bonne(s) réponse(s) sur '+state.rows.length+'.'+(missing?' '+missing+' question(s) incomplète(s).':'')+' Tu peux corriger les réponses à revoir.';
  });
  target.append(form);
  // Déjouer la restauration différée des formulaires sur les navigateurs mobiles.
  resetSelections();
 }
 function resetSelections(){state.rows.forEach(row=>{row.select.disabled=false;row.select.selectedIndex=0;row.select.value='';clearMark(row);});}
 const pageShow=event=>{if(event.persisted)start();};
 global.addEventListener('pageshow',pageShow);
 function dispose(){state.destroyed=true;global.removeEventListener('pageshow',pageShow);target.replaceChildren();instances.delete(api);}
 const api={open:start,close:()=>{target.replaceChildren();state.rows=[];},destroy:dispose,getOrder:()=>state.rows.map(row=>({questionId:row.q.id,answerIds:[...row.select.options].slice(1).map(o=>o.value)}))};
 start();instances.add(api);return api;
}
function bindDetails(details,container,data,id,options={}){
 const panel=typeof details==='string'?document.querySelector(details):details;
 if(!panel||panel.tagName!=='DETAILS')fail('un élément details est requis.');
 let instance=null,alive=true;
 const onToggle=()=>{if(!alive)return;if(panel.open){if(instance)instance.destroy();instance=mount(container,data,id,options);}else if(instance){instance.destroy();instance=null;}};
 panel.addEventListener('toggle',onToggle);if(panel.open)onToggle();
 return {destroy(){alive=false;panel.removeEventListener('toggle',onToggle);if(instance)instance.destroy();}};
}
global.QCMCore=Object.freeze({version:'1.0.0',load,validate,mount,bindDetails});
})(window);
