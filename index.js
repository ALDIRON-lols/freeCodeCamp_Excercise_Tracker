const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;


const userSchema = mongoose.Schema({
  username: { type: String, required: true }
})

const excerciseSchema = mongoose.Schema({
  username: { type: String },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String },
  user_id: { type: String, required: true }
});

const logSchema = mongoose.Schema({
  username: String,
  count: Number,
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  log: [excerciseSchema]
})

const Log = mongoose.model("Log", logSchema);
const Excercise = mongoose.model("Excercise", excerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post(function (req, res, next) {
  const doc = new User({ username: req.body.username });
  doc.save().then((data) => {
    console.log("User added successfully.");
    req.customData = doc;
    next();
  }).catch((error) => {
    console.log(error);
    res.send(401);
  })
}, function (req, res) {
  console.log("Reached.");
  const user = req.customData.username;
  const id = req.customData._id;
  res.json({ username: user, _id: id });
}).get(function (req, res) {
  User.find({ User }).then((data) => {
    console.log("HERE WE GO: \n" + data);
    res.json(data);
  });
});

app.route('/api/users/:_id/exercises').post(async (req, res, next) => {
  const u_description = req.body.description;
  const u_duration = Number(req.body.duration);
  const userId = req.params._id;
  let u_date;
  let user_name = "";
  console.log("User ID is: " + userId);
  //getting username
  try {
    await User.findOne({ _id: userId }).then((data) => {
      user_name = data.username;
      console.log("User is found " + data);
    })
  }
  catch {
    console.log("User not found (catch block).");
    return res.sendStatus(401);
  }
  //handeling date
  if (req.body.date) {
    u_date = new Date(req.body.date).toDateString();
  }
  else {
    u_date = new Date().toDateString();
  }
  //Saving the exercise data into the database
  let doc = new Excercise({ user_id: userId, username: user_name, date: u_date, duration: u_duration, description: u_description });
  try {
    await doc.save().then((data) => {
      console.log("Exercise saved");
      console.log("The data is: " + doc);
    })
  }
  catch {
    console.log("not saved" + err);
    return res.sendStatus(401);
  }
  //saving the doc json in req for use in the next handler
  req.customData = doc;
  console.log("The data is: " + doc);
  //CAlling the log handler function
  handleExerciseLog(userId, doc);

  //calling the next RouteHandler
  next();
}, function (req, res) {
  res.json({ _id: req.customData.user_id, username: req.customData.username, date: req.customData.date, duration: req.customData.duration, description: req.customData.description });
})


app.get('/api/users/:_id/logs', (req, res) => {
  let log_array;
  let { from, to, limit } = req.query;
  limit = Number(limit);


  Excercise.find({ user_id: req.params._id }, null, { limit: limit || 0 }).then((data) => {
    let array;
    try {
      from = new Date(from)

    }
    catch { }
    try {
      to = new Date(to)
    }
    catch { }
    array = data.map((x) => {
      date = new Date(x.date)
      if ((date >= from || from == "Invalid Date") && (date <= to || to == "Invalid Date")) {
        let y = { description: x.description, duration: x.duration, date: x.date };
        return y;
      }
    })

    if (array[0] == null) { array = [] }
    res.json({ _id: data[0].user_id, username: data[0].username, count: array.length, log: array });
  }).catch((err) => {
    console.log("Error occured in getting logs of a specific user: " + err);
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})




//FUNCTIONS
const handleExerciseLog = (userId, exercise) => {
  let array;
  let func_count;
  console.log("here successfully");
  Log.findById({ _id: userId }).then((data) => {
    data.log.push(exercise);
    func_count = data.count;
    func_count++;
    array = data.log;
    //update the document
    Log.findByIdAndUpdate({ _id: userId }, { log: array, count: func_count }).then((data) => {
      console.log("Log Updated successfully" + data);
    })
  })
    //create new log for a new user  
    .catch((data) => {
      array = [exercise];
      console.log("Im in catch.");
      let doc = new Log({ username: exercise.username, count: 1, _id: exercise.user_id, log: array });
      doc.save().then((data) => {
        console.log("Log created successfully" + data);
      });
    })
}