/**
 * RemiseCore V2 - prototype indépendant.
 * Aucune donnée de session ni identifiant de feuille n'est placé dans le dépôt public.
 * Propriété ScriptProperties requise : SPREADSHEET_ID
 *
 * Feuille Sessions : Code | Actif | Libelle
 * Feuille Remises  : Horodatage | Session | TP | Nom | Prenom | Reference | JSON
 * Feuilles TP_*   : colonnes normalisées et résultats aplatis.
 */
const RC = Object.freeze({maxPayload:20000,maxIdentity:80,maxCode:256});
function classeur_(){
  const id=PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if(!id)throw new Error("Configuration serveur manquante : SPREADSHEET_ID");
  return SpreadsheetApp.openById(id);
}
function feuille_(ss,name,headers){
  let sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers);}
  return sh;
}
function codeAutorise_(code){
  if(typeof code!=="string"||!code.trim()||code.length>RC.maxCode)return false;
  const sh=classeur_().getSheetByName("Sessions");
  if(!sh||sh.getLastRow()<2)return false;
  const rows=sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  return rows.some(row=>row[0]===code&&String(row[1]).trim().toUpperCase()==="OUI");
}
function verifierCode(code){
  return {autorise:codeAutorise_(code)};
}
function doGet(){
  return HtmlService.createHtmlOutputFromFile("Formulaire")
    .setTitle("RemiseCore V2")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function aplatir_(objet,prefixe,resultat){
  if(objet===null||typeof objet!=="object"){
    if(prefixe)resultat[prefixe]=String(objet??"");
    return;
  }
  for(const [cle,valeur] of Object.entries(objet)){
    if(!/^[\w-]{1,70}$/.test(cle))continue;
    aplatir_(valeur,prefixe?prefixe+"."+cle:cle,resultat);
  }
}
function titreFeuille_(tp){
  return "TP_"+tp.replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,75);
}
function enregistrerRemise(data){
  if(!data||typeof data!=="object")throw new Error("Remise invalide");
  const code=String(data.code??"");
  const nom=String(data.nom??"").trim();
  const prenom=String(data.prenom??"").trim();
  const tp=String(data.tp??"").trim();
  const payload=data.resultats;
  if(!codeAutorise_(code))return {ok:false,message:"Code de session incorrect."};
  if(!nom||!prenom||nom.length>RC.maxIdentity||prenom.length>RC.maxIdentity||
     !/^[a-zA-Z0-9_-]{1,60}$/.test(tp)||!payload||typeof payload!=="object"||
     Array.isArray(payload))return {ok:false,message:"Informations de remise invalides."};
  const brut=JSON.stringify(payload);
  if(brut.length>RC.maxPayload)return {ok:false,message:"Résultats trop volumineux."};
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    // Revérification sous verrou : une session peut avoir été fermée.
    if(!codeAutorise_(code))return {ok:false,message:"Session fermée."};
    const ss=classeur_(),reference=Utilities.getUuid(),horodatage=new Date();
    const remises=feuille_(ss,"Remises",["Horodatage","Session","TP","Nom","Prenom","Reference","JSON"]);
    remises.appendRow([horodatage,texteCellule_(code),texteCellule_(tp),texteCellule_(nom),texteCellule_(prenom),reference,texteCellule_(brut)]);
    const details={};aplatir_(payload,"",details);
    const resultat=feuille_(ss,titreFeuille_(tp),["Horodatage","Session","Nom","Prenom","Reference"]);
    let headers=resultat.getRange(1,1,1,resultat.getLastColumn()).getValues()[0];
    for(const key of Object.keys(details)){
      if(headers.includes(key))continue;
      headers.push(key);resultat.getRange(1,headers.length).setValue(key);
    }
    const ligne=headers.map(h=>{
      if(h==="Horodatage")return horodatage;
      if(h==="Session")return texteCellule_(code);
      if(h==="Nom")return texteCellule_(nom);
      if(h==="Prenom")return texteCellule_(prenom);
      if(h==="Reference")return reference;
      return texteCellule_(details[h]??"");
    });
    resultat.appendRow(ligne);
    return {ok:true,reference:reference};
  }finally{lock.releaseLock();}
}
// Les valeurs élèves sont du texte, jamais des formules Sheets.
function texteCellule_(valeur){
  const v=String(valeur??"");
  return /^[\s]*[=+@-]/.test(v)?"'"+v:v;
}
