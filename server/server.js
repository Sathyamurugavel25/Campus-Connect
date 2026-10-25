require('dotenv').config();
const express=require('express'),cors=require('cors'),mongoose=require('mongoose'),jwt=require('jsonwebtoken'),bcrypt=require('bcryptjs'),multer=require('multer'),fs=require('fs');
const M=require('./models');
fs.mkdirSync('uploads',{recursive:true});
const app=express();app.use(cors({origin:process.env.CLIENT_URL||true}));app.use(express.json());app.use('/uploads',express.static('uploads'));
const up=multer({storage:multer.diskStorage({destination:'uploads',filename:(q,f,cb)=>cb(null,Date.now()+'-'+f.originalname.replace(/\s/g,'_'))}),limits:{fileSize:5e6}});
const wrap=f=>(q,s,n)=>f(q,s,n).catch(e=>s.status(400).json({message:e.message}));
const auth=wrap(async(q,s,n)=>{const t=(q.headers.authorization||'').split(' ')[1];if(!t)return s.status(401).json({message:'Please log in'});
 try{q.user=await M.User.findById(jwt.verify(t,process.env.JWT_SECRET).id).select('-password')}catch{return s.status(401).json({message:'Session expired'})}
 if(!q.user)return s.status(401).json({message:'User not found'});n()});
const role=(...r)=>(q,s,n)=>r.includes(q.user.role)?n():s.status(403).json({message:'You do not have access to this'});
const notify=async(users,message,link)=>{const docs=await M.Notification.insertMany([].concat(users).map(user=>({user,message,link})));docs.forEach(d=>io.to(String(d.user)).emit('notification',d))};
const sign=u=>jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:'7d'});
const CODES={admin:process.env.ADMIN_CODE||'ADMIN2026'};
const DOMAIN=process.env.COLLEGE_DOMAIN||'college.edu',DOM=DOMAIN.replace(/\./g,'\\.');
const EMAIL={student:new RegExp(`^student\\d+@${DOM}$`),faculty:new RegExp(`^faculty([a-z]+)\\d*@${DOM}$`),hod:new RegExp(`^hod([a-z]+)@${DOM}$`),admin:new RegExp(`^admin\\d*@${DOM}$`)};
const HINT={student:`Student emails look like student101@${DOMAIN}`,faculty:`Faculty emails look like facultycse1@${DOMAIN} (faculty + department + number)`,hod:`HOD emails look like hodcse@${DOMAIN} (hod + department)`,admin:`Admin emails look like admin@${DOMAIN}`};
const rx=t=>new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
const file=(q,k='image')=>q.file?{[k]:'/uploads/'+q.file.filename}:{};
const imgs=q=>q.files?.length?{image:'/uploads/'+q.files[0].filename,gallery:q.files.map(f=>'/uploads/'+f.filename)}:{};
const{connectDB}=require('./db');
const server=require('http').createServer(app);
const io=new(require('socket.io').Server)(server,{cors:{origin:true}});
io.use((sock,n)=>{try{sock.uid=jwt.verify(sock.handshake.auth.token,process.env.JWT_SECRET).id;n()}catch{n(Error('auth'))}});
io.on('connection',sock=>sock.join(String(sock.uid)));
const R=express.Router();app.use('/api',R);
R.use((q,s,n)=>{if(q.method!=='GET')s.on('finish',()=>s.statusCode<400&&io.emit('refresh',q.path.split('/')[1]));n()});

// ---- Auth & profile
R.post('/auth/register',wrap(async(q,s)=>{const{name,email:em,password,department,role:want='student',accessCode}=q.body;const email=(em||'').toLowerCase().trim();if(!name||!email||!password||password.length<6)throw Error('Name, email and a 6+ character password are required');
 if(await M.User.findOne({email}))throw Error('Email already registered');
 if(!['student','faculty','hod','admin'].includes(want))throw Error('Choose a valid role');
 const m=email.match(EMAIL[want]);if(!m)throw Error(HINT[want]);
 const dept=want==='student'?(department||'').toUpperCase().trim():want==='admin'?'General':m[1].toUpperCase();
 if(!dept)throw Error('Choose your department');
 if(want==='hod'&&await M.User.findOne({role:'hod',department:dept}))throw Error(`A HOD account for ${dept} already exists`);
 if(want==='admin'&&accessCode!==CODES.admin)throw Error('Admin sign up needs the admin access code');
 
 const u=await M.User.create({name,email,department:dept,password:await bcrypt.hash(password,10),role:want});s.json({token:sign(u),user:{...u.toObject(),password:undefined}})}));
