const express = require('express');
const router = express.Router();
var app = express(); // mengambil Variable atau Import program
const { ensureAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

 app.get('/', function(req,res,next) { // Menambil data dari GPS dan mengirimkan nya kembali ke html 
   res.render(__dirname + '/maps.html');
 });

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
    user: req.user
  })
);

module.exports = router;
