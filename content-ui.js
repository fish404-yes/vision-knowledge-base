(function(root){
 'use strict';
 const search=root.VisionSiteSearch;
 const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const label=id=>search.groups.find(g=>g[0]===id)?.[1]||'相关内容';
 function connections(index,key,exclude){
  const ignored=new Set(exclude||[]),items=search.related(index,key,12).filter(x=>!ignored.has(x.entry.key)).slice(0,5);
  if(!items.length)return '';
  return '<section class="content-connections" aria-label="相关内容"><div class="connections-head"><div><span>CONNECTED KNOWLEDGE</span><h2>相关内容，一起看</h2></div><p>按共同主题关联</p></div><div class="connections-grid">'+items.map(x=>'<a href="'+esc(x.entry.href)+'"><span>'+esc(label(x.entry.group))+'</span><strong>'+esc(x.entry.title)+'</strong><small>'+esc(x.reason||'相关内容')+' →</small></a>').join('')+'</div></section>';
 }
 function mountSearch(target,ctx,query,type){
  const q=String(query||''),all=search.search(ctx.index,q),total=all.reduce((n,g)=>n+g.items.length,0);
  const selected=type==='all'||search.groups.some(g=>g[0]===type)?type:'all',visible=selected==='all'?all:all.filter(g=>g.id===selected),shown=visible.reduce((n,g)=>n+g.items.length,0);
  const opts=[['all','全部',total],...search.groups.map(([id,name])=>[id,name,(all.find(g=>g.id===id)||{items:[]}).items.length])];
  const tabs=opts.map(([id,name,n])=>'<a href="#search?q='+encodeURIComponent(q)+(id==='all'?'':'&amp;type='+encodeURIComponent(id))+'" '+(id===selected?'aria-current="page"':'')+'>'+esc(name)+' <span>'+n+'</span></a>').join('');
  const cards=visible.map(g=>'<section class="search-group"><div class="listing-head"><div><h2>'+esc(g.label)+'</h2><p>'+g.items.length+' 条结果</p></div></div><div class="article-grid">'+g.items.map(item=>'<a class="article-card" href="'+esc(item.href)+'"><span class="tag">'+esc(g.label)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.desc||'')+'</p>'+(item.matchReason?'<span class="search-match">'+esc(item.matchReason)+'</span>':'')+'<span class="article-foot">查看内容 →</span></a>').join('')+'</div></section>').join('');
  const help=total&&selected!=='all'?'<div class="empty">这个分类没有匹配结果，可以选择“全部”或其他内容类型。</div>':'<div class="empty">没有找到相关内容。可以减少关键词，或试试“眼在手上”“视野”“双 Mark”“拖影”“Blob”。</div>';
  target.innerHTML='<div class="wrap"><div class="page-head"><div class="eyebrow">SEARCH THE INDEX</div><h1>全站搜索</h1><p>按关键词、常用说法和相关主题查找知识、案例、图解、工具与问题。</p><form class="search-area" id="search-form" role="search"><label class="skip" for="query">输入关键词</label><input id="query" type="search" value="'+esc(q)+'" placeholder="例如：眼在手上、视野、拖影"><button class="btn" type="submit">搜索</button></form><div class="search-suggestions"><span>常用搜索</span>'+['眼在手上','双 Mark','9点标定','光源选型','Blob'].map(x=>'<a href="#search?q='+encodeURIComponent(x)+'">'+esc(x)+'</a>').join('')+'</div></div><div class="search-layout"><section class="content-panel"><div class="listing-head"><div><h2>'+(q.trim()?'搜索结果':'全部内容')+'</h2><p>'+(q.trim()?'“'+esc(q)+'” · ':'')+'共 '+total+' 条'+(selected!=='all'?' · 当前分类 '+shown+' 条':'')+'</p></div></div><nav class="search-tabs" aria-label="按内容类型筛选">'+tabs+'</nav>'+(shown?cards:help)+'</section></div></div>';
  target.querySelector('#search-form').addEventListener('submit',event=>{event.preventDefault();ctx.goSearch(target.querySelector('#query').value)});
 }
 root.VisionContentUI={connections,mountSearch};
})(window);