R.post('/auth/login',wrap(async(q,s)=>{const u=await M.User.findOne({email:(q.body.email||'').toLowerCase().trim()});
 if(!u||!(await bcrypt.compare(q.body.password||'',u.password)))return s.status(401).json({message:'Wrong email or password'});
 if(q.body.role&&q.body.role!==u.role)return s.status(403).json({message:`This is a ${u.role==='hod'?'HOD':u.role} account. We switched the tab for you, press Log in again.`,actualRole:u.role});s.json({token:sign(u),user:{...u.toObject(),password:undefined}})}));
R.get('/auth/me',auth,(q,s)=>s.json(q.user));
R.put('/auth/me',auth,up.single('avatar'),wrap(async(q,s)=>{const{name,bio,department}=q.body;Object.assign(q.user,{name:name||q.user.name,bio,department:department||q.user.department},file(q,'avatar'));await q.user.save();s.json(q.user)}));

// ---- Admin: users
R.get('/users',auth,role('admin','hod'),wrap(async(q,s)=>{const f={};if(q.query.q)f.$or=[{name:rx(q.query.q)},{email:rx(q.query.q)}];if(q.query.role)f.role=q.query.role;
 if(q.user.role==='hod')f.department=q.user.department;s.json(await M.User.find(f).select('-password').sort('-createdAt'))}));
R.post('/users',auth,role('admin'),wrap(async(q,s)=>{const b=q.body;s.json(await M.User.create({...b,password:await bcrypt.hash(b.password||'Welcome@123',10)}))}));
R.put('/users/:id',auth,role('admin'),wrap(async(q,s)=>{const{role:r,department,name}=q.body;s.json(await M.User.findByIdAndUpdate(q.params.id,{role:r,department,name},{new:true,omitUndefined:true}).select('-password'))}));
R.delete('/users/:id',auth,role('admin'),wrap(async(q,s)=>{await M.User.findByIdAndDelete(q.params.id);s.json({ok:true})}));

// ---- Clubs / Events / Announcements (CRUD + HOD approval)
const CFG={clubs:{Model:M.Club,search:['name','description','category']},events:{Model:M.Event,search:['title','description','venue','category']},announcements:{Model:M.Announcement,search:['title','body','category']}};
for(const[p,{Model,search}]of Object.entries(CFG)){
 const needsApproval=(u,b)=>process.env.REQUIRE_APPROVAL!=='false'&&u.role==='faculty'&&(p!=='announcements'||b.important===true||b.important==='true');
 const base=`/${p}`;
 R.get(base,auth,wrap(async(q,s)=>{const u=q.user,{q:t,category,status,mine}=q.query;const and=[];
  if(u.role==='student')and.push({status:'approved'});
  else if(u.role==='faculty')and.push({$or:[{status:'approved'},{createdBy:u._id}]});
  else if(u.role==='hod')and.push({$or:[{status:'approved'},{department:u.department}]});
  if(t)and.push({$or:search.map(k=>({[k]:rx(t)}))});if(category)and.push({category});if(q.query.type)and.push(q.query.type==='event'?{$or:[{type:'event'},{type:{$exists:false}}]}:{type:q.query.type});if(status)and.push({status});if(mine)and.push({createdBy:u._id});
  const list=await Model.find(and.length?{$and:and}:{}).populate('createdBy','name role department').sort(p==='events'?'date':'-createdAt').lean();
  const own=x=>String(x)===String(u._id);
  s.json(u.role!=='student'?list:list.map(d=>({...d,memberCount:d.members?.length,members:d.members?.filter(own),regCount:d.registrations?.length,
   registrations:d.registrations?.filter(r=>own(r.user)).map(({user,at,attended,ticket})=>({user,at,attended,ticket})),ratings:d.ratings?.map(r=>({stars:r.stars}))})))}));
 R.post(base,auth,role('faculty','hod','admin'),up.array('image',4),wrap(async(q,s)=>{const b={...q.body,...imgs(q),createdBy:q.user._id,department:q.body.department||q.user.department};
  b.status=needsApproval(q.user,b)?'pending':'approved';const d=await Model.create(b);
  if(b.status==='pending'){const h=await M.User.find({role:'hod',department:b.department});await notify(h.map(x=>x._id),`Approval needed: ${d.name||d.title} (${p.slice(0,-1)}) by ${q.user.name}`,'/approvals')}
  else if(p!=='clubs'){const all=await M.User.find({_id:{$ne:q.user._id}}).select('_id');await notify(all.map(x=>x._id),`New ${p.slice(0,-1)}: ${d.title}`,'/'+p)}
  s.json(d)}));
 R.put(`${base}/:id`,auth,role('faculty','hod','admin'),up.array('image',4),wrap(async(q,s)=>{const d=await Model.findById(q.params.id);if(!d)throw Error('Not found');
  if(String(d.createdBy)!==String(q.user._id)&&q.user.role!=='admin')return s.status(403).json({message:'Only the creator can edit'});
  const{status,createdBy,members,registrations,ratings,...rest}=q.body;Object.assign(d,rest,imgs(q));if(needsApproval(q.user,d)&&d.status!=='pending'){d.status='pending'}await d.save();s.json(d)}));
 R.patch(`${base}/:id/review`,auth,role('hod','admin'),wrap(async(q,s)=>{const d=await Model.findById(q.params.id);if(!d)throw Error('Not found');
  if(q.user.role==='hod'&&d.department!==q.user.department)return s.status(403).json({message:'Different department'});
  d.status=q.body.status==='approved'?'approved':'rejected';d.reviewNote=q.body.note;await d.save();
  await notify(d.createdBy,`Your ${p.slice(0,-1)} "${d.name||d.title}" was ${d.status}${q.body.note?': '+q.body.note:''}`,'/'+p);
  if(d.status==='approved'&&p!=='clubs'){const all=await M.User.find().select('_id');await notify(all.map(x=>x._id),`New ${p.slice(0,-1)}: ${d.title}`,'/'+p)}s.json(d)}));
 R.delete(`${base}/:id`,auth,role('faculty','hod','admin'),wrap(async(q,s)=>{const d=await Model.findById(q.params.id);if(!d)throw Error('Not found');
  if(String(d.createdBy)!==String(q.user._id)&&q.user.role!=='admin')return s.status(403).json({message:'Only the creator or admin can delete'});await d.deleteOne();s.json({ok:true})}));
}
R.post('/clubs/:id/join',auth,role('student'),wrap(async(q,s)=>{const c=await M.Club.findById(q.params.id);const i=c.members.findIndex(x=>String(x)===String(q.user._id));
 if(i<0){c.members.push(q.user._id);await notify(c.createdBy,`${q.user.name} joined ${c.name}`,'/clubs')}else c.members.splice(i,1);await c.save();s.json({ok:true})}));
