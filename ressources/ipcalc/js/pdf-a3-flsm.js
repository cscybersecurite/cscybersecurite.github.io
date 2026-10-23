/** Fiche pédagogique FLSM A3 paysage : aucun accès réseau ni dépendance externe. */
import { binaryOctets, numberToIPv4, subnetAt, summaryIndices } from './ipv4.js';

const W=1190.55,H=841.89,round=n=>Number(n.toFixed(2));
const hex=s=>[...String(s)].map(ch=>{
  const n=ch.charCodeAt(0);
  return (n===8217?146:n===8211?150:n===8230?133:n<=255?n:63).toString(16).padStart(2,'0');
}).join('').toUpperCase();

function pdfDocument(commands) {
  const enc=new TextEncoder(),content=commands.join('\n')+'\n';
  const stream=enc.encode(content),objects=[];
  const add=x=>(objects.push(x),objects.length);
  const regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const streamId=add('<< /Length '+stream.length+' >>\nstream\n'+content+'endstream');
  const pages=add('');
  const page=add('<< /Type /Page /Parent '+pages+' 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /R '+regular+' 0 R /B '+bold+' 0 R >> >> /Contents '+streamId+' 0 R >>');
  objects[pages-1]='<< /Type /Pages /Kids ['+page+' 0 R] /Count 1 >>';
  const root=add('<< /Type /Catalog /Pages '+pages+' 0 R >>');
  const parts=['%PDF-1.4\n'],offsets=[0];let size=enc.encode(parts[0]).length;
  for(let i=0;i<objects.length;i++){offsets.push(size);const chunk=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';parts.push(chunk);size+=enc.encode(chunk).length}
  parts.push('xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root '+root+' 0 R >>\nstartxref\n'+size+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}
function draw() {
  const c=[];
  const text=(value,x,y,size=10,bold=false,white=false)=>{
    c.push('BT /'+(bold?'B':'R')+' '+size+' Tf '+(white?'1 1 1':'0.08 0.19 0.31')+' rg 1 0 0 1 '+round(x)+' '+round(H-y)+' Tm <'+hex(value)+'> Tj ET');
  };
  const line=(x,y,X,Y,weight=.45,strong=false)=>c.push((strong?'0.11 0.29 0.45':'0.67 0.74 0.81')+' RG '+weight+' w '+round(x)+' '+round(H-y)+' m '+round(X)+' '+round(H-Y)+' l S');
  const fill=(x,y,w,h,shade='0.971 0.980 0.990')=>c.push(shade+' rg '+round(x)+' '+round(H-y-h)+' '+round(w)+' '+round(h)+' re f');
  const box=(x,y,w,h,r=7)=>{
    const k=.55228475*r,yy=H-y-h;
    c.push('0.60 0.70 0.79 RG .75 w '+round(x+r)+' '+round(yy)+' m '+round(x+w-r)+' '+round(yy)+' l '+round(x+w-r+k)+' '+round(yy)+' '+round(x+w)+' '+round(yy+r-k)+' '+round(x+w)+' '+round(yy+r)+' c '+round(x+w)+' '+round(yy+h-r)+' l '+round(x+w)+' '+round(yy+h-r+k)+' '+round(x+w-r+k)+' '+round(yy+h)+' '+round(x+w-r)+' '+round(yy+h)+' c '+round(x+r)+' '+round(yy+h)+' l '+round(x+r-k)+' '+round(yy+h)+' '+round(x)+' '+round(yy+h-r+k)+' '+round(x)+' '+round(yy+h-r)+' c '+round(x)+' '+round(yy+r)+' l '+round(x)+' '+round(yy+r-k)+' '+round(x+r-k)+' '+round(yy)+' '+round(x+r)+' '+round(yy)+' c S');
  };
  const circle=(x,y,r)=>{
    const k=.55228475*r,cy=H-y;c.push('0.12 0.32 0.49 rg '+round(x+r)+' '+round(cy)+' m '+round(x+r)+' '+round(cy+k)+' '+round(x+k)+' '+round(cy+r)+' '+round(x)+' '+round(cy+r)+' c '+round(x-k)+' '+round(cy+r)+' '+round(x-r)+' '+round(cy+k)+' '+round(x-r)+' '+round(cy)+' c '+round(x-r)+' '+round(cy-k)+' '+round(x-k)+' '+round(cy-r)+' '+round(x)+' '+round(cy-r)+' c '+round(x+k)+' '+round(cy-r)+' '+round(x+r)+' '+round(cy-k)+' '+round(x+r)+' '+round(cy)+' c f');
  };
  const section=(x,y,width,n,title,score)=>{
    fill(x+40,y-19,width-114,29);
    circle(x+17,y-5,16);text(n,x+12,y+1,17,true,true);
    text(title,x+47,y+1,11,true);
    box(x+width-67,y-19,65,29,5);text(score,x+width-61,y,10,true);
  };
  function digitsGrid(x,y,labelWidth,width,labels,addresses,prefix,corrected,opts={}) {
    const xbit=x+labelWidth,bitW=(width-labelWidth)/32,header=19,rowH=opts.rowH??20;
    fill(x,y,width,header*3);
    fill(x,y+header*3,labelWidth,rowH*labels.length,'0.980 0.986 0.993');
    if(opts.pepette)for(let row=2;row<labels.length;row++)fill(xbit+30*bitW,y+3*header+row*rowH,2*bitW,rowH,'0.975 0.975 0.975');
    box(x,y,width,header*3+labels.length*rowH,4);
    line(xbit,y,xbit,y+header*3+labels.length*rowH,.9);
    for(let i=1;i<3;i++)line(x,y+i*header,x+width,y+i*header);
    for(let r=1;r<labels.length;r++)line(x,y+3*header+r*rowH,x+width,y+3*header+r*rowH);
    line(x,y+3*header,x+width,y+3*header);
    for(let j=1;j<32;j++)line(xbit+j*bitW,y+header,xbit+j*bitW,y+header*3+labels.length*rowH,.27);
    for(let j=1;j<4;j++)line(xbit+j*8*bitW,y,xbit+j*8*bitW,y+3*header,1.4,true);
    text('Octets',x+7,y+13,7.5,true);
    text('Puissances de 2',x+7,y+header+13,7.3,true);
    text('Poids décimaux',x+7,y+2*header+13,7.3,true);
    for(let oct=0;oct<4;oct++)text('Octet '+(oct+1),xbit+(oct*8+2)*bitW,y+13,7,true);
    for(let j=0;j<32;j++){
      const cx=xbit+j*bitW+bitW/2,pow=7-j%8,wt=String(2**pow);
      text(String(pow),cx-2,y+header+13,6.2);
      text(wt,cx-wt.length*1.8,y+2*header+13,6.0,true);
    }
    labels.forEach((label,i)=>{
      const baseline=y+3*header+i*rowH+rowH/2+3;
      text(label,x+7,baseline,opts.font??8);
      if(corrected&&addresses[i]){
        const bits=binaryOctets(addresses[i]).join('');
        for(let j=0;j<32;j++)if(bits[j]==='1'||(opts.pepette&&i>=2&&j>=30))text(bits[j],xbit+(j+.5)*bitW-2.6,baseline,8,true);
      }
    });
    if(corrected&&Number.isInteger(prefix)&&prefix>=0&&prefix<=31)line(xbit+prefix*bitW,y+3*header+rowH,xbit+prefix*bitW,y+3*header+labels.length*rowH,1.25,true);
  }
  return {c,text,line,fill,box,circle,section,digitsGrid};
}

function buildA3(base,plan,corrected) {
  if (!plan || plan.base.prefix!==base.prefix || plan.base.address!==base.address) {
    throw new Error('Découpage FLSM manquant ou incohérent.');
  }
  if (plan.prefix>=31 || base.prefix>=31) {
    throw new Error('La fiche pédagogique FLSM nécessite un broadcast (préfixe inférieur à /31).');
  }
  const {c,text,line,fill,box}=draw();

  // A3 : chaque bit de droite a la largeur suffisante pour "128" (Helvetica-Bold 6,9 pt).
  // 128 occupe ~11,5 pt ; case de 14,5 pt pour conserver de l'air.
  // La largeur récupérée revient intégralement à la partie A, sans toucher au contenu.
  const pageLeft=17,pageRight=1171,gutter=12;
  const labelW=116,minBitWidth=14.5;
  const rightWidth=labelW+32*minBitWidth;
  const leftWidth=pageRight-pageLeft-gutter-rightWidth;
  const L={x:pageLeft,w:leftWidth},R={x:pageLeft+leftWidth+gutter,w:rightWidth};
  const bottomY=752,bottomH=62;
  const count=plan.concernedCount,ids=summaryIndices(count);
  const leftCol=112,leftBitX=L.x+leftCol,leftBitW=(L.w-leftCol)/32;
  const bitX=R.x+labelW,bitWidth=(R.w-labelW)/32;
  const gridRight=bitX+32*bitWidth;
  const octetX=oct=>bitX+oct*8*bitWidth;
  const centerBit=j=>bitX+(j+0.5)*bitWidth;
  const ink='0.968 0.980 0.990';

  // Bloc identitaire réservé à gauche : jamais de bandeau à cheval sur A et B.
  fill(L.x,19,L.w,38);box(L.x,19,L.w,38,8);
  text("Fiche d'adressage IPv4 & Sous-réseaux FLSM",L.x+10,44,13.6,true);
  box(L.x,64,L.w,75,7);
  text('Nom :',L.x+10,84,9,true);line(L.x+49,88,L.x+217,88);
  text('Prénom :',L.x+237,84,9,true);line(L.x+291,88,L.x+L.w-10,88);
  text('Classe :',L.x+10,111,9,true);line(L.x+56,115,L.x+145,115);
  text('Date :',L.x+160,111,9,true);line(L.x+198,115,L.x+283,115);
  text('Note : ........ /20',L.x+321,111,9,true);
  fill(L.x,145,L.w,43);box(L.x,145,L.w,43,7);
  text('Adresse IPv4 :',L.x+10,171,10,true);
  text(base.inputAddress+'/'+base.prefix,L.x+119,171,14,true);

  // A : garder la lecture, les exercices, les gris Pépette et l'absence
  // de traits d'octet lourds dans les lignes de réponse.
  fill(L.x,199,L.w,27);box(L.x,199,L.w,27,5);
  text('A. Analyse du réseau initial',L.x+9,217,11,true);
  text('/10',L.x+L.w-27,217,10,true);
  text('Compléter le tableau en binaire ci-dessous',L.x+5,240,9.4,true);
  text('/4',L.x+L.w-22,240,9.4,true);
  const yA=249,hA=18,rowA=23,labelsA=[
    "Adresse de l'hôte",'CIDR (masque binaire)',
    'Adresse réseau','Première adresse','Dernière adresse','Broadcast'
  ];
  const first=numberToIPv4(base.network+1),
    last=numberToIPv4(base.network+base.blockSize-2);
  const valuesA=[base.inputAddress,base.mask,base.address,first,last,base.broadcast];
  fill(L.x,yA,L.w,hA*3,ink);
  fill(L.x,yA+hA*3,leftCol,rowA*6,'0.980 0.987 0.994');
  for(let k=2;k<6;k++)fill(leftBitX+30*leftBitW,yA+3*hA+k*rowA,2*leftBitW,rowA,'0.975 0.975 0.975');
  box(L.x,yA,L.w,3*hA+6*rowA,4);
  line(leftBitX,yA,leftBitX,yA+3*hA+6*rowA,.9);
  for(let k=1;k<3;k++)line(L.x,yA+k*hA,L.x+L.w,yA+k*hA);
  line(L.x,yA+3*hA,L.x+L.w,yA+3*hA);
  for(let k=1;k<6;k++)line(L.x,yA+3*hA+k*rowA,L.x+L.w,yA+3*hA+k*rowA);
  for(let j=1;j<32;j++)line(leftBitX+j*leftBitW,yA+hA,leftBitX+j*leftBitW,yA+3*hA+6*rowA,.24);
  for(let j=1;j<4;j++)line(leftBitX+8*j*leftBitW,yA,leftBitX+8*j*leftBitW,yA+3*hA,1.1,true);
  text('OCTETS',L.x+5,yA+13,7.5,true);
  text('Puissances de 2',L.x+5,yA+hA+12,6.9,true);
  text('Poids décimaux',L.x+5,yA+2*hA+12,7,true);
  for(let oct=0;oct<4;oct++)text('Octet '+(oct+1),leftBitX+(oct*8+2)*leftBitW,yA+12,7,true);
  for(let j=0;j<32;j++){
    const x=leftBitX+(j+0.5)*leftBitW,p=7-j%8,v=String(2**p);
    text(String(p),x-2,yA+hA+12,6);
    text(v,x-v.length*1.67,yA+2*hA+12,5.7,true);
  }
  labelsA.forEach((label,k)=>{
    const yy=yA+3*hA+k*rowA+15;
    text(label,L.x+5,yy,k===1?7.3:8);
    if(corrected) {
      const bits=binaryOctets(valuesA[k]).join('');
      for(let j=0;j<32;j++)if(bits[j]==='1'||(k>=2&&j>=30))
        text(bits[j],leftBitX+(j+.5)*leftBitW-2.6,yy,7.8,true);
    }
  });
  // Ne commence qu'à la ligne CIDR, jamais sur l'adresse de l'hôte.
  if(corrected)line(leftBitX+base.prefix*leftBitW,yA+3*hA+rowA,
    leftBitX+base.prefix*leftBitW,yA+3*hA+rowA*6,1.05,true);

  text('Compléter le tableau en décimal ci-dessous',L.x+5,464,9.4,true);
  text('/5',L.x+L.w-22,464,9.4,true);
  const decY=472,decH=45,decLab=135;
  fill(L.x,decY,decLab,5*decH,'0.980 0.987 0.994');
  box(L.x,decY,L.w,5*decH,5);
  line(L.x+decLab,decY,L.x+decLab,decY+5*decH,.75);
  const decNames=['Masque de sous-réseau','Adresse réseau','Première adresse','Dernière adresse','Broadcast'];
  const decValues=[base.mask,base.address,first,last,base.broadcast];
  for(let k=0;k<5;k++){
    if(k)line(L.x,decY+k*decH,L.x+L.w,decY+k*decH);
    text(decNames[k],L.x+7,decY+k*decH+27,8.2);
    if(corrected)text(decValues[k],L.x+decLab+11,decY+k*decH+27,10.8,true);
  }

  // B : le guide des octets et chaque bloc ont EXACTEMENT la même origine bitX.
  text('Découpage demandé : '+count.toLocaleString('fr-FR').replace(/[\u00a0\u202f]/g,' ')+
    ' sous-réseaux ('+ids.length+' affichés)',R.x+5,38,11.2,true);
  fill(R.x,45,R.w,29);box(R.x,45,R.w,29,5);
  text('B. Découpage en sous-réseaux FLSM',R.x+10,64,11.5,true);
  text('/9',R.x+R.w-25,64,10,true);
  const itemWidth=R.w/3;
  const fields=[
    ['Préfixe initial','/'+base.prefix],
    ['Bits empruntés',String(plan.prefix-base.prefix)],
    ['Préfixe de sous-réseau','/'+plan.prefix]
  ];
  fields.forEach(([label,value],index)=>{
    const x=R.x+index*itemWidth+4;
    text(label,x,91,8.8,true);
    box(x,97,itemWidth-13,29,4);
    if(corrected)text(value,x+12,117,11,true);
  });

  const hY=138,headH=18,headTotal=3*headH;
  fill(R.x,hY,R.w,headTotal,ink);box(R.x,hY,R.w,headTotal,4);
  line(bitX,hY,bitX,hY+headTotal,.9);
  line(R.x,hY+headH,R.x+R.w,hY+headH);
  line(R.x,hY+2*headH,R.x+R.w,hY+2*headH);
  text('OCTETS',R.x+7,hY+13,8,true);
  text('Puissances de 2',R.x+7,hY+headH+13,8,true);
  text('Poids décimaux',R.x+7,hY+2*headH+13,8,true);
  for(let oct=0;oct<4;oct++){
    const center=octetX(oct)+4*bitWidth;
    text((oct+1)+(oct===0?'er':'e')+' octet',center-20,hY+13,8,true);
  }
  for(let j=1;j<32;j++)line(bitX+j*bitWidth,hY+headH,bitX+j*bitWidth,hY+headTotal,.25);
  for(let j=1;j<4;j++)line(octetX(j),hY,octetX(j),hY+headTotal,1.25,true);
  for(let j=0;j<32;j++){
    const center=centerBit(j),p=7-j%8,value=String(2**p);
    text(String(p),center-2,hY+headH+13,6.9);
    // 128 et 64 ont la même origine mathématique que la case située dessous.
    text(value,center-value.length*2.1,hY+2*headH+13,6.9,true);
  }

  const blockY=205,blockStep=89,subHead=17,rowH=15.5;
  const subLabels=['Réseau (binaire)','Réseau (décimal)',
    'Broadcast (binaire)','Broadcast (décimal)'];
  ids.forEach((index,k)=>{
    const subnet=subnetAt(plan,index),y=blockY+k*blockStep;
    fill(R.x,y,R.w,subHead,ink);
    box(R.x,y,R.w,subHead+4*rowH,4);
    text('Sous-réseau',R.x+6,y+12,8,true);
    box(R.x+74,y+2,32,13,3);
    const id=String(index);
    text(id,R.x+91-id.length*2.4,y+12,8.3,true);
    fill(R.x,y+subHead,labelW,4*rowH,'0.982 0.988 0.994');
    line(bitX,y+subHead,bitX,y+subHead+4*rowH,.8);
    for(let row=1;row<4;row++)
      line(R.x,y+subHead+row*rowH,R.x+R.w,y+subHead+row*rowH,.35);
    // Début des 4 octets : identique pour tous les blocs et l'en-tête.
    // Décimal : quatre grandes cases ; binaire : trente-deux petites cases.
    for(let j=1;j<32;j++) {
      const x=bitX+j*bitWidth;
      line(x,y+subHead,x,y+subHead+rowH,.26);
      line(x,y+subHead+2*rowH,x,y+subHead+3*rowH,.26);
    }
    for(let j=1;j<4;j++){
      const x=octetX(j);
      line(x,y+subHead+rowH,x,y+subHead+2*rowH,.5);
      line(x,y+subHead+3*rowH,x,y+subHead+4*rowH,.5);
    }
    if(corrected && plan.prefix>base.prefix) {
      const left=bitX+base.prefix*bitWidth,right=bitX+plan.prefix*bitWidth;
      for(const offset of [0,2*rowH]){
        fill(left,y+subHead+offset,right-left,rowH,'0.976 0.976 0.976');
        // Re-dessiner la grille devant le fond pâle.
        for(let j=1;j<32;j++)line(bitX+j*bitWidth,y+subHead+offset,
          bitX+j*bitWidth,y+subHead+offset+rowH,.26);
        line(left,y+subHead+offset,left,y+subHead+offset+rowH,1,true);
        line(right,y+subHead+offset,right,y+subHead+offset+rowH,1,true);
      }
    }
    const addresses=[subnet.address,subnet.address,subnet.broadcast,subnet.broadcast];
    subLabels.forEach((label,row)=>{
      const yy=y+subHead+row*rowH+11;
      text(label,R.x+6,yy,7.8);
      if(!corrected)return;
      if(row%2===0) {
        const bits=binaryOctets(addresses[row]).join('');
        for(let j=0;j<32;j++)if(bits[j]==='1')
          text('1',centerBit(j)-2.25,yy,7.2,true);
      } else {
        const octets=addresses[row].split('.');
        octets.forEach((value,oct)=>{
          const center=octetX(oct)+4*bitWidth;
          text(value,center-value.length*2.7,yy,9.3,true);
        });
      }
    });
  });

  // Les deux cartouches du bas sont synchronisés en hauteur et en position.
  fill(L.x,bottomY,L.w,bottomH,ink);box(L.x,bottomY,L.w,bottomH,7);
  text("Nombre d'hôtes utilisables pour le réseau initial",L.x+10,bottomY+20,10,true);
  text('/1',L.x+L.w-25,bottomY+20,10,true);
  text('2',L.x+15,bottomY+47,16,true);
  text('(32 - CIDR)',L.x+28,bottomY+35,7,true);
  text('- 2 =',L.x+71,bottomY+47,12,true);
  if(corrected)text(base.usableHosts.toLocaleString('fr-FR').replace(/[\u00a0\u202f]/g,' '),L.x+119,bottomY+47,12.5,true);
  fill(R.x,bottomY,R.w,bottomH,ink);box(R.x,bottomY,R.w,bottomH,7);
  text("C. Nombre d'hôtes utilisables par sous-réseau",R.x+10,bottomY+20,10,true);
  text('/1',R.x+R.w-25,bottomY+20,10,true);
  text('2',R.x+15,bottomY+47,16,true);
  text('(32 - préfixe SR)',R.x+28,bottomY+35,7,true);
  text('- 2 =',R.x+97,bottomY+47,12,true);
  if(corrected)text(plan.usableHosts.toLocaleString('fr-FR').replace(/[\u00a0\u202f]/g,' '),R.x+151,bottomY+47,12.5,true);
  return pdfDocument(c);
}

export function downloadFlsmA3(base,plan,corrected=false){
  const file=buildA3(base,plan,corrected),url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;
  a.download='IPcalc_FLSM_'+base.inputAddress.replaceAll('.','-')+'_'+base.prefix+'_'+plan.concernedCount+'SR_'+(corrected?'corrige':'enonce')+'.pdf';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
