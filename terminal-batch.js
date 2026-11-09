/* 端子多样本阈值与面积实验：模型运算与页面展示分开。 */
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
  target.innerHTML='<section class="project-workspace terminal-batch" aria-labelledby="batch-title">'+
   '<div class="batch-head"><span class="batch-kicker">SAMPLE CHECK / 多样本实验</span><h2 id="batch-title">阈值与面积：看看六个样本</h2><p>先切换条件，再比较原图、二值图和判断。每张图都有预先设定的“良品 / 缺失品”标签，用来核对算法是否判断正确。</p></div>'+
   '<div class="batch-instructions"><span><b>01</b> 选择阈值与面积</span><span><b>02</b> 看候选的保留与过滤</span><span><b>03</b> 对照标签和结果</span></div>'+
   '<div class="batch-controls"><div><strong>一键观察</strong><p class="batch-controls-note">本区参数独立于上面的单张演示，统一应用到下面六张样本。</p><div class="batch-presets" role="group" aria-label="多样本阈值场景">'+presets.map(p=>'<button type="button" data-batch-preset="'+p.id+'" aria-pressed="false">'+p.label+'</button>').join('')+'</div></div>'+
   '<div class="batch-sliders"><label for="batch-threshold"><span>统一阈值 <output data-batch-value="threshold"></output></span><input id="batch-threshold" type="range" min="50" max="210" step="1" data-batch-param="threshold"><small>灰度 ≥ 阈值的像素变白；全部样本使用同一数值。</small></label><label for="batch-area"><span>最小候选面积 <output data-batch-value="minArea"></output></span><input id="batch-area" type="range" min="1" max="700" step="1" data-batch-param="minArea"><small>连通域面积 ≥ 最小面积才参与槽位判断。</small></label><label for="batch-light"><span>前景灰度偏移 <output data-batch-value="light"></output></span><input id="batch-light" type="range" min="-40" max="40" step="1" data-batch-param="light"><small>同时调整端子和亮斑灰度，背景不变；仅为示意。</small></label></div></div>'+
   '<div class="batch-compare" aria-live="polite" data-batch-compare></div><div class="batch-summary" aria-live="polite" data-batch-summary></div><div class="batch-find" data-batch-find></div><p class="batch-rule"><strong>简化规则：</strong>每个固定槽位只要找到一个通过面积筛选的候选就判 OK，不检查候选形状或成像质量。保守示例另加形状与已知合成灰度检查。二值图白色仍是阈值前景；<strong class="batch-key-pass">绿色实框为保留</strong>，<strong class="batch-key-reject">橙色虚框为面积不足而过滤</strong>。</p>'+
   '<div class="batch-grid" data-batch-grid></div><p class="batch-note">图像、标签和亮斑均为合成数据。G3 预设为良品，3 号端子仅模拟可见前景较小；这不代表现场小端子一定合格。误报是良品被简化规则判为 NG；漏检是缺失品被判为 OK。结果与标签一致也可能只是偶然，仍需检查每个槽位的判断原因。保守示例使用形状与已知合成灰度，不能保证发现所有问题。面积是像素数，并非物理尺寸；真实项目需要样本标注、成像验证与独立测试。灰度偏移并不是实际光照的完整模型。</p>'+
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
    const accepted=c.area>=state.minArea;
    ctx.strokeStyle=accepted?'#54d7ad':'#ffb25d';ctx.lineWidth=1.4;ctx.setLineDash(accepted?[]:[2,1]);
    ctx.strokeRect(c.x-1,c.y-1,c.w+2,c.h+2);ctx.setLineDash([]);
   }
   if(r.spot!==null){
    const slot=M.slots[r.sample.missing-1];
    ctx.beginPath();ctx.strokeStyle='#ffb25d';ctx.lineWidth=1.5;ctx.arc(slot.x+14.5,slot.y+28.5,9,0,Math.PI*2);ctx.stroke();
   }
  }
  function update(){
   if(!target.isConnected)return;
   const result=B.analyze(state),c=result.counts;
   const spot=result.results.find(r=>r.sample.id==='D2').spotArea,small=result.results.find(r=>r.sample.id==='G3').smallArea;
   const scale=Math.max(150,state.minArea,spot||0,small||0);
   const compare=(name,area)=>{const pass=area!==null&&area>=state.minArea,explain=area===null?'未形成前景连通域':area+' px² '+(pass?'≥':'<')+' '+state.minArea+' px² → '+(pass?'保留':'过滤');return '<div class="batch-meter"><div><strong>'+name+'</strong><span>'+explain+'</span></div><div class="batch-track" aria-hidden="true"><i style="width:'+(area===null?0:(area/scale*100).toFixed(2))+'%"></i><b style="left:'+Math.min(99.5,state.minArea/scale*100).toFixed(2)+'%"></b></div></div>'};
   q('[data-batch-compare]').innerHTML='<div class="batch-compare-title"><strong>两个候选，同一面积门槛</strong><span>竖线：最小 '+state.minArea+' px²</span></div>'+compare('D2 亮斑',spot)+compare('G3 小特征',small);
   q('[data-batch-summary]').innerHTML='<div><strong>'+c.good+' 张</strong><span>预设良品</span></div><div><strong>'+c.defect+' 张</strong><span>预设缺失品</span></div><div class="'+(c.falseAlarm?'is-alert':'')+'"><strong>'+c.falseAlarm+' 张</strong><span>简化规则误报</span></div><div class="'+(c.miss?'is-alert':'')+'"><strong>'+c.miss+' 张</strong><span>简化规则漏检</span></div><div><strong>'+c.review+' 张</strong><span>保守示例待复核</span></div>';
   const errors=result.results.filter(r=>r.outcome==='miss'||r.outcome==='falseAlarm');
   const ids=[...new Set([...errors.map(r=>r.sample.id),'D2','G3'])];
   q('[data-batch-find]').innerHTML=(errors.length?'查看异常或面积对照：':'当前判断均与标签一致；查看面积对照：')+ids.map(id=>{const r=result.results.find(x=>x.sample.id===id),name=id==='D2'?'D2 亮斑':id==='G3'?'G3 小特征':id,flag=r.outcome==='miss'?' · 漏检':r.outcome==='falseAlarm'?' · 误报':'';return '<button type="button" data-batch-to="'+id+'">'+name+flag+' ↓</button>'}).join(' ');
   const outcomeLabels={correct:'良品判 OK（结果一致）',detected:'缺失品判 NG（结果一致）',falseAlarm:'误报：良品判 NG',miss:'漏检：缺失品判 OK'};
   const safeLabels={ok:'OK',ng:'NG',review:'待复核'};
   q('[data-batch-grid]').innerHTML=result.results.map((r,i)=>{
    const hit=r.analysis.slots.filter(p=>p.components.length===1).length;
    const smallFiltered=r.smallArea!==null&&r.smallArea<state.minArea;
    const spotFiltered=r.spotArea!==null&&r.spotArea<state.minArea;
    const cause=smallFiltered?'3 号小特征面积不足，被过滤。':r.outcome==='miss'?'亮斑被当作槽位候选。':spotFiltered?'亮斑面积不足，被过滤。':r.outcome==='falseAlarm'?(r.brightness<state.threshold?'端子灰度未达到阈值。':'候选未通过当前条件。'):r.sample.spot!==undefined?'观察缺失处的橙圈亮斑。':r.sample.small!==undefined?'3 号可见前景较小。':'比较标签、图像与简化判断。';
    const special=r.sample.small!==undefined?'3 号小特征 '+(r.smallArea===null?'未形成连通域':r.smallArea+' px²'+(smallFiltered?' · 已过滤':' · 保留')):r.sample.spot!==undefined?'亮斑 '+(r.spotArea===null?'未形成连通域':r.spotArea+' px²'+(spotFiltered?' · 已过滤':' · 保留')):'';
    return '<article class="batch-sample" tabindex="-1" data-batch-sample="'+r.sample.id+'"><div class="batch-sample-head"><strong>'+r.sample.id+' · '+r.sample.name+'</strong><span class="batch-truth '+(r.actualOK?'is-good':'is-defect')+'">预设'+(r.actualOK?'良品':'缺失')+'</span></div>'+
     '<div class="batch-images"><figure><figcaption>原图</figcaption><canvas data-batch-image="'+i+'" data-kind="source" aria-label="'+r.sample.name+' 的合成原图"></canvas></figure><figure><figcaption>二值图与面积结果</figcaption><canvas data-batch-image="'+i+'" data-kind="binary" aria-label="'+r.sample.name+' 的阈值二值图和候选面积筛选结果"></canvas></figure></div>'+
     '<p class="batch-image-note">端子灰度 '+r.brightness+(r.spot!==null?' · 亮斑灰度 '+r.spot:'')+' · '+cause+(special?'<br><strong>'+special+'</strong>':'')+'</p>'+
     '<p class="batch-area-count">二值连通域 '+r.analysis.result.allCount+' → 面积筛选后 '+r.analysis.result.acceptedCount+' 个</p>'+
     '<div class="batch-sample-result"><span>简化：'+(r.simpleOK?'OK':'NG')+' <small>（'+hit+' / 5 槽有候选）</small></span><strong class="batch-outcome '+(r.outcome==='miss'||r.outcome==='falseAlarm'?'is-error':'is-correct')+'">'+outcomeLabels[r.outcome]+'</strong><span>保守示例：'+safeLabels[r.analysis.status]+'</span>'+(r.analysis.status==='review'?'<small>'+r.analysis.reason+'</small>':'')+'</div></article>';
   }).join('');
   target.querySelectorAll('[data-batch-image]').forEach(canvas=>{const r=result.results[Number(canvas.dataset.batchImage)];draw(canvas,r,canvas.dataset.kind==='binary')});
   target.querySelectorAll('[data-batch-to]').forEach(el=>el.addEventListener('click',()=>{const sample=q('[data-batch-sample="'+el.dataset.batchTo+'"]');sample.scrollIntoView({behavior:'smooth',block:'start'});sample.focus({preventScroll:true})}));
   target.querySelectorAll('[data-batch-param]').forEach(el=>{const key=el.dataset.batchParam;el.value=state[key];q('[data-batch-value="'+key+'"]').textContent=(key==='light'&&state[key]>0?'+':'')+state[key]+(key==='minArea'?' px²':'')});
   target.querySelectorAll('[data-batch-preset]').forEach(el=>{const p=presets.find(x=>x.id===el.dataset.batchPreset);el.setAttribute('aria-pressed',String(state.threshold===p.threshold&&state.light===p.light&&state.minArea===p.minArea))});
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
  target.querySelectorAll('[data-batch-param]').forEach(el=>el.addEventListener('input',()=>{state[el.dataset.batchParam]=Number(el.value);schedule()}));
  target.querySelectorAll('[data-batch-preset]').forEach(el=>el.addEventListener('click',()=>{const p=presets.find(x=>x.id===el.dataset.batchPreset);state={threshold:p.threshold,light:p.light,minArea:p.minArea};update()}));
  update();
 }
 root.VisionTerminalBatchUI={mount};
})(window);
