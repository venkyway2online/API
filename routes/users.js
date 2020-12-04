var express = require('express');
var router = express.Router();
var logger = require('morgan');

var config = require('config');
let root = require('app-root-path');

let mail = require(root + '/services/mail.js');

let aes = require(root + '/services/aes.js');

const refreshTokenSecret = config.api.refreshToken;
const refreshTokens = [];

const accessTokenSecret = config.api.accessToken;

const jwt = require('jsonwebtoken');


router.get('/', function (req, res, next) {
  res.send('invalid request');
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403);
      }
      // console.log(user);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

let checkInpuObject = (req, res, next) => {
  let mandatory = ['email', 'name', 'password'];
  let optional = ['image'];
  let valid = true;
  if (req.body && (Object.keys(req.body).length === 3 || Object.keys(req.body).length === 4)) {
    Object.keys(req.body).forEach(field => {
      if (!(mandatory.includes(field) || optional.includes(field))) {
        valid = false;
      }
    })
  } else {
    valid = false;
  }
  if (valid) {
    next();
  } else {
    res.send({ status: 400, message: 'Invalid input' });
  }
}

let checkLoginObj = (req, res, next) => {
  let mandatory = ['email', 'password'];
  let valid = true;
  if (req.body && (Object.keys(req.body).length === 2)) {
    Object.keys(req.body).forEach(field => {
      if (!(mandatory.includes(field) || optional.includes(field))) {
        valid = false;
      }
    })
  } else {
    valid = false;
  }
  if (valid) {
    next();
  } else {
    res.send({ status: 400, message: 'Invalid  input' });
  }
}


function ValidateEmail(mail) {
  if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
    return (true)
  }
  return (false);
}


let validInput = (req, res, next) => {
  if (ValidateEmail(req.body.email)) {
    next();
  } else {
    res.send({ status: 400, message: 'Invalid email address' });
  }
}

router.post('/register', checkInpuObject, validInput, async (req, res) => {
  try {
    let user = await req.db.findOne(req.collections.users, { email: req.body.email });
    if (user) {
      res.send('user with this email already exists');
    } else {
      req.body.password = aes.encrypt(req.body.password);
      await req.db.insertOne(req.collections.users, req.body);
      await mail.mail(req.body.email, req.body.name);
      res.send({ status: 200, message: `Hi ${req.body.name} , Your registration successfull ` });
    }
  } catch (err) {
    console.log(err);
    res.send({ status: 500, message: "Internal server error" });
  }

})


router.get('/userDetails', authenticateJWT, async (req, res) => {
  try {
    let user = await req.db.findOne(req.collections.users, { email: req.user.username });
    if (user) {
      res.json({ status: 200, message: { username: user.name, email: user.email } });
    }
  } catch (err) {
    res.send({ status: 500, message: "Internal server error" });
  }
});

router.post('/login', checkLoginObj, validInput, async (req, res) => {
  let { email, password } = req.body;
  // console.log(email, password, req.collections.users);
  password = aes.encrypt(password);
  let user = await req.db.findOne(req.collections.users, { 'email': email, 'password': password });

  console.log(user);

  if (user) {
    const accessToken = jwt.sign({ username: user.email }, accessTokenSecret, { expiresIn: '20m' });
    const refreshToken = jwt.sign({ username: user.email }, refreshTokenSecret);

    refreshTokens.push(refreshToken);

    res.json({
      accessToken,
      refreshToken
    });
  } else {
    res.send('email or password incorrect');
  }
});

router.get('/token', (req, res) => {
  try {
    const token = req.headers.authorization;
    // const token = authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
      return res.sendStatus(403);
    }

    jwt.verify(token, refreshTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      const accessToken = jwt.sign({ username: user.username }, accessTokenSecret, { expiresIn: '20m' });

      res.json({
        accessToken
      });
    });
  } catch (err) {
    res.send({ status: 500, message: "Internal server error" });
  }

});


module.exports = router;
