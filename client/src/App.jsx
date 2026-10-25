import{createContext,useContext,useEffect,useState,useCallback,useRef}from'react';
import QRCode from'qrcode';
import{Routes,Route,NavLink,Link,Navigate,useNavigate}from'react-router-dom';
import api,{err,FILES,live,startLive,stopLive}from'./api.js';
const Ctx=createContext();const useAuth=()=>useContext(Ctx);
const fmt=d=>new Date(d).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
const isStaff=u=>['faculty','hod','admin'].includes(u.role);
const THEME={event:['#0d8074','#2dd4bf'],hackathon:['#5b21b6','#ec4899'],workshop:['#b45309','#fbbf24'],internship:['#1d4ed8','#38bdf8'],club:['#166534','#a3e635'],announcement:['#9f1239','#fb923c']};
const PATH={event:'/events',hackathon:'/hackathons',workshop:'/workshops',internship:'/internships'};
const LABEL={event:'Event',hackathon:'Hackathon',workshop:'Workshop',internship:'Internship',club:'Club',announcement:'Announcement'};
const W='fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
const ICON={
 event:`<rect x="70" y="42" width="60" height="52" rx="6" ${W}/><path d="M70 58h60M85 36v12M115 36v12" ${W}/><circle cx="88" cy="76" r="4" fill="#fff"/><circle cx="102" cy="76" r="4" fill="#fff"/><circle cx="116" cy="76" r="4" fill="#fff"/>`,
 hackathon:`<path d="M82 52L62 72l20 20M118 52l20 20-20 20M108 46L92 98" ${W}/>`,
 workshop:`<circle cx="100" cy="70" r="20" ${W}/><circle cx="100" cy="70" r="6" fill="#fff"/><path d="M100 36v10M100 94v10M66 70h10M124 70h10M76 46l7 7M117 87l7 7M124 46l-7 7M83 87l-7 7" ${W}/>`,
 internship:`<rect x="68" y="50" width="64" height="44" rx="7" ${W}/><path d="M88 50v-8h24v8M68 70h64" ${W}/>`,
 club:`<circle cx="80" cy="58" r="12" fill="#fff"/><circle cx="122" cy="58" r="12" fill="#fff"/><path d="M58 98c0-16 10-24 22-24s22 8 22 24M100 98c0-16 10-24 22-24s22 8 22 24" fill="#fff" fill-opacity=".85"/>`,
 announcement:`<path d="M68 62h22l34-18v52L90 78H68z" ${W}/><path d="M80 78l6 20" ${W}/>`};
Object.assign(ICON,{
 tech:`<rect x="68" y="44" width="64" height="42" rx="5" ${W}/><path d="M56 98h88M90 60l-8 8 8 8M110 60l8 8-8 8" ${W}/>`,
 music:`<path d="M92 90V48l36-8v40" ${W}/><circle cx="82" cy="92" r="10" fill="#fff"/><circle cx="118" cy="82" r="10" fill="#fff"/>`,
 sport:`<path d="M80 44h40v22c0 12-8 20-20 20s-20-8-20-20zM80 52H66c0 14 6 20 16 22M120 52h14c0 14-6 20-16 22M100 86v12M86 100h28" ${W}/>`,
 science:`<path d="M94 40h12M96 40v22L72 98h56l-24-36V40M80 86h40" ${W}/>`,
 talk:`<rect x="90" y="40" width="20" height="36" rx="10" ${W}/><path d="M80 66c0 14 9 22 20 22s20-8 20-22M100 88v12M88 100h24" ${W}/>`});
const SCENES=[['tech',/tech|cod(e|ing)|hack|software|\bai\b|robot|web|cyber|data/,['#4338ca','#22d3ee']],['music',/music|danc|cultur|fest|drama|art|sing|talent/,['#be185d','#f59e0b']],
 ['sport',/sport|cricket|football|match|marathon|athlet|tournament/,['#15803d','#facc15']],['science',/scien|research|lab|physic|chem|bio|math/,['#0f766e','#a78bfa']],['talk',/talk|seminar|lecture|speaker|guest|panel/,['#9a3412','#fcd34d']]];
// Default banner when nothing is uploaded: picks a scene from the title/category keywords, varies per title.
const cover=(kind,type,title='',category='')=>{const base=kind==='events'?(type||'event'):kind==='clubs'?'club':'announcement';let k=base,[a,b]=THEME[base];
 const text=(title+' '+(category||'')).toLowerCase(),sc=['events','clubs'].includes(kind)&&base!=='internship'&&SCENES.find(s=>s[1].test(text));if(sc){k=sc[0];[a,b]=sc[2]}
 const h=[...title].reduce((n,c)=>n+c.charCodeAt(0),0);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="200" height="140" fill="url(#g)"/><circle cx="${120+h%70}" cy="${h%40}" r="55" fill="#fff" fill-opacity=".12"/><circle cx="${h%60}" cy="${100+h%40}" r="45" fill="#fff" fill-opacity=".10"/>${ICON[k]}<text x="12" y="128" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#fff" fill-opacity=".92">${LABEL[base]}</text></svg>`;
 return'data:image/svg+xml;utf8,'+encodeURIComponent(svg)};
