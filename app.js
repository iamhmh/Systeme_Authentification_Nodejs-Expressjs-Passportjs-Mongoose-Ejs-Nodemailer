const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const app = express();
const expressEjsLayout = require('express-ejs-layouts')
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");

require('./config/passport')(passport)

mongoose.connect('mongodb://127.0.0.1:27017/node_auth',{useNewUrlParser: true, useUnifiedTopology : true})
.then(() => console.log('Vous êtes maintenant connecté à MongoDB !'))
.catch((err)=> console.log(err));


app.set('view engine','ejs');
app.use(expressEjsLayout);

app.use(express.urlencoded({extended : false}));

app.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req,res,next)=> {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error');
    next();
})

app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));

app.listen(3000);