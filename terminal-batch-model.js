/* 六张合成样本的统一阈值对照：真值仅来自场景预设。 */
(function(root,factory){
 const M=typeof module==='object'&&module.exports?require('./terminal-case-model.js'):root.VisionTerminalCase;
 const api=factory(M);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionTerminalBatch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const samples=Object.freeze([
  Object.freeze({id:'G1',name:'良品 · 常规亮度',missing:0,brightness:185}),
  Object.freeze({id:'G2',name:'良品 · 端子较暗',missing:0,brightness:140}),
  Object.freeze({id:'G3',name:'良品 · 3 号可见特征较小',missing:0,brightness:205,small:3}),
  Object.freeze({id:'D1',name:'缺陷 · 3 号缺失',missing:3,brightness:185}),
  Object.freeze({id:'D2',name:'缺陷 · 缺失处有亮斑',missing:3,brightness:185,spot:105}),
  Object.freeze({id:'D3',name:'缺陷 · 4 号缺失',missing:4,brightness:155})
 ]);
 const defaults=Object.freeze({threshold:125,light:0,minArea:1,spotShape:'small',shapeEnabled:false,minWidth:6,minHeight:6,minRatio:1.5});
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function analyze(settings){
  if(!settings)return null;
  const minArea=settings.minArea===undefined?defaults.minArea:settings.minArea;
  const spotShape=settings.spotShape===undefined?defaults.spotShape:settings.spotShape;
  const shapeEnabled=settings.shapeEnabled===undefined?defaults.shapeEnabled:settings.shapeEnabled;
  const minWidth=settings.minWidth===undefined?defaults.minWidth:settings.minWidth;
  const minHeight=settings.minHeight===undefined?defaults.minHeight:settings.minHeight;
  const minRatio=settings.minRatio===undefined?defaults.minRatio:settings.minRatio;
  if(!Number.isInteger(settings.threshold)||settings.threshold<50||settings.threshold>210||!Number.isInteger(settings.light)||settings.light< -40||settings.light>40||!Number.isInteger(minArea)||minArea<1||minArea>700||!['small','square'].includes(spotShape)||typeof shapeEnabled!=='boolean'||!Number.isInteger(minWidth)||minWidth<1||minWidth>25||!Number.isInteger(minHeight)||minHeight<1||minHeight>55||!Number.isFinite(minRatio)||minRatio<.5||minRatio>5)return null;
  const dimensions=c=>({
   area:c.area,width:c.w,height:c.h,ratio:c.h/c.w,
   areaPass:c.area>=minArea,widthPass:!shapeEnabled||c.w>=minWidth,
   heightPass:!shapeEnabled||c.h>=minHeight,ratioPass:!shapeEnabled||c.h/c.w>=minRatio
  });
  const shapePass=c=>{const d=dimensions(c);return d.widthPass&&d.heightPass&&d.ratioPass};
  const results=samples.map(sample=>{
   const brightness=clamp(sample.brightness+settings.light,50,220);
   const s={...M.defaults,missing:sample.missing,noise:false,brightness,threshold:settings.threshold,minArea};
   const gray=M.generate(s),spot=sample.spot===undefined?null:clamp(sample.spot+settings.light,0,255);
   // 该样本预设为良品，仅模拟 3 号端子的可见前景较小，并非现场合格标准。
   if(sample.small!==undefined){
    const slot=M.slots[sample.small-1];
    for(let y=slot.y;y<slot.y+slot.h;y++)for(let x=slot.x;x<slot.x+slot.w;x++)gray[y*M.W+x]=M.BG;
    for(let y=slot.y+22;y<slot.y+38;y++)for(let x=slot.x+11;x<slot.x+19;x++)gray[y*M.W+x]=brightness;
   }
   if(spot!==null){
    const slot=M.slots[sample.missing-1];
    const side=spotShape==='square'?12:6,x0=slot.x+(slot.w-side)/2,y0=spotShape==='square'?slot.y+24:slot.y+26;
    for(let y=y0;y<y0+side;y++)for(let x=x0;x<x0+side;x++)gray[y*M.W+x]=spot;
   }
   const unfiltered=M.analyzeGray({...s,minArea:1},gray);
   const analysis=minArea===1?unfiltered:M.analyzeGray(s,gray);
   const featureAt=id=>{const components=unfiltered.slots[id-1].components;return components.length===1?dimensions(components[0]):null};
   const spotFeature=sample.spot===undefined?null:featureAt(sample.missing);
   const smallFeature=sample.small===undefined?null:featureAt(sample.small);
   const spotArea=spotFeature===null?null:spotFeature.area,smallArea=smallFeature===null?null:smallFeature.area;
   // 新规则先筛面积，再按可选几何条件筛外接框；不读取真实标签。
   const finalSlots=analysis.slots.map(p=>({...p,components:p.components.filter(shapePass)}));
   const finalAmbiguous=analysis.ambiguous.filter(shapePass);
   const finalComponents=analysis.result.components.filter(shapePass);
   const simpleOK=finalAmbiguous.length===0&&finalSlots.every(p=>p.components.length===1);
   const actualOK=sample.missing===0;
   const outcome=actualOK?(simpleOK?'correct':'falseAlarm'):(simpleOK?'miss':'detected');
   return{sample,brightness,spot,spotArea,smallArea,spotFeature,smallFeature,analysis,unfiltered,finalSlots,finalAmbiguous,finalComponents,simpleOK,actualOK,outcome};
  });
  const count=kind=>results.filter(r=>r.outcome===kind).length;
  return{settings:{...settings,minArea,spotShape,shapeEnabled,minWidth,minHeight,minRatio},results,counts:{good:results.filter(r=>r.actualOK).length,defect:results.filter(r=>!r.actualOK).length,correct:count('correct'),detected:count('detected'),falseAlarm:count('falseAlarm'),miss:count('miss'),review:results.filter(r=>r.analysis.status==='review').length}};
 }
 return{samples,defaults,analyze};
});