function Cover({item,kind}){const imgs=item.gallery?.length?item.gallery:item.image?[item.image]:[];const[n,setN]=useState(0);
  useEffect(()=>{if(imgs.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const t=setInterval(()=>setN(x=>(x+1)%imgs.length),3500);return()=>clearInterval(t)},[imgs.length]);
  return<div className="covw"><img className="cover" src={imgs.length?FILES+imgs[n%imgs.length]:cover(kind,item.type,item.name||item.title,item.category)} alt=""/>
    {imgs.length>1&&<div className="dots">{imgs.map((_,j)=><button type="button" key={j} aria-label={`Image ${j+1}`} className={j===n?'on':''} onClick={()=>setN(j)}/>)}</div>}</div>}

function Toast({msg}){return msg?<div className="toast" role="status">{msg}</div>:null}
function useToast(){const[m,setM]=useState('');return[m,t=>{setM(t);setTimeout(()=>setM(''),2600)}]}

const ROLES=[['student','Student'],['faculty','Faculty'],['hod','HOD'],['admin','Admin']];
const PITCH={student:['Your campus, in one place','Join clubs, register for events, hackathons and workshops, and apply for internships.'],
 faculty:['Reach every student','Post events, hackathons, workshops and announcements, and see who registered.'],
 hod:['Keep your department moving','Review faculty requests and follow what your department is doing.'],
 admin:['Run the whole campus','Manage users, roles and everything happening on campus.']};
const HINT_EMAIL={student:'student101@college.edu',faculty:'facultycse1@college.edu',hod:'hodcse@college.edu',admin:'admin@college.edu'};
const EMAIL_PATTERN={student:'student[0-9]+@college\\.edu',faculty:'faculty[a-z]+[0-9]*@college\\.edu',hod:'hod[a-z]+@college\\.edu',admin:'admin[0-9]*@college\\.edu'};
const EMAIL_HELP={student:'Use your student ID: student101@college.edu',faculty:'Faculty + department + number: facultycse1@college.edu',hod:'HOD + department: hodcse@college.edu',admin:'admin@college.edu'};
function AuthPage({mode}){
  const{login}=useAuth(),nav=useNavigate();const isLogin=mode==='login';
  const[role,setRole]=useState('student'),[f,setF]=useState({name:'',email:'',password:'',department:'',accessCode:''}),[e,setE]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false);
  const set=k=>ev=>setF({...f,[k]:ev.target.value});const rname=role==='hod'?'HOD':role;const dm=!isLogin&&(role==='faculty'||role==='hod')&&f.email.toLowerCase().match(/^(?:faculty|hod)([a-z]+)/);
  const go=async ev=>{ev.preventDefault();setE('');setBusy(true);try{const{data}=await api.post('/auth/'+(isLogin?'login':'register'),{...f,role});login(data);nav('/')}catch(x){const r=x.response?.data?.actualRole;if(r)setRole(r);setE(err(x))}setBusy(false)};
  return<div className="login" data-role={role}>
    <aside className="pitch"><div className="brand">CampusConnect</div><h2>{PITCH[role][0]}</h2><p>{PITCH[role][1]}</p></aside>
    <form className="panel" onSubmit={go}>
      <h1>{isLogin?'Welcome back':'Create your account'}</h1>
      <p className="muted">{isLogin?'Choose who you are, then log in.':'Choose who you are, then fill in your details.'}</p>
      <div className="seg" role="tablist" aria-label="I am a">{ROLES.map(([k,l])=><button type="button" role="tab" aria-selected={role===k} key={k} onClick={()=>{setRole(k);setE('')}}>{l}</button>)}</div>
      {!isLogin&&<label>Full name<input required placeholder="Your full name" value={f.name} onChange={set('name')}/></label>}
      {!isLogin&&role==='student'&&<label>Department<input required list="depts" placeholder="e.g. CSE" value={f.department} onChange={set('department')}/><datalist id="depts">{['CSE','ECE','EEE','MECH','CIVIL','IT','AIDS'].map(d=><option key={d} value={d}/>)}</datalist></label>}
      <label>Email<input required type="email" autoComplete="email" placeholder={HINT_EMAIL[role]} pattern={isLogin?undefined:EMAIL_PATTERN[role]} title={EMAIL_HELP[role]} value={f.email} onChange={set('email')}/>{!isLogin&&<span className="muted">{EMAIL_HELP[role]}</span>}{dm&&<span className="muted">Department: {dm[1].toUpperCase()}</span>}</label>
      <label>Password<div className="pw"><input required type={show?'text':'password'} minLength={isLogin?undefined:6} autoComplete={isLogin?'current-password':'new-password'} placeholder={isLogin?'Your password':'At least 6 characters'} value={f.password} onChange={set('password')}/><button type="button" className="alt" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div></label>
      {!isLogin&&role==='admin'&&<label>Access code<input required placeholder={`Code for ${rname} accounts`} value={f.accessCode} onChange={set('accessCode')}/><span className="muted">Only the college admin has this code.</span></label>}
      {e&&<div className="err" role="alert">{e}</div>}
      <button className="go" disabled={busy}>{busy?'Please wait...':isLogin?`Log in as ${rname}`:`Sign up as ${rname}`}</button>
      <NavLink to={isLogin?'/register':'/login'} className="muted">{isLogin?'No account yet? Sign up':'Already have an account? Log in'}</NavLink></form></div>}

function Bell(){
  const[list,setList]=useState([]),[open,setOpen]=useState(false),[flash,setFlash]=useState('');
  const load=useCallback(()=>api.get('/notifications').then(r=>setList(r.data)).catch(()=>{}),[]);
  useEffect(()=>{load();return live('notification',n=>{setList(l=>[n,...l]);setFlash(n.message);setTimeout(()=>setFlash(''),4500)})},[load]);
  const n=list.filter(x=>!x.read).length;
  return<div style={{position:'relative'}}><Toast msg={flash}/><button className="alt" onClick={async()=>{setOpen(!open);if(!open&&n){await api.patch('/notifications/read');setTimeout(load,1500)}}}>Notifications{n>0&&<span className="dot">{n}</span>}</button>
    {open&&<div className="pop">{list.length?list.map(x=><div key={x._id} className={x.read?'':'un'}>{x.message}<div className="muted">{fmt(x.createdAt)}</div></div>):<div>Nothing yet. Updates about your clubs and events show up here.</div>}</div>}</div>}

