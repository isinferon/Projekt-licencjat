const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

//User model
const User = require('../models/User');


//Login page
router.get('/login', (req, res) => {
    res.render('login');
})

//Register page
router.get('/register', (req, res) => {
    res.render('register');
});

//Register handle
router.post('/register', (req, res) => {
    console.log(req.body);
    const { name, email, password, password2 } = req.body;
    let errors = [];
  
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Uzupełnij wszystkie pola' });
    }
  
    if (password != password2) {
      errors.push({ msg: 'Hasłą nie są identyczne' });
    }
  
    if (password.length < 6) {
      errors.push({ msg: 'Hasło musi zawierąć minimum 6 znaków' });
    }
  
    if (errors.length > 0) {
      res.render('register', {
        errors,
        name,
        email,
        password,
        password2
      });
    }else{
        // Validation passed
        User.findOne({ email: email})
        .then(user => {
            if(user){
                //User exists
                errors.push({ msg: 'Email jest zajety'})
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2
                  });
            }else{
                const newUser = new User({
                    name,
                    email,
                    password
                });

                // Hash password
                bcrypt.genSalt(10, (err, salt) => 
                bcrypt.hash(newUser.password, salt, (err, hash)  => {
                    if(err) throw err;
                    //Set password to hashed
                    newUser.password = hash;
                    //Save user
                    newUser.save()
                    .then(user => {
                        req.flash('success_msg', ' Zarejestrowałeś się pomyślnie');
                        res.redirect('/users/login');
                    })
                    .catch(err => conosle.log(err));
                }))
            }
        });
    }
});

//Login handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash:true
  })(req, res, next);
})


//Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'Wylogowałes się pomyślnie');
  res.redirect('/users/login');
})

module.exports = router;