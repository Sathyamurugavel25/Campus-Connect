require('dotenv').config();const bcrypt=require('bcryptjs'),M=require('./models'),{connectDB}=require('./db');
(async()=>{await connectDB();
const mk=(name,email,pw,role,department)=>M.User.findOne({email}).then(u=>u||M.User.create({name,email,role,department,password:bcrypt.hashSync(pw,10)}));
const admin=await mk('Administrator',process.env.ADMIN_EMAIL||'admin@college.edu',process.env.ADMIN_PASSWORD||'Admin@123','admin','General');
const hod=await mk('Dr. Meena Iyer','hodcse@college.edu','Hod@1234','hod','CSE');
const fac=await mk('Prof. Arun Kumar','facultycse1@college.edu','Faculty@123','faculty','CSE');
const s1=await mk('Priya S','student101@college.edu','Student@123','student','CSE');
await mk('Karthik R','student102@college.edu','Student@123','student','CSE');
if(!(await M.Club.countDocuments())){
 await M.Club.create([{name:'Code Circle',category:'Tech',department:'CSE',description:'Weekly coding sessions and hackathon prep.',createdBy:fac._id,members:[s1._id]},
  {name:'Robotics Club',category:'Tech',department:'CSE',description:'Build and race bots.',createdBy:fac._id,status:'pending'},
  {name:'Drama Society',category:'Arts',department:'General',description:'Stage plays and street theatre.',createdBy:admin._id}]);
 const d=n=>new Date(Date.now()+n*864e5);
 await M.Event.create([{title:'Hackathon 2026',category:'Tech',date:d(7),venue:'Main Auditorium',department:'CSE',capacity:100,description:'24-hour build sprint.',createdBy:fac._id,registrations:[{user:s1._id}]},
  {title:'Freshers Meet',category:'Cultural',date:d(14),venue:'Open Air Theatre',department:'General',createdBy:admin._id}]);
 await M.Announcement.create({title:'Semester exam timetable released',body:'Check the department notice board and portal.',category:'Academic',important:true,department:'CSE',createdBy:hod._id});
 }
if(!(await M.Event.countDocuments({type:{$in:['hackathon','workshop','internship']}}))){const d=n=>new Date(Date.now()+n*864e5);
 await M.Event.create([{type:'hackathon',title:'CodeSprint 24h Hackathon',category:'Tech',date:d(10),deadline:d(8),venue:'CSE Lab Block',department:'CSE',teamSize:4,prize:'Rs 25,000',description:'Build a campus problem-solving app in 24 hours.',createdBy:fac._id},
  {type:'workshop',title:'MERN Stack Workshop',category:'Tech',date:d(5),deadline:d(4),mode:'Offline',duration:'2 days',capacity:60,venue:'Seminar Hall',department:'CSE',description:'Hands-on MongoDB, Express, React and Node.',createdBy:fac._id},
  {type:'internship',title:'Frontend Developer Intern',company:'Zoho (sample)',stipend:'Rs 15,000/month',duration:'3 months',category:'Internship',date:d(30),deadline:d(20),department:'CSE',description:'Work on real product UI with a mentor.',createdBy:hod._id}])}
console.log('Demo data ready.');process.exit()})().catch(e=>{console.error(e.message);process.exit(1)});