function Dashboard(){
  const{user}=useAuth();const[a,setA]=useState(null),[p,setP]=useState(null),[anns,setAnns]=useState([]),[evs,setEvs]=useState([]),[tick,setTick]=useState(0);
  useEffect(()=>live('refresh',()=>setTick(t=>t+1)),[]);
  useEffect(()=>{api.get('/participation').then(r=>setP(r.data));api.get('/announcements').then(r=>setAnns(r.data.slice(0,3)));api.get('/events').then(r=>setEvs(r.data.filter(e=>new Date(e.date)>=new Date()).slice(0,3)));
    if(['hod','admin'].includes(user.role))api.get('/analytics').then(r=>setA(r.data))},[user,tick]);
  const S=({l,v,to})=>{const c=<><b>{v??'–'}</b>{l}</>;return to?<Link to={to} className="stat">{c}</Link>:<div className="stat">{c}</div>};
  return<><h1>Hello, {user.name.split(' ')[0]}</h1><p className="muted">{user.role.toUpperCase()} · {user.department}</p>
    {a?<><div className="stats"><S l="Users" v={a.users} to={user.role==='admin'?'/users':'/people'}/><S l="Clubs" v={a.clubs} to="/clubs"/><S l="Events" v={a.events} to="/events"/><S l="Registrations" v={a.registrations} to="/events"/><S l="Awaiting approval" v={a.pending} to="/approvals"/></div>
      <div className="grid"><Bars t="Biggest clubs" d={a.topClubs} k="members" to="/clubs"/><Bars t="Most registered events" d={a.topEvents} k="registrations" to="/events"/><Bars t="Posted by type" d={Object.entries(a.byType||{}).map(([name,n])=>({name,n}))} k="n"/></div></>
     :<div className="stats">{user.role==='student'&&<><S l="Clubs joined" v={p?.clubs.length} to="/clubs"/><S l="Events registered" v={p?.events.length} to="/events"/></>}{isStaff(user)&&<S l="Your items awaiting approval" v={p?.pending} to="/my-posts"/>}</div>}
    {user.role==='student'&&p&&<div className="grid"><div className="card"><div className="body"><h3>My clubs</h3>{p.clubs.map(c=><Link key={c._id} to={`/clubs?q=${encodeURIComponent(c.name)}`}>{c.name}</Link>)}{!p.clubs.length&&<span className="muted">Join a club from the Clubs page.</span>}</div></div><div className="card"><div className="body"><h3>My registrations</h3>{p.events.map(e=><Link key={e._id} to={`${PATH[e.type||'event']}?q=${encodeURIComponent(e.title)}`}>{e.title} <span className="muted">{fmt(e.date)}</span></Link>)}{!p.events.length&&<span className="muted">You have not registered for anything yet.</span>}</div></div></div>}
    <h2 style={{marginTop:'1.2rem'}}>What is coming up</h2><div className="grid">{evs.map(e=><Link className="card" key={e._id} to={`${PATH[e.type||'event']}?q=${encodeURIComponent(e.title)}`}><Cover item={e} kind="events"/><div className="body"><h3>{e.title} <span className="badge">{e.type}</span></h3><span className="muted">{fmt(e.date)} · {e.venue}</span></div></Link>)}{!evs.length&&<p className="muted">No upcoming events yet.</p>}</div>
    <h2 style={{marginTop:'1.2rem'}}>Latest announcements</h2><div className="grid">{anns.map(x=><Link className="card notice" key={x._id} to={`/announcements?q=${encodeURIComponent(x.title)}`}><div className="body"><h3>{x.title}</h3><span>{x.body}</span></div></Link>)}</div></>}
function Bars({t,d,k,to}){const max=Math.max(1,...d.map(x=>x[k]));return<div className="card"><div className="body"><h3>{t}</h3>{d.length?d.map(x=>{const Row=to?Link:'div';return<Row key={x.name} {...(to?{to:`${to}?q=${encodeURIComponent(x.name)}`}:{})} style={{display:'block'}}><span className="muted">{x.name} ({x[k]})</span><div className="bar" style={{width:(x[k]/max*100)+'%'}}/></Row>}):<span className="muted">No data yet.</span>}</div></div>}

const EXTRA={event:[['deadline','Registration deadline','datetime-local']],
 hackathon:[['teamSize','Max team size','number'],['prize','Prizes'],['deadline','Registration deadline','datetime-local'],['applyLink','Official website link']],
 workshop:[['mode','Mode (Online or Offline)'],['duration','Duration (e.g. 2 days)'],['deadline','Registration deadline','datetime-local']],
 internship:[['company','Company'],['stipend','Stipend'],['duration','Duration'],['deadline','Apply by','datetime-local'],['applyLink','Company application link']]};
const FIELDS={
 clubs:[['name','Club name'],['category','Category (e.g. Tech, Arts)'],['department','Department'],['description','What does the club do?','area']],
 events:[['title','Event title'],['date','','datetime-local'],['venue','Venue'],['category','Category'],['department','Department'],['capacity','Capacity (optional)','number'],['description','Details','area']],
 announcements:[['title','Title'],['category','Category'],['body','Announcement','area'],['important','Important (needs HOD approval if you are faculty)','check']]};
