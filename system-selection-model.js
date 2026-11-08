/* 共享条件下的相机、镜头、照明初选；不对应实际产品型号。 */
(function(root,factory){
 let estimate=root&&root.VisionEstimate,scenarios=root&&root.VisionScenarioModels;
 if(typeof module==='object'&&module.exports){estimate=require('./estimate.js');scenarios=require('./scenario-models.js')}
 const api=factory(estimate,scenarios);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionSystemSelection=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(estimate,scenarios){
 'use strict';
 const lightNames={ring:'环形光',bar:'条形侧光',back:'背光',dark:'低角度光',coax:'同轴光',dome:'穹顶漫射光'};
 const choices={materials:['matte','flat-metal','curved-metal','transparent'],goals:['outline','scratch','text','presence'],backlights:['yes','no','unknown'],colors:['yes','no','unknown'],lenses:['fixed','telecentric']};
 function calculate(input,context){
  const imaging=estimate.selectImaging(input);
  if(!context||!choices.materials.includes(context.material)||!choices.goals.includes(context.goal)||!choices.backlights.includes(context.backlight)||!choices.colors.includes(context.color)||!choices.lenses.includes(context.lens))return {imaging,contextValid:false};
  const base=scenarios.lighting(context.material,context.goal);
  let first=base.first,second=base.second;
  if(context.backlight==='no'){
   if(first==='back')first=second;
   if(second==='back'||second===first)second=null;
  }
  const substituted=base.first!==first;
  const lighting={first,firstName:lightNames[first],second,secondName:second?lightNames[second]:null,
   why:substituted?'背面没有布光空间，先比较'+lightNames[first]+'，再根据实际成像调整角度和布置。':base.why,
   check:context.backlight==='no'&&/背光|背面/.test(base.check)?'背部不可布光；确认光源安装空间、照明范围和特征对比。':base.check,
   backlightNote:context.backlight==='unknown'&&(first==='back'||second==='back')?'使用背光前需先确认工件背面是否有安装空间。':''};
  let camera=null,lens=null;
  if(imaging){
   if(context.lens==='fixed'&&imaging.focal!==null){
    lens={mode:'fixed',focal:imaging.focal,limit:imaging.focalLimit,viewWidth:imaging.actualWidth,viewHeight:imaging.actualHeight};
    camera={pixelsWidth:imaging.pixelsWidth,pixelsHeight:imaging.pixelsHeight,megapixelTier:imaging.megapixelTier,minMegapixels:imaging.minMegapixels,viewWidth:imaging.actualWidth,basis:'fixed'};
   }else if(context.lens==='telecentric'){
    const width=Math.ceil(imaging.neededWidth*input.featurePixels/input.feature),height=Math.ceil(imaging.neededHeight*input.featurePixels/input.feature);
    const maxMagnification=Math.min(input.sensorWidth/imaging.neededWidth,input.sensorHeight/imaging.neededHeight),mp=width*height/1e6;
    if(Number.isSafeInteger(width)&&width>0&&Number.isSafeInteger(height)&&height>0&&Number.isFinite(mp)&&Number.isFinite(maxMagnification)&&maxMagnification>0){
     lens={mode:'telecentric',maxMagnification};
     camera={pixelsWidth:width,pixelsHeight:height,megapixelTier:estimate.pixelTiers.find(n=>n>=mp)??null,minMegapixels:mp,viewWidth:imaging.neededWidth,basis:'minimum-field'};
    }
   }else lens={mode:'fixed',focal:null,limit:imaging.focalLimit};
  }
  const distance=Number.isFinite(context.speed)&&context.speed>=0&&Number.isFinite(context.exposure)&&context.exposure>0?estimate.motion(context.speed,context.exposure):null;
  const motion=distance===null?null:{distance,referencePixels:camera?distance/(camera.viewWidth/camera.pixelsWidth):null};
  return{contextValid:true,imaging,lens,camera,lighting,motion};
 }
 return{calculate,lightNames,choices};
});