R.get('/clubs/:id/members',auth,role('faculty','hod','admin'),wrap(async(q,s)=>s.json((await M.Club.findById(q.params.id).populate('members','name email department')).members)));
R.post('/events/:id/register',auth,role('student'),up.single('resume'),wrap(async(q,s)=>{const e=await M.Event.findById(q.params.id);const i=e.registrations.findIndex(r=>String(r.user)===String(q.user._id));
 if(i<0){if(e.capacity&&e.registrations.length>=e.capacity)throw Error('This event is full');
  if(e.deadline&&e.deadline<new Date())throw Error('The deadline has passed');
  if(!q.body.phone)throw Error('Enter your phone number');
  if(e.type==='internship'&&!q.file)throw Error('Upload your resume to apply');
  if(e.type==='hackathon'){if(!q.body.team)throw Error('Enter your team name');if(e.teamSize&&(q.body.members||'').split(',').filter(x=>x.trim()).length+1>e.teamSize)throw Error('Team can have at most '+e.teamSize+' members')}
  e.registrations.push({user:q.user._id,team:q.body.team,members:q.body.members,note:q.body.note,phone:q.body.phone,year:q.body.year,link:q.body.link,level:q.body.level,ticket:require('crypto').randomBytes(5).toString('hex').toUpperCase(),...file(q,'resume')});await notify(e.createdBy,`${q.user.name} registered for ${e.title}`,'/events')}else e.registrations.splice(i,1);await e.save();const mine=e.registrations.find(r=>String(r.user)===String(q.user._id));s.json({ok:true,ticket:mine?.ticket})}));
R.get('/events/:id/registrations',auth,role('faculty','hod','admin'),wrap(async(q,s)=>s.json((await M.Event.findById(q.params.id).populate('registrations.user','name email department')).registrations)));

R.patch('/events/:id/attendance',auth,role('faculty','hod','admin'),wrap(async(q,s)=>{const e=await M.Event.findById(q.params.id);
 if(q.user.role==='faculty'&&String(e.createdBy)!==String(q.user._id))throw Error('Only the organiser can mark attendance');
 const r=e.registrations.find(x=>String(x.user)===q.body.userId);if(!r)throw Error('Student is not registered');r.attended=!!q.body.present;await e.save();
 if(r.attended)await notify(r.user,`Your attendance was marked for ${e.title}`,'/profile');s.json({ok:true})}));