function RegisterModal({item,user,onClose,onDone}){
  const isI=item.type==='internship',isH=item.type==='hackathon',isW=item.type==='workshop';
  const[f,setF]=useState({phone:'',year:'',team:'',members:'',level:'Beginner',link:'',note:''}),[resume,setResume]=useState(null),[ok,setOk]=useState(false),[e,setE]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const set=k=>ev=>setF({...f,[k]:ev.target.value});
  useEffect(()=>{const h=ev=>ev.key==='Escape'&&onClose();window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose]);
  const submit=async ev=>{ev.preventDefault();setE('');setBusy(true);try{const fd=new FormData();Object.entries(f).forEach(([k,v])=>v&&fd.append(k,v));if(resume)fd.append('resume',resume);const{data}=await api.post(`/events/${item._id}/register`,fd);setDone(data.ticket||true)}catch(x){setE(err(x))}setBusy(false)};
  return<div className="modal-bg" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label="Registration form" onClick={ev=>ev.stopPropagation()}>
    <Cover item={item} kind="events"/>
    <div className="mbody">{done?<><h2>{isI?'Application sent':'You are registered'}</h2>{typeof done==='string'&&!isI?<TicketCard item={item} user={user} ticket={done}/>:<p>{item.title}, {fmt(item.date)}. You will get a notification if anything changes.</p>}<button onClick={onDone}>Done</button></>
    :<form className="mform" onSubmit={submit}><h2>{isI?'Apply for ':'Register for '}{item.title}</h2>
      <p className="muted">{[fmt(item.date),item.venue,item.deadline&&'Closes '+fmt(item.deadline)].filter(Boolean).join(' | ')}</p>
      <div className="two"><label>Name<input value={user.name} readOnly/></label><label>Department<input value={user.department||''} readOnly/></label></div>
      <label>Email<input value={user.email} readOnly/></label>
      <div className="two"><label>Phone number<input required type="tel" pattern="[0-9+ ]{10,15}" placeholder="10-digit mobile number" value={f.phone} onChange={set('phone')}/></label>
        <label>Year of study<select required value={f.year} onChange={set('year')}><option value="">Select year</option>{['1','2','3','4'].map(y=><option key={y} value={y}>Year {y}</option>)}</select></label></div>
      {isH&&<><label>Team name<input required placeholder="Your team name" value={f.team} onChange={set('team')}/></label><label>Teammates<input placeholder={`Names or emails, comma separated (max ${item.teamSize||'any'} including you)`} value={f.members} onChange={set('members')}/></label></>}
      {isW&&<label>Your experience level<select value={f.level} onChange={set('level')}>{['Beginner','Intermediate','Advanced'].map(x=><option key={x}>{x}</option>)}</select></label>}
      {isI&&<><label>Portfolio, GitHub or LinkedIn link<input type="url" placeholder="https://" value={f.link} onChange={set('link')}/></label><label>Resume (PDF or Word)<input required type="file" accept=".pdf,.doc,.docx" onChange={ev=>setResume(ev.target.files[0])}/></label></>}
      <label>{isI?'Why are you a good fit?':'Anything the organisers should know? (optional)'}<textarea rows="3" required={isI} value={f.note} onChange={set('note')}/></label>
      <label className="chk"><input type="checkbox" required checked={ok} onChange={ev=>setOk(ev.target.checked)}/> I confirm these details are correct.</label>
      {e&&<div className="err" role="alert">{e}</div>}
      <div className="row"><button disabled={busy}>{busy?'Submitting...':isI?'Submit application':'Confirm registration'}</button><button type="button" className="alt" onClick={onClose}>Cancel</button></div></form>}</div></div></div>}

