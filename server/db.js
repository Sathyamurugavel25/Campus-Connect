const mongoose=require('mongoose'),fs=require('fs');
exports.connectDB=async()=>{let uri=process.env.MONGO_URI;
 if(!uri){const{MongoMemoryServer}=require('mongodb-memory-server');fs.mkdirSync('data',{recursive:true});
  const mem=await MongoMemoryServer.create({instance:{dbPath:'data',storageEngine:'wiredTiger'}});uri=mem.getUri('campusconnect');
  console.log('No MONGO_URI set: using embedded local MongoDB (saved in server/data)')}
 await mongoose.connect(uri);console.log('MongoDB connected')};