R.get('/events/:id/export',auth,role('faculty','hod','admin'),wrap(async(q,s)=>{const e=await M.Event.findById(q.params.id).populate('registrations.user','name email department');
 const rows=[['Name','Email','Department','Registered at','Attended','Team','Teammates','Note','Phone','Year','Link','Level'],...e.registrations.map(r=>[r.user?.name,r.user?.email,r.user?.department,r.at.toISOString(),r.attended?'Yes':'No',r.team,r.members,r.note,r.phone,r.year,r.link,r.level])];
 s.type('text/csv').send(rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'))}));
R.post('/events/:id/rate',auth,role('student'),wrap(async(q,s)=>{const e=await M.Event.findById(q.params.id);
 if(!e.registrations.some(r=>String(r.user)===String(q.user._id)))throw Error('Only registered students can rate');if(e.date>new Date())throw Error('You can rate after the event');
 e.ratings=e.ratings.filter(r=>String(r.user)!==String(q.user._id));e.ratings.push({user:q.user._id,stars:+q.body.stars});await e.save();s.json({ok:true})}));
R.put('/auth/password',auth,wrap(async(q,s)=>{const u=await M.User.findById(q.user._id);if(!(await bcrypt.compare(q.body.current||'',u.password)))throw Error('Current password is wrong');
 if((q.body.next||'').length<6)throw Error('New password needs 6+ characters');u.password=await bcrypt.hash(q.body.next,10);await u.save();s.json({ok:true})}));

R.post('/checkin',auth,role('faculty','hod','admin'),wrap(async(q,s)=>{
 const ticket=String(q.body.code||'').trim().toUpperCase().replace(/^CC[-:]/,'');if(!ticket)throw Error('Scan or enter a ticket code');
 const e=await M.Event.findOne({'registrations.ticket':ticket});if(!e)throw Error('Ticket not found');
 if(q.user.role==='faculty'&&String(e.createdBy)!==String(q.user._id))throw Error('This ticket is for an event you did not organise');
 const r=e.registrations.find(x=>x.ticket===ticket),already=r.attended;r.attended=true;await e.save();
 const u=await M.User.findById(r.user).select('name department');if(!already)await notify(r.user,`You are checked in for ${e.title}`,'/events');
 s.json({student:u?.name,department:u?.department,event:e.title,already})}));

// ---- Notifications
R.get('/notifications',auth,wrap(async(q,s)=>s.json(await M.Notification.find({user:q.user._id}).sort('-createdAt').limit(40))));
R.patch('/notifications/read',auth,wrap(async(q,s)=>{await M.Notification.updateMany({user:q.user._id},{read:true});s.json({ok:true})}));
R.post('/notifications/broadcast',auth,role('admin'),wrap(async(q,s)=>{const all=await M.User.find().select('_id');await notify(all.map(x=>x._id),q.body.message);s.json({sent:all.length})}));

// ---- Analytics & participation
R.get('/analytics',auth,role('hod','admin'),wrap(async(q,s)=>{const d=q.user.role==='hod'?{department:q.user.department}:{};
 const[users,clubs,events,anns,pending]=await Promise.all([M.User.countDocuments(q.user.role==='hod'?d:{}),M.Club.find({...d,status:'approved'}),M.Event.find({...d,status:'approved'}),M.Announcement.countDocuments(d),
  Promise.all([M.Club,M.Event,M.Announcement].map(x=>x.countDocuments({...d,status:'pending'}))).then(a=>a.reduce((x,y)=>x+y))]);
 s.json({users,clubs:clubs.length,events:events.length,announcements:anns,pending,byType:events.reduce((o,e)=>({...o,[e.type]:(o[e.type]||0)+1}),{}),registrations:events.reduce((n,e)=>n+e.registrations.length,0),
  topClubs:clubs.map(c=>({name:c.name,members:c.members.length})).sort((a,b)=>b.members-a.members).slice(0,5),
  topEvents:events.map(e=>({name:e.title,registrations:e.registrations.length})).sort((a,b)=>b.registrations-a.registrations).slice(0,5)})}));
R.get('/participation',auth,wrap(async(q,s)=>{const[clubs,events]=await Promise.all([M.Club.find({members:q.user._id}).select('name category'),M.Event.find({'registrations.user':q.user._id}).select('title date venue type')]);
 s.json({clubs,events,pending:q.user.role==='student'?0:await Promise.all([M.Club,M.Event,M.Announcement].map(x=>x.countDocuments({createdBy:q.user._id,status:'pending'}))).then(a=>a.reduce((x,y)=>x+y))})}));

connectDB().then(async()=>{
 if(!(await M.User.findOne({role:'admin'})))await M.User.create({name:'Administrator',email:process.env.ADMIN_EMAIL||'admin@college.edu',password:await bcrypt.hash(process.env.ADMIN_PASSWORD||'Admin@123',10),role:'admin'});
 server.listen(process.env.PORT||5000,()=>console.log('API running on port '+(process.env.PORT||5000)))}).catch(e=>console.error('MongoDB connection failed:',e.message));
