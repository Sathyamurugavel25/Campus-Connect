const m=require('mongoose'),{Schema:S,Types:{ObjectId:O}}=m;
const ref=r=>({type:O,ref:r});
const T={timestamps:true};
const status={type:String,enum:['pending','approved','rejected'],default:'approved'};
exports.User=m.model('User',new S({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true},password:{type:String,required:true},
 role:{type:String,enum:['student','faculty','hod','admin'],default:'student'},department:{type:String,default:'General'},bio:String,avatar:String},T));
exports.Club=m.model('Club',new S({name:{type:String,required:true},description:String,category:String,department:String,image:String,createdBy:ref('User'),members:[ref('User')],status,reviewNote:String},T));
exports.Event=m.model('Event',new S({title:{type:String,required:true},description:String,category:String,date:{type:Date,required:true},venue:String,department:String,image:String,club:ref('Club'),createdBy:ref('User'),
 registrations:[{user:ref('User'),at:{type:Date,default:Date.now},attended:{type:Boolean,default:false},team:String,members:String,note:String,resume:String,phone:String,year:String,link:String,level:String,ticket:String}],type:{type:String,enum:['event','hackathon','workshop','internship'],default:'event'},company:String,stipend:String,duration:String,deadline:Date,applyLink:String,teamSize:Number,prize:String,mode:String,gallery:[String],capacity:Number,ratings:[{user:ref('User'),stars:Number}],status,reviewNote:String},T));
exports.Announcement=m.model('Announcement',new S({title:{type:String,required:true},body:String,category:String,important:{type:Boolean,default:false},department:String,image:String,createdBy:ref('User'),status,reviewNote:String},T));
exports.Notification=m.model('Notification',new S({user:ref('User'),message:String,link:String,read:{type:Boolean,default:false}},T));
