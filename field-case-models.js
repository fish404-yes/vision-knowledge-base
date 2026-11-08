/* 二维案例模型：平面仿射最小二乘与合成 Blob 输入。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionFieldCaseModels=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function solve3(matrix,vector){
  const a=matrix.map((row,i)=>[...row,vector[i]]);
  for(let c=0;c<3;c++){let pivot=c;for(let r=c+1;r<3;r++)if(Math.abs(a[r][c])>Math.abs(a[pivot][c]))pivot=r;if(Math.abs(a[pivot][c])<1e-10)return null;[a[c],a[pivot]]=[a[pivot],a[c]];const d=a[c][c];for(let j=c;j<4;j++)a[c][j]/=d;for(let r=0;r<3;r++)if(r!==c){const k=a[r][c];for(let j=c;j<4;j++)a[r][j]-=k*a[c][j]}}
  return a.map(row=>row[3]);
 }
 function fitAffine(pairs){
  if(!Array.isArray(pairs)||pairs.length<3||!pairs.every(p=>p&&[p.u,p.v,p.x,p.y].every(Number.isFinite)))return null;
  const n=pairs.length,mu=pairs.reduce((s,p)=>s+p.u,0)/n,mv=pairs.reduce((s,p)=>s+p.v,0)/n;
  const su=Math.sqrt(pairs.reduce((s,p)=>s+(p.u-mu)**2,0)/n),sv=Math.sqrt(pairs.reduce((s,p)=>s+(p.v-mv)**2,0)/n);if(su<1e-9||sv<1e-9)return null;
  const m=Array.from({length:3},()=>[0,0,0]),bx=[0,0,0],by=[0,0,0];
  for(const p of pairs){const v=[1,(p.u-mu)/su,(p.v-mv)/sv];for(let i=0;i<3;i++){bx[i]+=v[i]*p.x;by[i]+=v[i]*p.y;for(let j=0;j<3;j++)m[i][j]+=v[i]*v[j]}}
  const x=solve3(m,bx),y=solve3(m,by);if(!x||!y)return null;
  const coeff=[x[1]/su,x[2]/sv,x[0]-x[1]*mu/su-x[2]*mv/sv,y[1]/su,y[2]/sv,y[0]-y[1]*mu/su-y[2]*mv/sv];
  const residuals=pairs.map(p=>{const z=mapAffine(coeff,p.u,p.v);return Math.hypot(z.x-p.x,z.y-p.y)});
  return{coeff,rms:Math.sqrt(residuals.reduce((s,r)=>s+r*r,0)/n),residuals,count:n};
 }
 function mapAffine(coeff,u,v){if(!Array.isArray(coeff)||coeff.length!==6||!coeff.every(Number.isFinite)||![u,v].every(Number.isFinite))return null;return{x:coeff[0]*u+coeff[1]*v+coeff[2],y:coeff[3]*u+coeff[4]*v+coeff[5]}}
 function truth(u,v){return{x:100+.20*u+.03*v,y:380-.015*u-.16*v}}
 function calibration(error){
  if(!Number.isFinite(error))return null;
  const pairs=[];for(const v of [60,240,420])for(const u of [100,320,540]){const p=truth(u,v);pairs.push({u,v,x:p.x,y:p.y})}
  pairs[4].x+=error;const fit=fitAffine(pairs),check={u:230,v:155},target={u:410,v:280};if(!fit)return null;
  check.ref=truth(check.u,check.v);check.pred=mapAffine(fit.coeff,check.u,check.v);check.error=Math.hypot(check.pred.x-check.ref.x,check.pred.y-check.ref.y);
  target.pred=mapAffine(fit.coeff,target.u,target.v);return{pairs,fit,check,target,error};
 }
 function blobSample(){
  const w=12,h=8,gray=new Uint8Array(w*h);gray.fill(215);
  for(let y=1;y<=3;y++)for(let x=2;x<=4;x++)gray[y*w+x]=65;
  for(let y=2;y<=3;y++)for(let x=7;x<=9;x++)gray[y*w+x]=95;
  gray[5*w+2]=70;gray[5*w+3]=70;gray[5*w+8]=80;
  return{w,h,gray,roi:{x:1,y:1,w:10,h:6}};
 }
 return{fitAffine,mapAffine,calibration,blobSample};
});
