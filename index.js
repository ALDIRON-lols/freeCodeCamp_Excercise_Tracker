const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;


const userSchema = mongoose.Schema({
  username: {type: String, required: true}
})

const excerciseSchema = mongoose.Schema({
  username:{type: String, required: true} ,
  description:{type: String, required: true} ,
  duration: {type: String, required: true} ,
  date: {type: String, required: true} ,
  _id:{type: String, required: true} 
});

const logSchema = mongoose.Schema({
  username: String,
  count: Number,
  _id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  log: [excerciseSchema]
})

const Log = mongoose.model("Log", logSchema);
const Excercise = mongoose.model("Excercise", excerciseSchema);
const User = mongoose.model("User", userSchema); 

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post(function(req, res, next){
  const doc = new User({username: req.body.username});
  doc.save().then((data)=>{
    console.log("User added successfully.");
    req.customData = doc;
    next();
  }).catch((error)=>{
    console.log(error);
    res.send(401);
  })
}, function(req, res){
  console.log("Reached.");
  const user = req.customData.username; 
  const id = req.customData._id;
  res.json({username: user, _id: id});
}).get(function(req, res){
  User.find({User}).then((data)=>{
    console.log("HERE WE GO: \n"+data);
    res.send({data});
  }); 
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
