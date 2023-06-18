const express = require('express');

const router = express.Router();

router.get('/', (req,res) =>{
    res.render('home');
})

router.get('/login',(req,res) =>{
    res.render('login')
})

router.get('/signup',(req,res) =>{
    res.render('signup')
})

router.get('/menu',(req,res) =>{
    res.render('menu')
})

module.exports = router;