/* 端子多样本阈值、面积与几何实验：模型运算与页面展示分开。 */
(function(root){
 'use strict';
 const M=root.VisionTerminalCase,B=root.VisionTerminalBatch;
 function mount(target){
  if(!target)return;
  let state={...B.defaults},pending=false;
  const presets=[
   {id:'baseline',label:'对照参数',threshold:125,light:0,minArea:1},
   {id:'low',label:'低阈值：亮斑混入',threshold:90,light:0,minArea:1},
   {id:'area-fit',label:'面积适中：去亮斑',threshold:90,light:0,minArea:50},
   {id:'area-large',label:'面积过大：误过滤',threshold:90,light:0,minArea:129},
   {id:'high',label:'高阈值：暗端子消失',threshold:165,light:0,minArea:1},
   {id:'dark',label:'前景变暗',threshold:125,light:-30,minArea:1}
  ];
  const shapePresets=[
   {id:'shape-area',label:'① 仅面积：方斑通过',threshold:90,light:0,minArea:50,spotShape:'square',shapeEnabled:false},
   {id:'shape-fit',label:'② 加几何：排除方斑',threshold:90,light:0,minArea:50,spotShape:'square',shapeEnabled:true},
   {id:'shape-strict',label:'③ 比值过严：误过滤',threshold:90,light:0,minArea:50,spotShape:'square',shapeEnabled:true,minRatio:2.5}
  ];
  target.innerHTML='<section class="project-workspace terminal-batch" aria-labelledby="batch-title">'+
   '<div class="batch-head"><span class="batch-kicker">SAMPLE CHECK / 多样本实验</span><h2 id="batch-title">阈值、面积与形状：看看六个样本</h2><p>先切换条件，再比较原图、二值图和判断。每张图都有预先设定的“良品 / 缺失品”标签，用来核对算法是否判断正确。</p></div>'+
   '<div class="batch-instructions"><span><b>01</b> 选择阈值与面积</span><span><b>02</b> 可选几何筛选</span><span><b>03</b> 对照标签和结果</span></div>'+
   '<div class="batch-controls"><div><strong>一键观察</strong><p class="batch-controls-note">本区参数独立于上面的单张演示，统一应用到下面六张样本。</p><div class="batch-presets" role="group" aria-label="多样本阈值场景">'+presets.map(p=>'<button type="button" data-batch-preset="'+p.id+'" aria-pressed="false">'+p.label+'</button>').join('')+'</div></div>'+
   '<div class="batch-sliders"><label for="batch-threshold"><span>统一阈值 <output data-batch-value="threshold"></output></span><input id="batch-threshold" type="range" min="50" max="210" step="1" data-batch-param="threshold"><small>灰度 ≥ 阈值的像素变白；全部样本使用同一数值。</small></label><label for="batch-area"><span>最小候选面积 <output data-batch-value="minArea"></output></span><input id="batch-area" type="range" min="1" max="700" step="1" data-batch-param="minArea"><small>连通域面积 ≥ 最小面积才参与槽位判断。</small></label><label for="batch-light"><span>前景灰度偏移 <output data-batch-value="light"></output></span><input id="batch-light" type="range" min="-40" max="40" step="1" data-batch-param="light"><small>同时调整端子和亮斑灰度，背景不变；仅为示意。</small></label></div></div>'+
   '<div class="batch-geometry"><div class="batch-geometry-heading"><strong>再看形状：面积相近也可能是干扰</strong><p>依次点三个按钮，观察方形亮斑与细长特征。宽、高取图像外接框，高宽比 = 高 ÷ 宽。</p></div><div class="batch-presets" role="group" aria-label="几何筛选对比">'+shapePresets.map(p=>'<button type="button" data-batch-preset="'+p.id+'" aria-pressed="false">'+p.label+'</button>').join('')+'</div><div class="batch-geometry-options"><label class="batch-spot-select" for="batch-spot">缺失处的模拟干扰<select id="batch-spot" data-batch-param="spotShape"><option value="small">小亮斑 6 × 6 px</option><option value="square">方形亮斑 12 × 12 px</option></select></label><label class="batch-geometry-switch"><input type="checkbox" data-batch-param="shapeEnabled">启用宽、高和高宽比筛选</label></div><div class="batch-sliders batch-geometry-sliders"><label for="batch-width"><span>最小宽度 <output data-batch-value="minWidth"></output></span><input id="batch-width" type="range" min="1" max="25" step="1" data-batch-param="minWidth"><small>候选外接框宽度至少达到此值。</small></label><label for="batch-height"><span>最小高度 <output data-batch-value="minHeight"></output></span><input id="batch-height" type="range" min="1" max="55" step="1" data-batch-param="minHeight"><small>候选外接框高度至少达到此值。</small></label><label for="batch-ratio"><span>最小高宽比 <output data-batch-value="minRatio"></output></span><input id="batch-ratio" type="range" min="0.5" max="5" step="0.1" data-batch-param="minRatio"><small>候选的高 ÷ 宽至少达到此值。</small></label></div><p class="batch-geometry-note">仅在启用时应用；图像或工件旋转可能改变轴对齐外接框的宽、高和比值。 <a href="#demo/bounding-box-rotation">互动：旋转后外接框会怎样？→</a></p></div>'+
   '<div class="batch-compare" aria-live="polite" data-batch-compare></div><div class="batch-shape-compare" aria-live="polite" data-batch-shape-compare></div><div class="batch-summary" aria-live="polite" data-batch-summary></div><div class="batch-find" data-batch-find></div><p class="batch-rule"><strong>简化规则：</strong>每个固定槽位只要找到一个通过面积和已启用几何条件的候选就判 OK，未检查真实工件和成像质量。原案例对照独立计算，不应用新几何条件。二值白色是阈值前景；<strong class="batch-key-pass">绿色实框为保留</strong>，<strong class="batch-key-reject">橙色虚框为面积过滤</strong>，<strong class="batch-key-shape">紫色虚框为几何过滤</strong>。</p>'+
   '<div class="batch-grid" data-batch-grid></div><p class="batch-note">图像、标签和亮斑均为合成数据。G3 预设为良品，3 号端子仅模拟可见前景较小；这不代表现场小端子一定合格。误报是良品被简化规则判为 NG；漏检是缺失品被判为 OK。结果与标签一致也可能只是偶然，仍需检查每个槽位的判断原因。原案例对照使用形状与已知合成灰度，不能保证发现所有问题。面积和宽高均以像素为单位，并非物理尺寸；图像旋转会改变轴对齐外接框。真实项目需要样本标注、成像验证与独立测试。</p>'+
   '<p class="batch-reference">相关知识：<a href="#article/2d-threshold">灰度、阈值与形态学</a> · <a href="https://docs.opencv.org/4.13.0/d3/dc0/group__imgproc__shape.html" target="_blank" rel="noopener noreferrer">OpenCV 连通域面积说明</a></p></section>';
  const q=selector=>target.querySelector(selector);
  function draw(canvas,r,binary){
   canvas.width=M.W;canvas.height=M.H;
   const ctx=canvas.getContext('2d'),image=ctx.createImageData(M.W,M.H),pixels=binary?r.analysis.result.thresholdMask:r.analysis.gray;
   for(let i=0;i<M.W*M.H;i++){
    const v=binary?(pixels[i]?255:0):pixels[i],k=i*4;
    image.data[k]=image.data[k+1]=image.data[k+2]=v;image.data[k+3]=255;
   }
   ctx.putImageData(image,0,0);
   if(binary)for(const c of r.unfiltered.result.components){
    const areaPass=c.area>=state.minArea,accepted=r.finalComponents.some(x=>x.id===c.id);
    ctx.strokeStyle=accepted?'#54d7ad':areaPass?'#dc8bff':'#ffb25d';ctx.lineWidth=1.8;ctx.setLineDash(accepted?[]:[3,1]);
    ctx.strokeRect(c.x-1,c.y-1,c.w+2,c.h+2);ctx.setLineDash([]);
   }
   if(!binary&&r.spot!==null){
    const slot=M.slots[r.sample.missing-1];
    ctx.beginPath();ctx.strokeStyle='#ffb25d';ctx.lineWidth=1.5;ctx.arc(slot.x+14.5,slot.y+(state.spotShape==='square'?29.5:28.5),state.spotShape==='square'?11:9,0,Math.PI*2);ctx.stroke();
   }
  }
  function update(){
   if(!target.isConnected)return;
   const result=B.analyze(state),c=result.counts;
   const spot=result.results.find(r=>r.sample.id==='D2').spotArea,small=result.results.find(r=>r.sample.id==='G3').smallArea;
   const scale=Math.max(150,state.minArea,spot||0,small||0);
   const compare=(name,area)=>{const pass=area!==null&&area>=state.minArea,explain=area===null?'未形成前景连通域':area+' px² '+(pass?'≥':'<')+' '+state.minArea+' px² → '+(pass?'面积通过':'面积过滤');return '<div class="batch-meter"><div><strong>'+name+'</strong><span>'+explain+'</span></div><div class="batch-track" aria-hidden="true"><i style="width:'+(area===null?0:(area/scale*100).toFixed(2))+'%"></i><b style="left:'+Math.min(99.5,state.minArea/scale*100).toFixed(2)+'%"></b></div></div>'};
   q('[data-batch-compare]').innerHTML='<div class="batch-compare-title"><strong>第一关：同一面积门槛</strong><span>竖线：最小 '+state.minArea+' px²</span></div>'+compare('D2 亮斑',spot)+compare('G3 小特征',small);
   const compareShape=(name,f)=>{
    if(!f)return '<div class="batch-shape-row"><strong>'+name+'</strong><span>未形成前景连通域，无法计算宽高比。</span></div>';
    const status=!f.areaPass?'面积已过滤':!state.shapeEnabled?'几何未启用':f.widthPass&&f.heightPass&&f.ratioPass?'几何通过':'几何过滤';
    const checks=!state.shapeEnabled?'几何条件未启用':(f.widthPass?'✓':'✕')+' 宽 ≥ '+state.minWidth+'　'+(f.heightPass?'✓':'✕')+' 高 ≥ '+state.minHeight+'　'+(f.ratioPass?'✓':'✕')+' 高宽比 ≥ '+state.minRatio.toFixed(1);
    return '<div class="batch-shape-row"><strong>'+name+' · '+status+'</strong><span>宽 '+f.width+' × 高 '+f.height+' px；高 ÷ 宽 = '+f.ratio.toFixed(2)+'</span><small>'+checks+'</small></div>';
   };
   const spotFeature=result.results.find(r=>r.sample.id==='D2').spotFeature,smallFeature=result.results.find(r=>r.sample.id==='G3').smallFeature;
   q('[data-batch-shape-compare]').innerHTML='<div class="batch-compare-title"><strong>第二关：外接框几何</strong><span>'+(state.shapeEnabled?'已启用：所有条件同时满足':'未启用：此处只显示测量值')+'</span></div>'+compareShape('D2 亮斑',spotFeature)+compareShape('G3 小特征',smallFeature);
   q('[data-batch-summary]').innerHTML='<div><strong>'+c.good+' 张</strong><span>预设良品</span></div><div><strong>'+c.defect+' 张</strong><span>预设缺失品</span></div><div class="'+(c.falseAlarm?'is-alert':'')+'"><strong>'+c.falseAlarm+' 张</strong><span>简化规则误报</span></div><div class="'+(c.miss?'is-alert':'')+'"><strong>'+c.miss+' 张</strong><span>简化规则漏检</span></div><div><strong>'+c.review+' 张</strong><span>原案例待复核</span></div>';
   const errors=result.results.filter(r=>r.outcome==='miss'||r.outcome==='falseAlarm');
   const ids=[...new Set([...errors.map(r=>r.sample.id),'D2','G3'])];
   q('[data-batch-find]').innerHTML=(errors.length?'查看异常或面积对照：':'当前判断均与标签一致；查看面积对照：')+ids.map(id=>{const r=result.results.find(x=>x.sample.id===id),name=id==='D2'?'D2 亮斑':id==='G3'?'G3 小特征':id,flag=r.outcome==='miss'?' · 漏检':r.outcome==='falseAlarm'?' · 误报':'';return '<button type="button" data-batch-to="'+id+'">'+name+flag+' ↓</button>'}).join(' ');
   const outcomeLabels={correct:'良品判 OK（结果一致）',detected:'缺失品判 NG（结果一致）',falseAlarm:'误报：良品判 NG',miss:'漏检：缺失品判 OK'};
   const safeLabels={ok:'OK',ng:'NG',review:'待复核'};
   function rejection(f){
    if(!f)return '';
    if(!f.areaPass)return '面积不足';
    if(!state.shapeEnabled)return '';
    const reasons=[];if(!f.widthPass)reasons.push('宽度不足');if(!f.heightPass)reasons.push('高度不足');if(!f.ratioPass)reasons.push('高宽比不足');
    return reasons.join('、');
   }
   q('[data-batch-grid]').innerHTML=result.results.map((r,i)=>{
    const hit=r.finalSlots.filter(p=>p.components.length===1).length;
    const smallReason=rejection(r.smallFeature),spotReason=rejection(r.spotFeature);
    const cause=smallReason?'3 号小特征'+smallReason+'，被过滤。':r.outcome==='miss'?'亮斑被当作槽位候选。':spotReason?'亮斑'+spotReason+'，被过滤。':r.outcome==='falseAlarm'?(r.brightness<state.threshold?'端子灰度未达到阈值。':'候选未通过当前条件。'):r.sample.spot!==undefined?'观察缺失处的橙圈亮斑。':r.sample.small!==undefined?'3 号可见前景较小。':'比较标签、图像与简化判断。';
    const feature=r.sample.small!==undefined?r.smallFeature:r.sample.spot!==undefined?r.spotFeature:null,featureName=r.sample.small!==undefined?'3 号小特征':'亮斑',reason=rejection(feature);
    const special=r.sample.small===undefined&&r.sample.spot===undefined?'':feature?featureName+'：'+feature.area+' px²，宽 '+feature.width+' × 高 '+feature.height+' px，高宽比 '+feature.ratio.toFixed(2)+' · '+(reason?'已过滤（'+reason+'）':'保留'):featureName+'：未形成连通域';
    return '<article class="batch-sample" tabindex="-1" data-batch-sample="'+r.sample.id+'"><div class="batch-sample-head"><strong>'+r.sample.id+' · '+r.sample.name+'</strong><span class="batch-truth '+(r.actualOK?'is-good':'is-defect')+'">预设'+(r.actualOK?'良品':'缺失')+'</span></div>'+
     '<div class="batch-images"><figure><figcaption>原图</figcaption><canvas data-batch-image="'+i+'" data-kind="source" aria-label="'+r.sample.name+' 的合成原图"></canvas></figure><figure><figcaption>二值图与筛选结果</figcaption><canvas data-batch-image="'+i+'" data-kind="binary" aria-label="'+r.sample.name+' 的阈值二值图与候选筛选结果"></canvas></figure></div>'+
     '<p class="batch-image-note">端子灰度 '+r.brightness+(r.spot!==null?' · 亮斑灰度 '+r.spot:'')+' · '+cause+(special?'<br><strong>'+special+'</strong>':'')+'</p>'+
     '<p class="batch-area-count">二值连通域 '+r.analysis.result.allCount+' → 面积后 '+r.analysis.result.acceptedCount+' → '+(state.shapeEnabled?'几何后 '+r.finalComponents.length:'几何未启用')+'</p>'+
     '<div class="batch-sample-result"><span>简化：'+(r.simpleOK?'OK':'NG')+' <small>（'+hit+' / 5 槽有候选）</small></span><strong class="batch-outcome '+(r.outcome==='miss'||r.outcome==='falseAlarm'?'is-error':'is-correct')+'">'+outcomeLabels[r.outcome]+'</strong><span>原案例对照（未用新几何条件）：'+safeLabels[r.analysis.status]+'</span>'+(r.analysis.status==='review'?'<small>'+r.analysis.reason+'</small>':'')+'</div></article>';
   }).join('');
   target.querySelectorAll('[data-batch-image]').forEach(canvas=>{const r=result.results[Number(canvas.dataset.batchImage)];draw(canvas,r,canvas.dataset.kind==='binary')});
   target.querySelectorAll('[data-batch-to]').forEach(el=>el.addEventListener('click',()=>{const sample=q('[data-batch-sample="'+el.dataset.batchTo+'"]');sample.scrollIntoView({behavior:'smooth',block:'start'});sample.focus({preventScroll:true})}));
   target.querySelectorAll('[data-batch-param]').forEach(el=>{
    const key=el.dataset.batchParam;if(key==='shapeEnabled')el.checked=state[key];else el.value=state[key];
    if(['minWidth','minHeight','minRatio'].includes(key))el.disabled=!state.shapeEnabled;
    const out=q('[data-batch-value="'+key+'"]');if(out)out.textContent=(key==='light'&&state[key]>0?'+':'')+(key==='minRatio'?state[key].toFixed(1):state[key])+(key==='minArea'?' px²':['minWidth','minHeight'].includes(key)?' px':'');
   });
   target.querySelectorAll('[data-batch-preset]').forEach(el=>{const p=[...presets,...shapePresets].find(x=>x.id===el.dataset.batchPreset),expected={...B.defaults,...p};el.setAttribute('aria-pressed',String(Object.keys(B.defaults).every(k=>state[k]===expected[k])))});
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
  target.querySelectorAll('[data-batch-param]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.batchParam;state[key]=key==='shapeEnabled'?el.checked:key==='spotShape'?el.value:Number(el.value);schedule()}));
  target.querySelectorAll('[data-batch-preset]').forEach(el=>el.addEventListener('click',()=>{const p=[...presets,...shapePresets].find(x=>x.id===el.dataset.batchPreset);state={...B.defaults,...p};delete state.id;delete state.label;update()}));
  update();
 }
 root.VisionTerminalBatchUI={mount};
})(window);
