// require all the packages that we need  
const express = require('express');
const bodyParser=require('body-parser');
const ejs = require('ejs');
const mongoose=require('mongoose')



//define the app and the port 
const app = express() ;
const port = 3000 ;


// set up the view engine , static folder  and use body parser,
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded(({extended:true})));

//set up mongodb 
mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema =new mongoose.Schema({
    email:String,
    password:String,
});
const User =mongoose.model('User', userSchema);  
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

app.post('/register', function (req, res) {
    const newUser=new User({
        email:req.body.username,
        password:req.body.password,
    });
    newUser.save((err)=>{
        if(err){
            console.log(err);
        }else{
            console.log("user added successfully");
            res.render("secrets");
        }
    });
});
app.post('/login',(req, res)=>{
    User.findOne({email:req.body.username},(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === req.body.password){
                    res.render("secrets");
                }
            }
        }
    });
});






app.listen(port, () => console.log(`Example app listening on port ${port}!`));