function Section({kind,label,type}){
  const{user}=useAuth();const[items,setItems]=useState([]),[q,setQ]=useState(()=>new URLSearchParams(location.search).get('q')||''),[cat,setCat]=useState(''),[st,setSt]=useState(''),[form,setForm]=useState(null),[img,setImg]=useState(null),[list,setList]=useState(null),[rf,setRf]=useState(null),[tk,setTk]=useState(null),[toast,say]=useToast();
  const load=useCallback(()=>api.get('/'+kind,{params:{q,category:cat,status:st,type}}).then(r=>setItems(r.data)).catch(x=>say(err(x))),[kind,q,cat,st,type]);
  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  useEffect(()=>live('refresh',k=>k===kind&&load()),[kind,load]);
  const act=async(fn,ok)=>{try{await fn();say(ok);load()}catch(x){say(err(x))}};
  const save=async ev=>{ev.preventDefault();const fd=new FormData();Object.entries(form).forEach(([k,v])=>k!=='_id'&&v!=null&&typeof v!=='object'&&fd.append(k,v));[...(img||[])].forEach(f=>fd.append('image',f));
    await act(()=>form._id?api.put(`/${kind}/${form._id}`,fd):api.post(`/${kind}`,fd),'Saved');setForm(null);setImg(null)};
  const cats=[...new Set(items.map(i=>i.category).filter(Boolean))];
  return<><div className="top"><h1>{label}</h1>{isStaff(user)&&<button onClick={()=>setForm(type?{type}:{})}>Create {label.toLowerCase().replace(/s$/,'')}</button>}</div>
    <div className="row" style={{marginBottom:'1rem'}}><input style={{maxWidth:280}} placeholder={`Search ${label.toLowerCase()}`} value={q} onChange={e=>setQ(e.target.value)}/>
      <select style={{maxWidth:180}} value={cat} onChange={e=>setCat(e.target.value)}><option value="">All categories</option>{cats.map(c=><option key={c}>{c}</option>)}</select>
      {user.role!=='student'&&<select style={{maxWidth:170}} value={st} onChange={e=>setSt(e.target.value)}><option value="">Any status</option><option>pending</option><option>approved</option><option>rejected</option></select>}</div>
    {form&&<form className="f" onSubmit={save}>{[...(kind==='events'&&!type?[['type','Type','typesel']]:[]),...FIELDS[kind],...(kind==='events'?EXTRA[form.type||type||'event']:[])].map(([k,ph,t])=>t==='area'?<textarea key={k} rows="3" placeholder={ph} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/>
      :t==='typesel'?<select key={k} value={form.type||'event'} onChange={e=>setForm({...form,type:e.target.value})}>{['event','hackathon','workshop','internship'].map(x=><option key={x}>{x}</option>)}</select>:t==='check'?<label key={k}><input type="checkbox" style={{width:'auto'}} checked={!!form[k]} onChange={e=>setForm({...form,[k]:e.target.checked})}/> {ph}</label>
      :<div key={k}>{t==='datetime-local'&&<span className="muted">{k==='date'?'Date and time (start date for internships)':ph}</span>}<input required={k==='name'||k==='title'||k==='date'} type={t||'text'} placeholder={ph} value={t==='datetime-local'&&form[k]?String(form[k]).slice(0,16):form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}
      <label className="muted">Images (optional, up to 4, the first is the cover. A themed default banner is used if you skip it)<input type="file" accept="image/*" multiple onChange={e=>setImg(Array.from(e.target.files).slice(0,4))}/></label><div className="row"><button>Save</button><button type="button" className="alt" onClick={()=>setForm(null)}>Cancel</button></div></form>}
    {rf&&<RegisterModal item={rf.item} user={user} onClose={()=>setRf(null)} onDone={()=>{setRf(null);say('Registration submitted');load()}}/>}
    {tk&&<TicketModal item={tk} user={user} reg={(tk.registrations||[]).find(r=>r.user===user._id)} onClose={()=>setTk(null)}/>}
    <div className="grid">{items.map(i=>{const mine=String(i.createdBy?._id)===String(user._id)||user.role==='admin';const joined=(i.members||[]).includes(user._id),reg=(i.registrations||[]).some(r=>r.user===user._id);
      return<div key={i._id} className={'card'+(kind==='announcements'?' notice':'')}><Cover item={i} kind={kind}/>
        <div className="body"><div className="row"><h3 style={{margin:0}}>{i.name||i.title}</h3><span className={'badge '+i.status}>{i.status}</span>{kind==='events'&&<span className="badge">{i.type}</span>}{i.important&&<span className="badge">important</span>}</div>
          <span className="muted">{[i.category,i.department,i.company,i.stipend&&'Stipend '+i.stipend,i.duration,i.mode,i.prize&&'Prize '+i.prize,i.teamSize&&'Team up to '+i.teamSize,kind==='events'&&fmt(i.date),i.deadline&&'Deadline '+fmt(i.deadline),i.venue].filter(Boolean).join(' · ')}</span><span>{i.description||i.body}</span>
          {i.reviewNote&&<span className="muted">HOD note: {i.reviewNote}</span>}<span className="muted">By {i.createdBy?.name}{kind==='clubs'&&` · ${i.memberCount??i.members.length} members`}{kind==='events'&&` · ${i.regCount??i.registrations.length}${i.capacity?'/'+i.capacity:''} registered${i.ratings?.length?' · '+(i.ratings.reduce((a,r)=>a+r.stars,0)/i.ratings.length).toFixed(1)+' stars':''}`}</span>
          <div className="row" style={{marginTop:'auto'}}>
            {user.role==='student'&&kind==='clubs'&&i.status==='approved'&&<button className={joined?'alt':''} onClick={()=>act(()=>api.post(`/clubs/${i._id}/join`),joined?'Left club':'Joined club')}>{joined?'Leave':'Join'}</button>}
            {user.role==='student'&&kind==='events'&&i.status==='approved'&&<button disabled={!reg&&i.capacity>0&&(i.regCount??i.registrations.length)>=i.capacity} className={reg?'alt':''} onClick={()=>reg?(window.confirm('Cancel your registration?')&&act(()=>api.post(`/events/${i._id}/register`),'Cancelled')):setRf({item:i})}>{reg?(i.type==='internship'?'Withdraw application':'Cancel registration'):(i.type==='internship'?'Apply':'Register')}</button>}
            {i.applyLink&&<a className="btn alt" href={i.applyLink} target="_blank" rel="noreferrer">Official link</a>}{user.role==='student'&&kind==='events'&&reg&&i.type!=='internship'&&<button className="alt" onClick={()=>setTk(i)}>QR ticket</button>}{kind==='events'&&reg&&new Date(i.date)<new Date()&&<select style={{width:'auto'}} defaultValue="" onChange={e=>act(()=>api.post(`/events/${i._id}/rate`,{stars:e.target.value}),'Thanks for rating')}><option value="" disabled>Rate event</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select>}
            {isStaff(user)&&mine&&kind!=='announcements'&&<button className="alt" onClick={async()=>setList({id:i._id,kind,name:i.name||i.title,rows:(await api.get(`/${kind}/${i._id}/${kind==='clubs'?'members':'registrations'}`)).data})}>{kind==='clubs'?'Members':'Attendees'}</button>}
            {isStaff(user)&&mine&&<><button className="alt" onClick={()=>setForm(i)}>Edit</button><button className="bad" onClick={()=>window.confirm('Delete this?')&&act(()=>api.delete(`/${kind}/${i._id}`),'Deleted')}>Delete</button></>}</div></div></div>})}
      {!items.length&&<p className="muted">Nothing here yet. {isStaff(user)?'Create the first one.':'Check back soon.'}</p>}</div>
    {list&&<div className="card" style={{marginTop:'1rem'}}><div className="body"><div className="row"><h3>{list.name}</h3>{list.kind==='events'&&<button className="alt" onClick={async()=>{const{data}=await api.get(`/events/${list.id}/export`,{responseType:'blob'});const a=document.createElement('a');a.href=URL.createObjectURL(data);a.download=list.name+'-registrations.csv';a.click()}}>Export CSV</button>}<button className="alt" onClick={()=>setList(null)}>Close</button></div>
      <table><tbody>{list.rows.map(r=>{const u=list.kind==='events'?r.user:r;return<tr key={r._id}><td>{u?.name}</td><td>{u?.email}</td><td>{u?.department}</td>{list.kind==='events'&&<td>{[r.phone,r.year&&'Year '+r.year,r.level,r.team&&'Team '+r.team,r.members,r.note].filter(Boolean).join(' | ')} {r.link&&<a href={r.link} target="_blank" rel="noreferrer">Link</a>} {r.resume&&<a href={FILES+r.resume} target="_blank" rel="noreferrer">Resume</a>}</td>}{list.kind==='events'&&<td><label><input type="checkbox" style={{width:'auto'}} checked={!!r.attended} onChange={async e=>{const present=e.target.checked;try{await api.patch(`/events/${list.id}/attendance`,{userId:u._id,present});setList({...list,rows:list.rows.map(x=>x===r?{...x,attended:present}:x)})}catch(x){say(err(x))}}}/> Present</label></td>}</tr>})}{!list.rows.length&&<tr><td>No one yet.</td></tr>}</tbody></table></div></div>}<Toast msg={toast}/></>}

function Approvals(){
  const[all,setAll]=useState([]),[toast,say]=useToast();
  const load=useCallback(async()=>{const r=await Promise.all(['clubs','events','announcements'].map(k=>api.get('/'+k,{params:{status:'pending'}}).then(x=>x.data.map(d=>({...d,kind:k})))));setAll(r.flat())},[]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>live('refresh',k=>['clubs','events','announcements'].includes(k)&&load()),[load]);
  const review=async(i,status)=>{const note=status==='rejected'?window.prompt('Reason for rejection?')||'':'';try{await api.patch(`/${i.kind}/${i._id}/review`,{status,note});say(status==='approved'?'Approved':'Rejected');load()}catch(x){say(err(x))}};
  return<><h1>Approvals</h1><div className="grid">{all.map(i=><div className="card" key={i._id}><div className="body"><span className="badge pending">{i.kind.slice(0,-1)}</span><h3>{i.name||i.title}</h3><span>{i.description||i.body}</span>
    <span className="muted">Requested by {i.createdBy?.name} · {i.department}</span><div className="row"><button onClick={()=>review(i,'approved')}>Approve</button><button className="bad" onClick={()=>review(i,'rejected')}>Reject</button></div></div></div>)}
    {!all.length&&<p className="muted">All caught up. New faculty requests will appear here.</p>}</div><Toast msg={toast}/></>}

function Users(){
  const[list,setList]=useState([]),[q,setQ]=useState(''),[role,setRole]=useState(''),[nu,setNu]=useState(null),[msg,setMsg]=useState(''),[toast,say]=useToast();
  const load=useCallback(()=>api.get('/users',{params:{q,role}}).then(r=>setList(r.data)),[q,role]);useEffect(()=>{load()},[load]);
  useEffect(()=>live('refresh',k=>k==='users'&&load()),[load]);
  const upd=(id,b)=>api.put('/users/'+id,b).then(()=>{say('Updated');load()}).catch(x=>say(err(x)));
  return<><h1>Users</h1><div className="row" style={{marginBottom:'1rem'}}><input style={{maxWidth:260}} placeholder="Search name or email" value={q} onChange={e=>setQ(e.target.value)}/>
    <select style={{maxWidth:160}} value={role} onChange={e=>setRole(e.target.value)}><option value="">All roles</option>{['student','faculty','hod','admin'].map(r=><option key={r}>{r}</option>)}</select><button onClick={()=>setNu({role:'faculty'})}>Add staff account</button></div>
    {nu&&<form className="f" onSubmit={async e=>{e.preventDefault();try{await api.post('/users',nu);setNu(null);load()}catch(x){say(err(x))}}}><input required placeholder="Name" onChange={e=>setNu({...nu,name:e.target.value})}/><input required type="email" placeholder="Email" onChange={e=>setNu({...nu,email:e.target.value})}/><input placeholder="Department" onChange={e=>setNu({...nu,department:e.target.value})}/><input placeholder="Temporary password" onChange={e=>setNu({...nu,password:e.target.value})}/>
      <select value={nu.role} onChange={e=>setNu({...nu,role:e.target.value})}>{['faculty','hod','admin','student'].map(r=><option key={r}>{r}</option>)}</select><button>Create account</button></form>}
    <div style={{overflowX:'auto'}}><table><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th></th></tr></thead><tbody>{list.map(u=><tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.department}</td>
      <td><select value={u.role} onChange={e=>upd(u._id,{role:e.target.value})}>{['student','faculty','hod','admin'].map(r=><option key={r}>{r}</option>)}</select></td>
      <td><button className="bad" onClick={()=>window.confirm('Delete user?')&&api.delete('/users/'+u._id).then(load)}>Remove</button></td></tr>)}</tbody></table></div>
    <h2 style={{marginTop:'1.5rem'}}>Send announcement to everyone</h2><div className="row"><input style={{maxWidth:420}} placeholder="Notification message" value={msg} onChange={e=>setMsg(e.target.value)}/><button onClick={async()=>{if(msg){const r=await api.post('/notifications/broadcast',{message:msg});say(`Sent to ${r.data.sent} users`);setMsg('')}}}>Send</button></div><Toast msg={toast}/></>}

function Profile(){
  const{user,setUser}=useAuth();const[f,setF]=useState({name:user.name,bio:user.bio||'',department:user.department}),[av,setAv]=useState(null),[pw,setPw]=useState({current:'',next:''}),[p,setP]=useState(null),[toast,say]=useToast();
  useEffect(()=>{api.get('/participation').then(r=>setP(r.data))},[]);
  const save=async e=>{e.preventDefault();const fd=new FormData();Object.entries(f).forEach(([k,v])=>fd.append(k,v));if(av)fd.append('avatar',av);try{setUser((await api.put('/auth/me',fd)).data);say('Profile saved')}catch(x){say(err(x))}};
  return<><h1>Profile</h1>{user.avatar&&<img src={FILES+user.avatar} alt="" width="90" height="90" style={{borderRadius:'50%',objectFit:'cover'}}/>}
    <form className="f" onSubmit={save} style={{maxWidth:520}}><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input value={f.department} onChange={e=>setF({...f,department:e.target.value})}/><textarea rows="3" placeholder="Short bio" value={f.bio} onChange={e=>setF({...f,bio:e.target.value})}/><input type="file" accept="image/*" onChange={e=>setAv(e.target.files[0])}/><button>Save profile</button></form>
    <h2>Change password</h2><form className="f" style={{maxWidth:520}} onSubmit={async e=>{e.preventDefault();try{await api.put('/auth/password',pw);setPw({current:'',next:''});say('Password changed')}catch(x){say(err(x))}}}><input required type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/><input required type="password" placeholder="New password (6+ characters)" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})}/><button>Update password</button></form>
    {p&&<><h2>My participation</h2><div className="grid"><div className="card"><div className="body"><h3>Clubs</h3>{p.clubs.map(c=><span key={c._id}>{c.name}</span>)}{!p.clubs.length&&<span className="muted">None yet.</span>}</div></div>
      <div className="card"><div className="body"><h3>Registered events</h3>{p.events.map(e=><span key={e._id}>{e.title} <span className="muted">{fmt(e.date)}</span></span>)}{!p.events.length&&<span className="muted">None yet.</span>}</div></div></div></>}<Toast msg={toast}/></>}

