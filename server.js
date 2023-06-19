const express = require('express');
const PORT = 7000;
const foodItems = require('./data/foodItems');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const url = "mongodb://0.0.0.0:27017/resapp";
const app = express();
const User = require('./models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'JHBACDSBJHBAFH32@#$%^&*(4UGUY5G';

mongoose.connect(url).then((res) => {
  console.log('connected');
}).catch((e) => {
  console.log(e.message);
});

app.set('view engine', 'ejs');
// Middleware
app.use(express.static('public')); // for static files
app.use(bodyParser.json());
app.use(cookieParser());


const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
      jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.redirect('/login');
        } else {
          console.log(decodedToken);
          User.findById(decodedToken.id)
            .then(user => {
              req.user = {
                id: user._id,
                username: user.username,
              };
              next();
            })
            .catch(err => {
              console.log(err.message);
              res.redirect('/login');
            });
        }
      });
    } else {
      res.redirect('/login');
    }
  };
  

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: 'error', error: 'Invalid credentials' });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({
      id: user._id,
      username: user.username
    }, JWT_SECRET);

    res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.json({ status: 'ok', data: token });
  }

  res.json({ status: 'error', error: 'Invalid credentials' });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/login');
});

app.post('/api/signup', async (req, res) => {
  console.log(req.body);
  const { username, password: plainTextPassword } = req.body;

  if (!username || typeof username !== 'string') {
    return res.json({ status: 'error', error: 'Invalid username' });
  }

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({ status: 'error', error: 'Invalid password' });
  }

  if (plainTextPassword.length < 8) {
    return res.json({
      status: 'error',
      error: 'Password too small. Should be at least 8 characters'
    });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      password
    });
    console.log('User created successfully: ', response);
  } catch (error) {
    console.log(error);
    return res.json({ status: 'error', error: 'Username already in use' });
  }

  res.json({ status: 'ok' });
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/menu', requireAuth, (req, res) => {
  res.render('menu', { items: foodItems, user: req.user, orderHistory:req.user.orderHistory });
});
 

app.get('/confirmationPage', (req, res) => {
    res.render('confirmationPage');
  });

app.get('/userProfile', requireAuth, (req, res) => {
  res.render('userProfile', { user: req.user });
});
  
app.use((req,res) =>{
    res.sendFile('./views/404.html',{root:__dirname})
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
