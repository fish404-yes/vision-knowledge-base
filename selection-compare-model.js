/* 相同工况下的两套成像候选方案。数值只是一阶近似，不代表真实设备能力。 */
(function(root,factory){
 let scenarios=root&&root.VisionScenarioModels;
 if(typeof module==='object'&&module.exports)scenarios=require('./scenario-models.js');
 const api=factory(scenarios);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VisionCompareModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(scenarios){
 'use strict';
 const lights={ring:'环形光',bar:'条形侧光',back:'背光',dark:'低角度光',coax:'同轴光',dome:'穹顶漫射光'};
 const positive=n=>Number.isFinite(n)&&n>0;
 function sharedProblem(shared,limit){
  const v=shared&&shared.values,c=shared&&shared.context;
  if(!v||!c||![v.width,v.height,v.distance,v.feature,v.featurePixels].every(positive)||!Number.isFinite(v.margin)||v.margin<0||v.margin>200||!Number.isFinite(c.speed)||c.speed<0||!positive(limit))
   return '请先检查上方共同工况及位移参考值。';
  if(!['yes','no','unknown'].includes(c.backlight)||!['yes','no','unknown'].includes(c.color))return '请选择有效的共同检测条件。';
  const lighting=scenarios.lighting(c.material,c.goal);
  if(!lighting)return '请选择有效的工件表面与检测特征。';
  return '';
 }
 function calculate(shared,plan,limit){
  const problem=sharedProblem(shared,limit);if(problem)return {valid:false,error:problem};
  const v=shared.values,c=shared.context,lighting=scenarios.lighting(c.material,c.goal);
  if(!plan||!['fixed','telecentric'].includes(plan.mode)||!Object.hasOwn(lights,plan.light)||!['mono','color','unknown'].includes(plan.cameraColor)||
    ![plan.sensorWidth,plan.sensorHeight,plan.optic,plan.exposure].every(positive)||
    ![plan.pixelsWidth,plan.pixelsHeight].every(n=>Number.isSafeInteger(n)&&n>0))
   return {valid:false,error:'请检查此方案的传感器、正整数像素、镜头及曝光参数。'};
  const neededWidth=v.width*(1+v.margin/100),neededHeight=v.height*(1+v.margin/100);
  const viewWidth=plan.mode==='fixed'?v.distance*plan.sensorWidth/plan.optic:plan.sensorWidth/plan.optic;
  const viewHeight=plan.mode==='fixed'?v.distance*plan.sensorHeight/plan.optic:plan.sensorHeight/plan.optic;
  const spacingX=viewWidth/plan.pixelsWidth,spacingY=viewHeight/plan.pixelsHeight;
  const featureX=v.feature/spacingX,featureY=v.feature/spacingY,move=c.speed*plan.exposure/1000;
  const blurX=move/spacingX,blurY=move/spacingY,mp=plan.pixelsWidth*plan.pixelsHeight/1e6;
  if(![neededWidth,neededHeight,viewWidth,viewHeight,spacingX,spacingY,featureX,featureY,mp].every(positive)||![move,blurX,blurY].every(n=>Number.isFinite(n)&&n>=0))
   return {valid:false,error:'输入超出可计算范围，请调整参数。'};
  const pitchX=plan.sensorWidth/plan.pixelsWidth,pitchY=plan.sensorHeight/plan.pixelsHeight;
  return {valid:true,neededWidth,neededHeight,viewWidth,viewHeight,spacingX,spacingY,featureX,featureY,move,blurX,blurY,mp,
   covered:viewWidth>=neededWidth*(1-1e-12)&&viewHeight>=neededHeight*(1-1e-12),
   sampled:Math.min(featureX,featureY)>=v.featurePixels*(1-1e-12),
   withinMotion:Math.max(blurX,blurY)<=limit*(1+1e-12),
   lightBlocked:plan.light==='back'&&c.backlight==='no',
   lightUnknown:plan.light==='back'&&c.backlight==='unknown',
   colorConcern:c.color==='yes'&&plan.cameraColor!=='color',
   aspectMismatch:Math.abs(pitchX/pitchY-1)>0.03,
   suggestedLight:lighting.first,alternativeLight:lighting.second};
 }
 return {calculate,sharedProblem,lights};
});
