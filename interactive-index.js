/* 互动图解的浏览分组；原有图解与知识深链保持不变。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisionInteractiveIndex=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const definitions=[
  {id:'2d',name:'2D 互动图解',nav:'2D 图解',eyebrow:'2D VISION',icon:'2d',tone:'blue',description:'从像素、阈值到双 Mark，观察二维图像中的特征和位置。',categories:['2D 视觉']},
  {id:'3d',name:'3D 互动图解',nav:'3D 图解',eyebrow:'3D VISION',icon:'3d',tone:'purple',description:'从视差、深度图到点云，观察三维信息是怎样形成的。',categories:['3D 视觉']},
  {id:'imaging',name:'成像与光源',nav:'成像与光源',eyebrow:'IMAGING & LIGHT',icon:'camera',tone:'amber',description:'从相机、镜头到照明，理解影响图像的基础因素。',categories:['相机与镜头','镜头与成像','相机与采集','光源与照明']},
  {id:'robot',name:'标定与机器人',nav:'标定与机器人',eyebrow:'CALIBRATION & ROBOT',icon:'target',tone:'green',description:'从像素坐标到机器人位置，查看标定和位姿之间的关系。',categories:['标定与坐标','应用与排查']}
 ];
 const fallback={id:'other',name:'其他互动图解',nav:'其他图解',eyebrow:'OTHER FIGURES',icon:'layers',tone:'green',description:'尚未归入以上主题的互动内容。',categories:[]};
 function sectionFor(demo){return definitions.find(g=>g.categories.includes(demo&&demo.category))||fallback}
 function sections(catalogue){
  const entries=Array.isArray(catalogue)?catalogue:[], result=definitions.map(group=>({...group,items:entries.filter(d=>sectionFor(d).id===group.id)}));
  const other=entries.filter(d=>sectionFor(d).id==='other');if(other.length)result.push({...fallback,items:other});return result;
 }
 function render(target,catalogue,active,helpers){
  const {esc,icon}=helpers,groups=sections(catalogue),selection=active||'overview',selected=groups.find(g=>g.id===selection),total=groups.reduce((n,g)=>n+g.items.length,0);
  const tabs=[{id:'overview',nav:'分类总览',href:'#interactive'},...groups.map(g=>({id:g.id,nav:g.nav,href:'#interactive/'+g.id,count:g.items.length})),{id:'all',nav:'全部图解',href:'#interactive/all',count:total}];
  const navigation=`<nav class="interactive-nav" aria-label="互动图解分类">${tabs.map(t=>`<a href="${esc(t.href)}" ${selection===t.id?'aria-current="page"':''}>${esc(t.nav)}${t.count!==undefined?` <span>${t.count}</span>`:''}</a>`).join('')}</nav>`;
  const card=d=>`<a class="article-card" href="#demo/${encodeURIComponent(d.id)}"><span class="tag">${esc(d.category)} · 可互动</span><h3>${esc(d.title)}</h3><p>${esc(d.desc)}</p><span class="article-foot">打开互动图解 →</span></a>`;
  const list=g=>g.items.length?`<div class="article-grid interactive-grid">${g.items.map(card).join('')}</div>`:'<div class="interactive-empty">这个分类暂时还没有图解。</div>';
  const related2d=`<aside class="interactive-related"><div><span>CONTINUE EXPLORING</span><strong>从单个原理，继续看完整 2D 项目</strong><p>互动图解解释一个知识点；2D 项目展示拍照、处理与输出的完整流程。</p></div><div><a href="#projects">查看 2D 项目 →</a><a href="#image-lab">打开图像实验区 →</a></div></aside>`;
  let body='';
  if(selection==='overview'){
   body=`<div class="interactive-section-head"><div><span>EXPLORE BY TOPIC</span><h2>从感兴趣的主题开始</h2><p>先选分类，再打开具体图解；也可以查看全部内容。</p></div><small>${total} 个互动图解</small></div><div class="interactive-categories">${groups.map((g,i)=>`<a class="interactive-category topic-${esc(g.tone)}" href="#interactive/${esc(g.id)}"><div class="interactive-category-top"><span class="interactive-category-icon">${icon(g.icon)}</span><span>${g.items.length} 个图解</span></div><span class="interactive-category-eyebrow">${esc(g.eyebrow)}</span><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><div class="interactive-examples"><span>包含</span> ${g.items.slice(0,3).map(d=>esc(d.title)).join(' · ')||'暂时没有图解'}</div><strong>查看分类 <span aria-hidden="true">↗</span></strong></a>`).join('')}</div>${related2d}`;
  }else if(selection==='all'){
   body=`<div class="interactive-section-head"><div><span>ALL FIGURES</span><h2>全部互动图解</h2><p>按主题分组显示，不同主题可在上方直接切换。</p></div><small>${total} 个图解</small></div><div class="interactive-topic-list">${groups.map(g=>`<section class="interactive-topic"><div class="interactive-topic-head"><div><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p></div><a href="#interactive/${esc(g.id)}">进入分类 →</a></div>${list(g)}</section>`).join('')}</div>`;
  }else if(selected){
   body=`<div class="interactive-section-head"><div><span>${esc(selected.eyebrow)}</span><h2>${esc(selected.name)}</h2><p>${esc(selected.description)}</p></div><small>${selected.items.length} 个图解</small></div>${list(selected)}${selection==='2d'?related2d:''}`;
  }else body='<div class="interactive-empty"><strong>没有找到这个分类</strong><p>可以返回分类总览，重新选择感兴趣的主题。</p><a href="#interactive">返回分类总览 →</a></div>';
  target.innerHTML=`<div class="wrap interactive-page"><div class="page-head"><div class="eyebrow">INTERACTIVE FIGURES</div><h1>互动图解</h1><p>选一个主题，动手调整参数，把视觉原理看清楚。</p></div>${navigation}${body}</div>`;
 }
 return {definitions,sectionFor,sections,render};
});
