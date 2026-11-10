/* SOMENTE PARA TESTE LOCAL — simula window.claude (db/user/downloads). Nunca publicar. */
(()=>{
  const store={};const subs={};
  const seed=window.__SEED||{};
  Object.keys(seed).forEach(c=>{store[c]=store[c]||{};Object.entries(seed[c]).forEach(([id,v])=>store[c][id]=v)});
  const snap=c=>({docs:Object.entries(store[c]||{}).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});
  const fire=c=>(subs[c]||[]).forEach(f=>setTimeout(()=>f(snap(c)),0));
  const db={
    collection:c=>({
      add:async x=>{const id="auto"+Math.random().toString(36).slice(2,8);(store[c]=store[c]||{})[id]=x;fire(c);return {id}},
      onSnapshot:(f)=>{(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),0);return()=>{}}
    }),
    doc:p=>{const [c,...r]=String(p).split("/"),id=r.join("/");return{
      set:async(v)=>{(store[c]=store[c]||{})[id]=v;fire(c)},
      update:async(v)=>{(store[c]=store[c]||{});store[c][id]={...(store[c][id]||{}),...v};fire(c)},
      delete:async()=>{if(store[c])delete store[c][id];fire(c)},
      get:async()=>({exists:!!(store[c]||{})[id],data:()=>(store[c]||{})[id]})}}
  };
  const user={me:async()=>({id:"u1",name:"Fabrício Teste",avatarUrl:"",isOwner:true}),profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:i==="u1"?"Fabrício Teste":"Colega "+i,avatarUrl:""}]))};
  window.claude={use:async n=>n==="db"?db:n==="user"?user:n==="downloads"?{save:async()=>{}}:n==="sample"?null:null};
  try{localStorage.setItem("login-ok-u1","1")}catch(e){}
  window.__store=store;
})();
