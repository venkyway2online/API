var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();


var root = require("app-root-path");
const mongoCon = require(root + "/db/db.mongo.service.js");
const config = require('config');

let uri = config.mongodb.uri;

var DB;
const collections = config.mongodb.collections;

let getMongoConnection = () => {
  return new Promise((resolve, reject) => {
    if (!DB) {
      mongoCon.connect(uri, config.mongodb.db)
        .then(db => {
          DB = new mongoCon.op(db);
          resolve();
        })
        .catch(err => {
          reject(err);
        })
    } else {
      resolve();
    }
  })

}

let getDbConnection = async (req, res, next) => {
  try {
    await getMongoConnection();
    req.db = DB;
    req.collections = collections;
    next();
  } catch (err) {
    logger.logError(err);
    res.end('connection failure')
  }
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(config.api.port);
console.log("server listening on port:", config.api.port);
var userRoute = require('./routes/users');

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};
app.use(allowCrossDomain);
app.use('/user', getDbConnection, userRoute);
app.use('/', function (req, res) {
  res.end("invalid request")
});

app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
