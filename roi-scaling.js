(function(root){
 'use strict';
 const M=root.Vision2DBasics;
 const num=n=>{const x=Math.abs(n)<1e-9?0:n;return Number(x.toFixed(3)).toString()};
 const point=p=>`(${num(p.u)}, ${num(p.v)})`;
 function figure(state,result,mode){
  const k=Math.min(220/Math.max(state.width,result.width),140/Math.max(state.height,result.height));
  const left=45,right=455,top=55;
  function grid(x,width,height){let lines='';for(let i=1;i<width;i++)lines+=`<path d="M${x+i*k} ${top}v${height*k}"/>`;for(let j=1;j<height;j++)lines+=`<path d="M${x} ${top+j*k}h${width*k}"/>`;return `<rect x="${x}" y="${top}" width="${width*k}" height="${height*k}" fill="#244b50" stroke="#86dac1" stroke-width="2"/><g stroke="#8caeb0" stroke-opacity=".45" stroke-width=".7">${lines}</g>`;}
  const p=result.point,shift=.5;
  const dots=p?`<circle cx="${left+(result.region.local.u+shift)*k}" cy="${top+(result.region.local.v+shift)*k}" r="5" fill="#ffb774" stroke="#fff" stroke-width="1.2"/><circle cx="${right+(p.scaled.u+shift)*k}" cy="${top+(p.scaled.v+shift)*k}" r="5" fill="#ffb774" stroke="#fff" stroke-width="1.2"/>`:'';
  return `<svg viewBox="0 0 760 245" role="img" aria-label="ROI 局部坐标与缩放后坐标的比例示意"><defs><marker id="roi-scale-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#86ddc0"/></marker></defs><rect width="760" height="245" rx="8" fill="#112638"/><text x="45" y="29" fill="#d2eae4" font-size="14">ROI 局部：${state.width} × ${state.height} px</text><text x="455" y="29" fill="#d2eae4" font-size="14">缩放后：${result.width} × ${result.height} px</text>${grid(left,state.width,state.height)}${grid(right,result.width,result.height)}${dots}<path d="M300 111H404" stroke="#86ddc0" stroke-width="2" marker-end="url(#roi-scale-arrow)"/><text x="301" y="98" fill="#a9c9c9" font-size="12">按 X / Y 比例</text><text x="45" y="224" fill="#98b9c0" font-size="11">网格和圆点仅为坐标示意，不模拟插值或识别</text></svg>`;
 }
 function mount(target,getState){
  let percent=200,mode='origin';
  target.innerHTML=`<section class="roi-scale" aria-labelledby="roi-scale-title"><div class="roi-scale-head"><div><span>EXTENSION / 裁剪后缩放</span><h3 id="roi-scale-title">缩放后的坐标，怎样回到原图？</h3><p>假设 ROI 裁剪后又被缩放，跟着三步还原同一个点。</p></div><span class="roi-scale-tag">坐标模拟</span></div><div class="roi-scale-controls"><label>选择缩放比例<select data-percent><option value="50">缩小到 50%</option><option value="100">保持 100%</option><option value="150">放大到 150%</option><option value="200" selected>放大到 200%</option><option value="300">放大到 300%</option></select></label><label>坐标约定<select data-mode><option value="origin">原点比例（先理解这个）</option><option value="half-pixel">像素中心对齐（半像素）</option></select></label></div><p class="roi-scale-hint">本例先对输出宽高四舍五入，再分别计算实际 X、Y 比例；取整时两个方向可能略有不同。</p><div class="roi-scale-figure" data-figure tabindex="0" role="region" aria-label="缩放坐标示意图，小屏可左右滑动"></div><p class="roi-scale-scroll">← 小屏左右滑动查看完整示意 →</p><div class="roi-scale-sizes" data-sizes></div><div class="roi-scale-results" data-results aria-live="polite"></div><div class="roi-scale-warning" data-warning></div><details class="roi-scale-details"><summary>两种坐标约定有什么区别？</summary><p><strong>原点比例：</strong>缩放后坐标 = ROI 局部坐标 × 比例；还原时直接除以比例。</p><p><strong>像素中心对齐：</strong>缩放后坐标 = (局部坐标 + 0.5) × 比例 − 0.5；还原时用 (缩放后坐标 + 0.5) ÷ 比例 − 0.5。缩小时可能出现接近边界的小数坐标。</p><p>这是两种坐标变换示例；本图不执行实际插值或目标识别。视觉软件可能使用其他规则，且缩放可能改变特征，必须核对其接口和结果。</p><a href="https://onnx.ai/onnx/operators/onnx__Resize.html">参考：ONNX Resize 坐标约定 →</a></details></section>`;
  const q=x=>target.querySelector(x);
  function update(){
   const s=getState(),r=M.resizeRoi(s,percent,mode),p=r.point;
   q('[data-percent]').value=String(percent);q('[data-mode]').value=mode;q('[data-figure]').innerHTML=figure(s,r,mode);
   q('[data-sizes]').innerHTML=`ROI <strong>${s.width} × ${s.height} px</strong> → 输出 <strong>${r.width} × ${r.height} px</strong><br>实际比例：sx = ${r.width} ÷ ${s.width} ≈ <strong>${num(r.sx)}</strong>；sy = ${r.height} ÷ ${s.height} ≈ <strong>${num(r.sy)}</strong>`;
   if(!p){q('[data-results]').innerHTML='<div class="roi-scale-empty"><strong>特征点不在 ROI 内</strong><p>本例不会生成有效的缩放后识别点，也不执行坐标还原。</p></div>';q('[data-warning]').textContent='移动特征点或 ROI，使点进入 ROI 后再观察缩放还原。';return;}
   const calculation=mode==='origin'?`(${num(p.scaled.u)} ÷ sx, ${num(p.scaled.v)} ÷ sy)`:`((${num(p.scaled.u)} + 0.5) ÷ sx − 0.5, (${num(p.scaled.v)} + 0.5) ÷ sy − 0.5)`;
   q('[data-results]').innerHTML=`<div><span>01 · 模拟识别点</span><strong>${point(p.scaled)} px</strong><p>假设缩放后图像中识别到此点。</p></div><div><span>02 · 还原 ROI 局部点</span><strong>${point(p.local)} px</strong><p>${calculation}</p></div><div><span>03 · 加回 ROI 原点</span><strong>${point(p.original)} px</strong><p>${point(p.local)} + (${s.x}, ${s.y})</p></div>`;
   const diff=Math.hypot(p.wrong.u-p.original.u,p.wrong.v-p.original.v);
   q('[data-warning]').textContent=diff<1e-9?'当前条件下，直接加原点与正确结果相同；换个比例或坐标约定再比较。':`如果误把缩放后坐标直接加上 ROI 原点，会得到 ${point(p.wrong)} px。显示数值保留三位小数，内部按完整精度计算。`;
  }
  q('[data-percent]').addEventListener('change',e=>{percent=Number(e.target.value);update()});q('[data-mode]').addEventListener('change',e=>{mode=e.target.value;update()});
  update();return {update,reset(){percent=200;mode='origin';update()}};
 }
 root.VisionRoiScaling={mount};
})(window);
