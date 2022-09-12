// require all the packages that we need  
require('dotenv').config()
const express = require('express');
const bodyParser=require('body-parser');
const ejs = require('ejs');
const mongoose=require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');


//define the app and the port 
const app = express() ;
const port = 3000 ;


// set up the view engine , static folder  and use body parser,
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded(({extended:true})));


//set up sessions and passport 
app.use(session({
    secret:"our little secret ",
    resave:false,
    saveUninitialized:false,
}))
app.use(passport.initialize());
app.use(passport.session());


//set up mongodb 
mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema =new mongoose.Schema({
    username:String,
    password:String,
});
userSchema.plugin(passportLocalMongoose);
const User =mongoose.model('User', userSchema);  
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//the app routs 
app.get('/', (req, res) => {
    res.render("home");
});
app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect('/login');
    }
});

app.get('/logout',(req,res)=>{
    req.logout(function(err) {
        if (err) { 
            console.log(err);
        }else{
            res.redirect('/');
        }
        });
});

app.post('/register', function (req, res) {
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets");
            })
        }
    })
});
app.post('/login',(req, res)=>{
    const user =new User({
        username:req.body.username,
        password:req.body.password,
    });
    req.logIn(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect('/secrets');
            });
        }
    });
});






app.listen(port, () => console.log(`Example app listening on port ${port}!`));