function QR({value}){const[u,setU]=useState('');useEffect(()=>{QRCode.toDataURL(value,{width:240,margin:1}).then(setU).catch(()=>{})},[value]);return u?<img src={u} alt={`QR code ${value}`} width="200" height="200"/>:<div style={{width:200,height:200}}/>}
function TicketCard({item,user,ticket,attended}){return<div className="ticket"><h3>{item.title}</h3><span className="muted">{fmt(item.date)}{item.venue?' | '+item.venue:''}</span><QR value={'CC-'+ticket}/><b className="code">{ticket}</b><span>{user.name} | {user.department}</span>
  {attended?<span className="badge approved">Checked in</span>:<span className="muted">Show this QR at the entrance. If the scanner fails, read out the code above.</span>}</div>}
function TicketModal({item,user,reg,onClose}){
  useEffect(()=>{const h=ev=>ev.key==='Escape'&&onClose();window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose]);
  return<div className="modal-bg" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label="Your QR ticket" onClick={ev=>ev.stopPropagation()}><div className="mbody">
    {reg?.ticket?<TicketCard item={item} user={user} ticket={reg.ticket} attended={reg.attended}/>:<p>This registration has no ticket. Cancel it and register again to get a QR code.</p>}<button onClick={onClose}>Close</button></div></div></div>}
