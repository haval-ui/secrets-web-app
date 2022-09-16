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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');


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
    googleId:String,
    facebookId:String,
    secret:String,
});
//set up and use passport & auth2.0 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User =mongoose.model('User', userSchema);  
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
}); 
passport.deserializeUser(function(id, done) { 
    User.findById(id, function(err, user) {
    done(err, user);
    }); 
});

//set up login with facebook and google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
    function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user,created) {
        return cb(err, user);
    });
}
));
passport.use(new FacebookStrategy({
    clientID:process.env.FACEBOOK_APP_ID,
    clientSecret:process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
));

//the home app routs .
app.get('/', (req, res) => {
    res.render("home");
});
// login with google  set up .
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

    app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});
//log in with facebook set up .
app.get('/auth/facebook',
    passport.authenticate('facebook')
);
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
    res.redirect('/secrets');
});

// login app rout 
    app.get('/login', (req, res) => {
    res.render("login");
});
// register app rout 
app.get('/register', (req, res) => {
    res.render("register");
});

//secrets page rout 
app.get('/secrets',(req,res)=>{
    User.find({"secret":{$ne:null}},(err,foundUsers)=>{
        if(err){
            console.log(err);
        }else{
            if (foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers});
            }
        }
    });
});
// functionality of the logout button and logout rout.
app.get('/logout',(req,res)=>{
    req.logout(function(err) {
        if (err) { 
            console.log(err);
        }else{
            res.redirect('/');
        }
        });
});

//set up the submit rout.
app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect('/login');
    }
})
//collect the data from the submit rout .
app.post('/submit',(req,res)=>{
    const submittedSecret= req.body.secret
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(()=>{
                    res.redirect('/secrets');
                });
            }
        }
    });
}); 
// collect the send data from register rout and saving it to the db .
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
// collect the nd data from the login rout and checking it. 
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





// define the app local host rout.
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
