const express = require('express'); 
const mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
// var todoController = require('./controllers/todoController');

const app = express();

//PAssport config
require('./config/passport')(passport);

//DB config
var db = require('./config/keys').MognoURI;

// Connect to mongo

mongoose.connect(db, { useNewUrlParser: true})
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err))

//EJS
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({ extended: false})); 

// Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//Statyczne polaczniee
app.use('/assets', express.static('styles')); 


// ROUTES 
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/dashboard', require('./routes/dashboard'));


// Fire controllers
// todoController(app);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`))
