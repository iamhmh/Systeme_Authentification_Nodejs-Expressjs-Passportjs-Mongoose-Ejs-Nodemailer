const express = require('express');
const router = express.Router();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const passport = require('passport');
const crypto = require('crypto');
const transporter = require('../config/nodemailer');

router.get('/login',(req,res)=>{
    res.render('login');
});

router.get('/register',(req,res)=>{
    res.render('register');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg : "Please fill in all fields" });
  }

  if (password !== password2) {
    errors.push({ msg : "Passwords don't match" });
  }

  if (password.length < 6 ) {
    errors.push({ msg : 'Password should be at least 6 characters long' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors: errors,
      name: name,
      email: email,
      password: password,
      password2: password2
    });
  } else {
    User.findOne({ email: email }).exec()
      .then(user => {
        if (user) {
          errors.push({ msg: 'Email already registered' });
          res.render('register', { errors, name, email, password, password2 });
        } else {
          const newUser = new User({ name, email, password });

          bcrypt.genSalt(10)
            .then(salt => bcrypt.hash(newUser.password, salt))
            .then(hash => {
              newUser.password = hash;
              return newUser.save();
            })
            .then(user => {
              req.flash('success_msg', 'You have now registered!');
              res.redirect('/users/login');
            })
            .catch(err => console.log(err));
        }
      })
      .catch(err => console.log(err));
  }
});

router.get('/logout', (req, res) => {
  req.logout;
  req.flash('success_msg', 'Now logged out');
  res.redirect('/users/login');
});

router.get('/forgot', (req, res) => {
  res.render('forgot');
});

router.post('/forgot', async (req, res) => {
  const token = crypto.randomBytes(20).toString('hex');

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
      req.flash('error', "Aucun compte n'est associé à cet e-mail.");
      return res.redirect('/users/forgot');
  }

  await User.findOneAndUpdate(
    { email: req.body.email },
    {
      $set: {
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
    }
  );

  const mailOptions = {
      to: user.email,
      from: 'uriel82@ethereal.email',
      subject: 'Réinitialisation du mot de passe',
      text: `Vous recevez ce message parce que vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe de votre compte.
              Veuillez cliquer sur le lien suivant ou copier/coller dans votre navigateur pour compléter le processus:
              http://${req.headers.host}/users/reset/${token}
              Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet e-mail.`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.log(err);
      req.flash('error', "Une erreur s'est produite lors de l'envoi de l'e-mail. Réessayez plus tard.");
      return res.redirect('/users/forgot');
    }
    req.flash('success', 'Un e-mail avec des instructions supplémentaires a été envoyé à ' + user.email + '.');
    res.redirect('/users/login');
  });
});

router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

  if (!user) {
      req.flash('error', 'Le token de réinitialisation du mot de passe est invalide ou a expiré.');
      return res.redirect('/users/forgot');
  }

  res.render('reset', { token: req.params.token });
});

router.post('/reset/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

  if (!user) {
      req.flash('error', 'Le token de réinitialisation du mot de passe est invalide ou a expiré.');
      return res.redirect('/users/forgot');
  }

  if (req.body.password !== req.body.confirmPassword) {
      req.flash('error', 'Les mots de passe ne correspondent pas.');
      return res.redirect('back');
  }

  bcrypt.genSalt(10)
  .then(salt => bcrypt.hash(req.body.password, salt))
  .then(async hash => {
    user.password = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    req.flash('success', 'Votre mot de passe a été modifié avec succès.');
    res.redirect('/users/login');
  })
  .catch(err => {
    req.flash('error', "Une erreur s'est produite lors de la réinitialisation du mot de passe.");
    return res.redirect('back');
  });
});

module.exports = router;