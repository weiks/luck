var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

// Quarters client
var Quarters = require('node-quarters')
// Create quarters client
var quartersClient = new Quarters({
  key: 'jkj9W0ZhxAPUdDR6Cq5b',
  webSecret: 'aw4mvm5oxgqdtrsobn8ntujqz0rc8kn9',
  secret: '7y4wp1kz1g8kw58jhav6w2ie0r4vqkkphg1gtnabk9a7zz0zh3y9ff',
  address: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  quartersURL: 'https://dev.pocketfulofquarters.com',
  apiURL: 'https://api.dev.pocketfulofquarters.com/v1/'
})

// app
var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

//
// Routes
//
app.get('/', function(req, res, next) {
  return res.render('index')
})

app.post('/code', function(req, res, next) {
  var code = req.body.code

  // create refresh token for user and fetch user
  return quartersClient
    .createRefreshToken(code)
    .then(function(data) {
      // get refresh_token
      var refresh_token = data.refresh_token

      // get access_token
      var access_token = data.access_token

      // send refresh token
      return res.json({
        refreshToken: refresh_token
      })
    })
    .catch(function(e) {
      return res.status(400).json({
        message: (e.data && e.data.message) || e.message
      })
    })
})

// play
const rewards = {50: 12, 25: 25, 10: 75} // very important
app.post('/play', function(req, res, next) {
  // get user id from request body (get it from cookie instead)
  var userId = req.body.userId
  var chance = req.body.chance
  var txId = req.body.txId
  var requestId = req.body.requestId

  // check if user wins (Can write one-liner but this explains better)
  var won = false
  if (chance === 50) {
    won = Math.random() < 0.5
  } else if (chance === 25) {
    won = Math.random() < 0.25
  } else if (chance === 10) {
    won = Math.random() < 0.1
  }

  if (won && rewards[chance]) {
    // get amount
    const amount = rewards[chance]

    return quartersClient
      .transferQuarters({
        amount: amount,
        user: userId
      })
      .then(function() {
        return res.json({
          won: true,
          amount: amount
        })
      })
      .catch(function(e) {
        console.log(e)
        return res.status(400).json({
          message: (e.data && e.data.message) || e.message
        })
      })
  } else {
    return res.json({
      won: false
    })
  }
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app