function Scan(){
  const[code,setCode]=useState(''),[log,setLog]=useState([]),[on,setOn]=useState(false),[msg,setMsg]=useState('');const scanner=useRef(null),busy=useRef(false);
  const send=async c=>{if(busy.current)return;busy.current=true;let row;try{const{data}=await api.post('/checkin',{code:c});row={ok:true,...data}}catch(x){row={ok:false,error:err(x)}}setLog(l=>[{...row,t:new Date()},...l].slice(0,15));setTimeout(()=>{busy.current=false},1500)};
  const start=async()=>{setMsg('');try{const{Html5Qrcode}=await import('html5-qrcode');scanner.current=new Html5Qrcode('qr-reader');await scanner.current.start({facingMode:'environment'},{fps:10,qrbox:240},t=>send(t));setOn(true)}catch{setMsg('The camera could not start. Allow camera access (it needs localhost or https), or type the ticket code below.')}};
  const stop=async()=>{try{await scanner.current?.stop()}catch{}setOn(false)};
  useEffect(()=>()=>{try{scanner.current?.isScanning&&scanner.current.stop().catch(()=>{})}catch{}},[]);
  return<><h1>Scan attendance QR</h1><p className="muted">Scan a student's ticket to mark them present. Works for events you organised.</p>
    <div className="row" style={{marginBottom:'.8rem'}}>{on?<button className="bad" onClick={stop}>Stop camera</button>:<button onClick={start}>Start camera</button>}</div>{msg&&<p className="err">{msg}</p>}
    <div id="qr-reader" style={{maxWidth:420}}/>
    <form className="row" style={{margin:'1rem 0'}} onSubmit={ev=>{ev.preventDefault();if(code){send(code);setCode('')}}}><input style={{maxWidth:300}} placeholder="Or type the ticket code" value={code} onChange={ev=>setCode(ev.target.value)}/><button>Mark present</button></form>
    <h2>Recent scans</h2>{log.map((r,i)=><div key={i} className="card" style={{marginBottom:'.5rem'}}><div className="body">{r.ok?<><b>{r.student} <span className="muted">{r.department}</span></b><span>{r.event}</span><span className={'badge '+(r.already?'pending':'approved')}>{r.already?'Already checked in':'Marked present'}</span></>:<span className="err">{r.error}</span>}</div></div>)}
    {!log.length&&<p className="muted">No scans yet.</p>}</>}

