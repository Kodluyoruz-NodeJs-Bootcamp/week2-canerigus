require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./model/user');
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");


const app = express();
app.use(cookieParser());

const dbUrl = 'mongodb://localhost:27017/auth';

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'database connection error:'));
db.once('open', () => {
  console.log('Database connected!')
});

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'notasecret',
  cookie: {
    maxAge: 1000 * 60 * 60
  }
}));

//generating JWT token function.
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' })
}

//session checker function
const requireLogin = (req, res, next) => {
  if (!req.session.username) {
    return res.send('Session Not Found. <a href="/login">Login</a>')
  }
  next();
}

//jwt token authentication function.
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token
  if (token == null) return res.status(401).send('Token Not Found. <a href="/login">Login</a>')
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send('Token is not valid! <a href="/login">Login</a>')
    req.user = user
    next()
  })
}

app.get('/', (req, res) => {
  res.render('home')
})


app.get('/register', (req, res) => {
  res.render('register')
})

//register a user and save it in db.
app.post('/register', async (req, res) => {
  try {
    const { name, surname, username, password } = req.body;
    const user = await new User({ name, surname, username, password })
    await user.save();
    res.redirect('login')
  } catch (e) {
    res.send('Something went wrong!. Maybe the username or email already in use! Try again. <a href="/register">Go To Register </a>')
  }
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', async (req, res) => {
  try {
    //get username&password from body then correct it with the registered userbase.
    const { username, password } = req.body;
    const user = await User.findOne({ username })
    if (user) {
      if (user.username === username && user.password === password) {
        //after username & password correction, generate token for the user for specified minutes.

        const name = { name: username }
        console.log(name)
        const accessToken = await generateAccessToken(name)
        //jwt token generated and sent to client as cookie.
        res.cookie("token", accessToken, { httpOnly: true, sameSite: "strict" });
        //username added into session info.
        req.session.username = user.username
        res.redirect('users')
      } else {
        return res.send('Wrong username or password. <a href="/login">Go To Login</a>')
      }
    } else {
      return res.send('User not found. <a href="/login">Go To Login</a>')
    }
  } catch (e) {
    console.log('ERROR: in /login post.', e)
    res.redirect('login')
  }
})

//To access this route, User MUST be logged in (must have a session and a valid JWT token.) Otherwise, the access is denied.
app.get('/users', requireLogin, authenticateToken, async (req, res) => {
  //find the current user by session.
  //const user = await User.findOne({ username: req.session.username });
  //find the current user by token
  const user = await User.findOne({ username: req.user.name });
  //const name = req.user.name;
  const session = req.sessionID
  const token = req.cookies.token
  //token expiration date
  const expDate = new Date(req.user.exp * 1000).toLocaleString('tr-TR', { timeZone: 'Turkey' })
  //token initiation date
  const iatDate = new Date(req.user.iat * 1000).toLocaleString('tr-TR', { timeZone: 'Turkey' })
  res.render('users', { user, session, token, expDate, iatDate })
})

app.all('*', (req, res) => {
  res.status(404).send('Page not Found')
})

const port = 3000;

app.listen(port || 3000, () => {
  console.log(`Serving on port ${port}`);
});