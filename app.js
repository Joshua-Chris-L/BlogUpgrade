//jshint esversion:8
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

// Authentication
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);

const bcrypt = require('bcrypt');
const saltRounds = 10;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// post Connectiondb
const conn = mongoose.createConnection('mongodb://localhost/postA', {useNewUrlParser: true,
useUnifiedTopology:true
});

// messagePost connectiondb
const conn2 = mongoose.createConnection('mongodb://localhost/messagePost', {useNewUrlParser: true,
useUnifiedTopology:true
});

// Register post
const conn3 = mongoose.createConnection('mongodb://localhost/registerPost', {useNewUrlParser: true,
useUnifiedTopology:true
});

// connect the mongoose
const store = new MongoDBSession({
  uri: "mongodb://localhost:27017/messagePost",
  collection: "model",
});

// catch errors
store.on('error', function(error){
  console.log(error);
});

// Use the moongoose sessions
app.use(require('express-session')({
  secret: "Key that will sign cookie",
  cookie:{
    maxAge : 1000*60*60*24*7
  },
  resave: true,
  saveUninitialized:false,
  store: store
}));

// Post Database
const Post = conn.model('Model', new mongoose.Schema({
  title : { type : String, default :   'model in postA database', required: true },
  content : { type : String, default : 'model in postA database', required: true}
}));

// Contact  Message Database
const Message  = conn2.model('Model', new mongoose.Schema({
  name : {type : String, default : 'model in messagePost database', required: true},
  message : {type : String, default: 'model in messagePost database', required: true},
  email : {type : String, default: 'model in messagePost database', required: true}
}));

// Register Database
const Register  = conn3.model('Model', new mongoose.Schema({
  user_name : {type : String, default : 'model in messagePost database', required: true},
  email : {type : String, default: 'model in messagePost database', required: true},
  password : {type : String, default: 'model in messagePost database', required: true}
}));

// Initial Page
app.get("/", function(req, res){
  res.render("pageinit");
});

// Register Route
app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", async function(req, res) {
  const {email, password} = req.body;
  // console.log(req.body.username);
  let user = await Register.findOne({email:email});
  if (user){
    return res.redirect("/login");
  }else{
  req.session.isAuth = true;
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const register = new Register({
      user_name: req.body.username,
      email: req.body.email,
      password: hash
    });
    // Store hash in your password DB.
    register.save(function(err) {
      if (!err) {
        res.redirect("/home");
      }
    });
  });}
});

// Login Route
app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res) {

  const email = req.body.email;
  const password = req.body.password;

  Register.findOne({email:email},  function(err, foundUser){
    bcrypt.compare(password, foundUser.password, function(err, result) {
      if(result){
        req.session.isAuth = true;
        res.redirect("/home");
      }else{
        console.log("User not found");
      }
    });
  });
});

//  home page
app.get("/home", function(req, res){
  // req.session.isAuth  = false;
  if (req.session.isAuth){
    Post.find({}, function(err, posts){
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
  }else{
    res.redirect("/");
  }
});

// compose page
app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title  : req.body.postTitle,
    content: req.body.postBody
  });

  post.save(function(err){
    if (!err){
        res.redirect("/home");
    }
  });
});

app.get("/posts/:postId", function(req, res){
const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("post", {
        title: post.title,
        content: post.content
      });
  });
});

// about page
app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

// contact Route
app.get("/contact", function(req, res){
  res.render("contact");
});
app.post("/contact", function(req, res){
  const message = new Message({
    name: req.body.name,
    message: req.body.message,
    email: req.body.email
  });
  message.save();
  res.redirect("/home");
});


// logout route
app.get("/logout", function(req, res){
  req.session.destroy(function(err){
    if (!err){
      res.render("logout");
    }
  });
});


//Inspiration route
app.get("/inspiration", function(req, res){
  res.render("inspiration");
});

// literature Route
app.get("/literature", function(req, res){
  res.render("literature");
});

//physics Route
app.get("/physics", function(req, res){
  res.render("physics");
});

// Programming Route
app.get("/Programming", function(req, res){
  res.render("Programming");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