function MyPosts(){
  const[rows,setRows]=useState([]);
  const load=useCallback(async()=>{const r=await Promise.all(['clubs','events','announcements'].map(k=>api.get('/'+k,{params:{mine:1}}).then(x=>x.data.map(d=>({...d,kind:k})))));setRows(r.flat().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)))},[]);
  useEffect(()=>{load()},[load]);useEffect(()=>live('refresh',()=>load()),[load]);
  return<><h1>My posts</h1><p className="muted">Everything you created and where it stands with your HOD.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Registered or members</th><th>HOD note</th></tr></thead><tbody>
    {rows.map(r=><tr key={r._id}><td>{r.name||r.title}</td><td>{r.kind==='events'?r.type:r.kind.slice(0,-1)}</td><td><span className={'badge '+r.status}>{r.status}</span></td><td>{r.kind==='events'?r.registrations.length:r.kind==='clubs'?r.members.length:'-'}</td><td>{r.reviewNote||''}</td></tr>)}
    {!rows.length&&<tr><td colSpan="5">You have not posted anything yet. Create a club, event, hackathon, workshop or internship from the menu.</td></tr>}</tbody></table></div></>}
function People(){
  const[l,setL]=useState([]);useEffect(()=>{api.get('/users').then(r=>setL(r.data))},[]);
  return<><h1>Department people</h1><div style={{overflowX:'auto'}}><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>{l.map(u=><tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table></div></>}

export default function App(){
  const[user,setUser]=useState(null),[ready,setReady]=useState(false),nav=useNavigate();
  useEffect(()=>{localStorage.getItem('cc_token')?api.get('/auth/me').then(r=>{startLive();setUser(r.data)}).catch(()=>{}).finally(()=>setReady(true)):setReady(true)},[]);
  const login=({token,user})=>{localStorage.setItem('cc_token',token);startLive();setUser(user)};
  const logout=()=>{localStorage.removeItem('cc_token');stopLive();setUser(null);nav('/login')};
  if(!ready)return null;
  if(!user)return<Ctx.Provider value={{login}}><Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="*" element={<Navigate to="/login"/>}/></Routes></Ctx.Provider>;
  const links=[['/','Dashboard'],['/clubs','Clubs'],['/events','Events'],['/hackathons','Hackathons'],['/workshops','Workshops'],['/internships','Internships'],['/announcements','Announcements'],...(isStaff(user)?[['/scan','Scan QR']]:[]),...(user.role==='faculty'?[['/my-posts','My posts']]:[]),...(['hod','admin'].includes(user.role)?[['/approvals','Approvals']]:[]),...(user.role==='hod'?[['/people','Department']]:[]),...(user.role==='admin'?[['/users','Users']]:[]),['/profile','Profile']];
  return<Ctx.Provider value={{user,setUser,login}}><div className="shell" data-role={user.role}><nav className="side"><div className="logo">CampusConnect</div><div style={{color:'#9fb2c7',marginBottom:'.6rem'}}>{user.role==='hod'?'HOD':user.role} portal</div>{links.map(([to,l])=><NavLink key={to} to={to} end={to==='/'}>{l}</NavLink>)}
    <div className="who">{user.name}<br/><button className="alt" style={{marginTop:8}} onClick={logout}>Log out</button></div></nav>
    <main><div className="top" style={{justifyContent:'flex-end'}}><Bell/></div><Routes><Route path="/" element={<Dashboard/>}/><Route path="/clubs" element={<Section key="c" kind="clubs" label="Clubs"/>}/><Route path="/events" element={<Section key="e" kind="events" type="event" label="Events"/>}/><Route path="/hackathons" element={<Section key="h" kind="events" type="hackathon" label="Hackathons"/>}/><Route path="/workshops" element={<Section key="w" kind="events" type="workshop" label="Workshops"/>}/><Route path="/internships" element={<Section key="i" kind="events" type="internship" label="Internships"/>}/>
      <Route path="/announcements" element={<Section key="a" kind="announcements" label="Announcements"/>}/>
      {['hod','admin'].includes(user.role)&&<Route path="/approvals" element={<Approvals/>}/>}{user.role==='admin'&&<Route path="/users" element={<Users/>}/>}{isStaff(user)&&<Route path="/scan" element={<Scan/>}/>}{user.role==='faculty'&&<Route path="/my-posts" element={<MyPosts/>}/>}{user.role==='hod'&&<Route path="/people" element={<People/>}/>}<Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></main></div></Ctx.Provider>}
