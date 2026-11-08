/* 合成双孔：径向扫描亮度跳变、最小二乘圆和中心距。 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionCircleDemo=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=220,H=130,HOLES=[{x:61,y:65,r:24},{x:158,y:65,r:21}];
 function scene(options={}){
  const missing=Number(options.missing),interference=!!options.interference;
  if(!Number.isFinite(missing)||missing<0||missing>300)return null;
  const gray=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   let value=205+((x*13+y*11)%5-2);
   for(const p of HOLES){
    const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy),angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
    if(d<=p.r&&angle>=missing){
     value=48+((x*7+y*3)%5-2);
     if(interference&&angle>=190&&angle<=245&&d>p.r*.48&&d<p.r*.64)value=250;
    }
   }
   gray[y*W+x]=value;
  }
  return{w:W,h:H,gray,missing,interference};
 }
 function pixel(image,x,y){
  if(x<0||y<0||x>image.w-1||y>image.h-1)return NaN;
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(image.w-1,x0+1),y1=Math.min(image.h-1,y0+1),u=x-x0,v=y-y0;
  return image.gray[y0*image.w+x0]*(1-u)*(1-v)+image.gray[y0*image.w+x1]*u*(1-v)+image.gray[y1*image.w+x0]*(1-u)*v+image.gray[y1*image.w+x1]*u*v;
 }
 function coverage(angles){
  if(!angles||angles.length<2)return 0;
  const sorted=angles.map(a=>(a%360+360)%360).sort((a,b)=>a-b);let gap=0;
  for(let i=0;i<sorted.length;i++)gap=Math.max(gap,(i===sorted.length-1?sorted[0]+360:sorted[i+1])-sorted[i]);
  return 360-gap;
 }
 function solve3(matrix,vector){
  const a=matrix.map((row,i)=>[...row,vector[i]]);
  for(let c=0;c<3;c++){
   let best=c;for(let r=c+1;r<3;r++)if(Math.abs(a[r][c])>Math.abs(a[best][c]))best=r;
   if(Math.abs(a[best][c])<1e-8)return null;
   [a[c],a[best]]=[a[best],a[c]];const pivot=a[c][c];for(let j=c;j<4;j++)a[c][j]/=pivot;
   for(let r=0;r<3;r++){if(r===c)continue;const factor=a[r][c];for(let j=c;j<4;j++)a[r][j]-=factor*a[c][j]}
  }
  return a.map(row=>row[3]);
 }
 function fitCircle(points){
  if(!Array.isArray(points)||points.length<5||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const n=points.length,mx=points.reduce((s,p)=>s+p.x,0)/n,my=points.reduce((s,p)=>s+p.y,0)/n;
  let xx=0,xy=0,yy=0,sx=0,sy=0,sz=0,sxz=0,syz=0;
  for(const p of points){const x=p.x-mx,y=p.y-my,z=x*x+y*y;xx+=x*x;xy+=x*y;yy+=y*y;sx+=x;sy+=y;sz+=z;sxz+=x*z;syz+=y*z}
  const sol=solve3([[xx,xy,sx],[xy,yy,sy],[sx,sy,n]],[sxz,syz,sz]);if(!sol)return null;
  const cx=mx+sol[0]/2,cy=my+sol[1]/2,r2=sol[2]+(sol[0]*sol[0]+sol[1]*sol[1])/4;
  if(!(r2>0)||!Number.isFinite(r2))return null;
  const radius=Math.sqrt(r2),rms=Math.sqrt(points.reduce((s,p)=>s+(Math.hypot(p.x-cx,p.y-cy)-radius)**2,0)/n);
  return{x:cx,y:cy,radius,rms};
 }
 function scan(image,seed,count,threshold){
  if(!image||image.w!==W||image.h!==H||!image.gray||image.gray.length!==W*H||!seed||!Number.isFinite(seed.x)||!Number.isFinite(seed.y)||!Number.isInteger(count)||count<4||count>32||!Number.isFinite(threshold)||threshold<1||threshold>255)return null;
  const rays=[],points=[];
  for(let i=0;i<count;i++){
   const angle=360*i/count,t=angle*Math.PI/180,dx=Math.cos(t),dy=Math.sin(t),start=8,end=33;let previous=pixel(image,seed.x+dx*start,seed.y+dy*start),best=-Infinity,bestR=null;
   for(let r=start+1;r<=end;r++){const current=pixel(image,seed.x+dx*r,seed.y+dy*r),diff=current-previous;if(Number.isFinite(diff)&&diff>best){best=diff;bestR=r-.5}previous=current}
   const point=bestR!==null&&best>=threshold?{x:seed.x+dx*bestR,y:seed.y+dy*bestR,angle,delta:best}:null;
   rays.push({angle,x1:seed.x+dx*start,y1:seed.y+dy*start,x2:seed.x+dx*end,y2:seed.y+dy*end,point});if(point)points.push(point);
  }
  const angleCoverage=coverage(points.map(p=>p.angle));
  const fit=points.length>=5&&angleCoverage>=120?fitCircle(points):null;
  const reason=points.length<5?'有效边缘点不足 5 个':angleCoverage<120?'有效测量线覆盖角度不足 120°':!fit?'点集退化，无法拟合圆':'';
  return{rays,points,fit,coverage:angleCoverage,reason};
 }
 function measure(first,second,scale){
  if(!first||!second||!first.fit||!second.fit)return null;
  const pixels=Math.hypot(second.fit.x-first.fit.x,second.fit.y-first.fit.y),value=Number.isFinite(scale)&&scale>0?pixels*scale:NaN;
  return{pixels,mm:Number.isFinite(value)?value:null};
 }
 return{W,H,HOLES,scene,scan,fitCircle,coverage,measure};
});
