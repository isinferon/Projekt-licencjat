const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated} = require ('../config/auth')
// const Bodyparser = require('body-parser');

//User model
const User = require('../models/User');
const { db } = require('../models/User');
const bodyParser = require('body-parser');

//BMI page
router.get('/bmi', ensureAuthenticated,  (req, res) => 
    res.render('bmi', {
        user: req.user
    }));
  

    
    
    
    // Dodanie BMi do bazy i sprawdzenie czy sa zpaelnione pola
    router.post('/bmi', (req, res) => {
        const{ waga, wzrost} = req.body;
        const goodWzrost = wzrost / 100;
        const BMI = waga / goodWzrost / goodWzrost;
        
        
        let errors = [];
    if(!waga || !wzrost){
        errors.push({msg : 'Uzupełnij wszystkie pola'})
    }
    
    if (errors.length > 0) {
        res.render('bmi', {
            errors,
            wzrost,
            waga
        });
    }else{
        User.findOneAndUpdate({_id: req.user._id}, {$set: { bmi: BMI.toFixed(2)}}, {new: true}, (err, doc) => {
            res.redirect('/dashboard/bmi');
            console.log(doc);
        });
        
    }
})

var data = [{item: 'get milk'}, {item: 'walk dog'}, {item: 'kick'}];
// var urlEncodedParser = bodyParser.urlencoded({extended: false});

//TODO page
// ensureAuthenticated
router.get('/todo',  (req, res) => {
    res.render('todo', {
        user: req.user,
        todos: data
    })});
router.post('/todo', (req, res) => {
    data.push(req.body);
    console.log(req.body);
    res.render('todo', {todos: data});
        });
        
router.delete('/todo/:item',  (req, res) => {
    data = data.filter(function(todo) {
        return todo.item.replace(/ /g, '-') !== req.params.item;
    })
    res.render('todo', {todos: data});
    

    });
    

    





module.exports = router;