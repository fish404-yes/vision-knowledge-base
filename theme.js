(function(){
'use strict';
const key='vision-index-theme-v1',button=document.getElementById('theme-toggle');let mode='light';
try{const saved=localStorage.getItem(key);if(saved==='dark'||saved==='light')mode=saved}catch(e){}
function update(){document.documentElement.dataset.theme=mode;button.setAttribute('aria-pressed',String(mode==='dark'));button.setAttribute('aria-label',mode==='dark'?'切换为浅色界面':'切换为深色界面');button.textContent=mode==='dark'?'☀ 浅色':'☾ 深色'}
button.addEventListener('click',()=>{mode=mode==='dark'?'light':'dark';try{localStorage.setItem(key,mode)}catch(e){}update()});update();
})();
