(function(root){
'use strict';
const defaults={width:300,height:251,margin:10,distance:500,feature:1,featurePixels:5,sensorWidth:8.45,sensorHeight:7.07};
const fields=[
 {id:'width',label:'目标宽度',unit:'mm',min:0}, {id:'height',label:'目标高度',unit:'mm',min:0},
 {id:'margin',label:'视野余量',unit:'%',min:0,max:200}, {id:'distance',label:'工作距离',unit:'mm',min:0},
 {id:'feature',label:'最小特征尺寸',unit:'mm',min:0,help:'工件上需要识别的最小细节尺寸，例如 1 mm 的缺口宽度。'},
 {id:'featurePixels',label:'特征期望像素数',unit:'px',min:0,help:'希望最小细节在图像中至少占多少像素，例如 8 px；实际需求应结合样件确认。'},
 {id:'sensorWidth',label:'传感器有效宽度',unit:'mm',min:0,help:'相机实际使用的感光区域的水平物理宽度，可查相机规格书。'},
 {id:'sensorHeight',label:'传感器有效高度',unit:'mm',min:0,help:'同一感光区域的垂直物理高度，应与宽度对应同一相机和成像区域。'}
];
const fmt=(n,d=1)=>Number(n).toFixed(d);
const whole=n=>Number(n).toLocaleString('zh-CN');
function input(field){const helpId=`select-${field.id}-help`;return `<div class="selector-field"><label for="select-${field.id}"><span>${field.label} <small>（${field.unit}）</small></span></label><input id="select-${field.id}" data-select="${field.id}" type="number" inputmode="decimal" step="any" min="${field.min}" ${field.max!==undefined?`max="${field.max}"`:''} value="${defaults[field.id]}" ${field.help?`aria-describedby="${helpId}"`:''}>${field.help?`<p id="${helpId}" class="selector-field-help">${field.help}</p>`:''}</div>`}
function graphic(result,values){
 const ok=Boolean(result&&result.focal),height=ok?Math.max(60,Math.min(130,70+result.verticalAngle*1.7)):95;
 const top=190-height,bottom=190+height;
 const fov=ok?`${fmt(result.actualWidth)} × ${fmt(result.actualHeight)} mm`:'等待有效输入';
 const dist=Number.isFinite(values.distance)&&values.distance>0?`${fmt(values.distance,0)} mm`:'—';
 const angle=ok?`${fmt(result.horizontalAngle)}° / ${fmt(result.verticalAngle)}°`:'—';
 return `<svg class="selector-svg" viewBox="0 0 840 385" role="img" aria-label="相机、镜头、视野和工作距离的示意图"><defs><marker id="sel-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#458c7a"/></marker><pattern id="sel-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#c1d9ce" stroke-opacity=".45"/></pattern></defs>
 <rect width="840" height="385" rx="12" class="selector-svg-bg"/><rect width="840" height="385" rx="12" fill="url(#sel-grid)"/>
 <path d="M240 190L630 ${top}L630 ${bottom}Z" fill="#e8ac6f" fill-opacity=".19" stroke="#e1a264" stroke-width="2"/>
 <path d="M240 190H630" stroke="#d59257" stroke-width="1.5" stroke-dasharray="6 5"/>
 <path d="M630 ${top}L704 ${top+26}V${bottom+26}L630 ${bottom}Z" fill="#577990" fill-opacity=".82" stroke="#93b8c3" stroke-width="2"/>
 <path d="M667 ${top+35}V${bottom-9} M642 190L691 206" stroke="#c0d5d7" stroke-dasharray="4 5"/>
 <rect x="80" y="139" width="125" height="102" rx="12" fill="#284d4b"/><rect x="90" y="149" width="104" height="82" rx="7" fill="#1a3839" stroke="#598478"/>
 <text x="108" y="196" fill="#c5e2d3" font-size="14" font-weight="700">相机</text><rect x="202" y="155" width="28" height="70" rx="5" fill="#426c64"/><rect x="227" y="162" width="17" height="56" rx="4" fill="#61887a"/><path d="M213 160V220 M220 160V220" stroke="#7da493"/>
 <text x="86" y="124" class="selector-svg-text" font-size="13">传感器 + 镜头</text><text x="301" y="105" class="selector-svg-muted" font-size="13">视野角（水平 / 垂直）</text><text x="301" y="127" class="selector-svg-accent" font-size="17" font-weight="700">${angle}</text>
 <path d="M240 318H630" stroke="#458c7a" stroke-width="2" marker-start="url(#sel-arrow)" marker-end="url(#sel-arrow)"/><path d="M240 302V331 M630 302V331" stroke="#458c7a" stroke-width="1.5"/><text x="347" y="347" class="selector-svg-text" font-size="14">工作距离约 ${dist}</text>
 <text x="548" y="35" class="selector-svg-muted" font-size="13">推荐焦距下的预测视野</text><text x="548" y="58" class="selector-svg-accent" font-size="17" font-weight="700">${fov}</text>
 <text x="21" y="369" class="selector-svg-muted" font-size="11">图形示意 · 非按实际尺寸比例绘制</text></svg>`;
}
function summary(r){
 if(!r)return '<div class="selector-error" role="alert">请输入有效数值：目标、距离、特征、传感器尺寸和像素数需大于 0；视野余量为 0～200%。</div>';
 if(r.focal===null)return `<div class="selector-error" role="status">按当前条件，焦距应不大于约 <strong>${fmt(r.focalLimit,2)} mm</strong>，超出本页面列举的焦距范围。请调整条件或核对其他镜头；确定实际视野后再估算相机像素。</div>`;
 const tier=r.megapixelTier?`从 ${whole(Math.round(r.megapixelTier*100))} 万像素档起核对`:'超出示例像素档位';
 return `<div class="selector-result-grid"><article class="selector-result-card"><span>01 · 所需拍摄范围</span><h3>建议视野</h3><strong>${fmt(r.neededWidth)} × ${fmt(r.neededHeight)} <small>mm</small></strong><p>已包含输入的视野余量。所选焦距下预测视野约 ${fmt(r.actualWidth)} × ${fmt(r.actualHeight)} mm。</p></article>
 <article class="selector-result-card selector-result-lens"><span>02 · 镜头初选</span><h3>可先查看</h3><strong>${fmt(r.focal,r.focal%1?1:0)} <small>mm 定焦镜头</small></strong><p>理论焦距上限约 ${fmt(r.focalLimit,2)} mm；示例选择不超过上限的常见焦距。</p></article>
 <article class="selector-result-card selector-result-camera"><span>03 · 相机初选</span><h3>${tier}</h3><strong>≥ ${whole(r.pixelsWidth)} × ${whole(r.pixelsHeight)} <small>px</small></strong><p>按预测视野和期望特征像素数计算。理论下限约 ${fmt(r.minMegapixels*100,1)} 万像素；须同时满足宽、高像素。</p></article></div>`;
}
function mount(target){
 if(!target)return;
 target.innerHTML=`<section class="selector-card" aria-labelledby="selector-title"><div class="selector-heading"><div><span class="tag">相机与镜头 · 初步估算</span><h2 id="selector-title">输入工作条件，查看选型建议</h2><p>参数改变后，图示和建议同步更新。先估算，再按设备资料和样件确认。</p></div><button type="button" class="selector-reset">恢复示例</button></div>
 <div class="selector-layout"><div class="selector-visual"><div class="selector-visual-top"><span>成像关系</span><span>普通定焦镜头 · 一阶示意</span></div><div class="selector-drawing" tabindex="0" role="region" aria-label="视野示意图，小屏幕可左右滚动"></div><p>先确定拍摄范围和工作距离，再估算传感器、镜头和像素。</p></div>
 <div class="selector-form"><div class="selector-group-title"><b>01</b> 拍摄范围</div><div class="selector-fields">${fields.slice(0,4).map(input).join('')}</div><p class="selector-hint">余量同时加在宽、高上，例如 10% 表示每个方向乘以 1.1。目标旋转或位置变化所需的额外范围应自行计入。</p><div class="selector-group-title"><b>02</b> 成像要求</div><div class="selector-fields selector-imaging-fields">${fields.slice(4).map(input).join('')}</div><p class="selector-hint">特征像素数是采样目标，不等于测量精度。ROI 可能改变使用的感光区域；缩放可能改变输出像素数。</p></div></div>
 <div class="selector-result-head"><div><span class="eyebrow">ESTIMATE RESULT</span><h2>初步选型建议</h2></div><p>以输入的传感器有效尺寸为前提</p></div><div class="selector-results" aria-live="polite"></div>
 <div class="selector-notice">像素档位只是查找起点：具体相机须同时满足宽、高有效像素，并匹配上方传感器有效尺寸及比例。实际还需核对镜头像场、接口、最近工作距离、畸变、景深、光照和拍样效果；每像素尺寸不等于测量精度。</div>
 <details class="selector-details"><summary>查看估算方法和适用范围</summary><p>需要的视野 = 目标尺寸 ×（1 + 视野余量）。理论焦距上限取水平、垂直两个方向中较小值：f ≈ 工作距离 × 传感器有效尺寸 / 对应视野尺寸。选取示例焦距后，再根据预测视野 ÷ 最小特征尺寸 × 目标特征像素数，分别向上取整得到宽、高像素下限。</p><p>这是普通定焦镜头的针孔近似：忽略主平面位置、对焦和畸变，不适用于直接计算远心镜头。不同相机的实际传感器尺寸、ROI、缩放会改变结果。<a href="https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-focal-length-and-field-of-view">参考：Edmund Optics 焦距与视野</a> · <a href="https://www.baslerweb.com/en-in/lenses/c-mount/">参考：Basler 镜头选型条件</a></p></details></section>`;
 const inputs=[...target.querySelectorAll('[data-select]')];
 function update(){const values={};inputs.forEach(e=>{values[e.dataset.select]=e.value.trim()===''?NaN:Number(e.value)});const result=root.VisionEstimate.selectImaging(values);target.querySelector('.selector-drawing').innerHTML=graphic(result,values);target.querySelector('.selector-results').innerHTML=summary(result)}
 inputs.forEach(e=>e.addEventListener('input',update));target.querySelector('.selector-reset').addEventListener('click',()=>{inputs.forEach(e=>{e.value=defaults[e.dataset.select]});update()});update();
}
root.VisionSelection={mount};
})(window);
