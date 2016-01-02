var express = require('express');
var router = express.Router();
var pg = require('pg');

var userDetailsTask = require("../scripts/userDetailsTask.js");

/* GET a list of all users. */
router.get('/', function(req, res, next) {
  User.find({}, function(error, result){
    res.json(result);
  });
});

/* GET the details of a single user. */
  // TODO: make this accept some parameter to force a refresh
router.get('/:steamid', function(req, res, next) {


  var conString = "postgres://postgres:admin@localhost/achievements";

  pg.connect(conString, function(err, client, done)
  {
    if(err) {
      console.log(err);
    }

    client.query("SELECT * FROM users WHERE steamid = " + req.params.steamid + ";", function(error, result)
    {
      if(error)
      {
        console.log(error);
      }
      if(result === undefined || result === null || result.rows.length === 0)
      {
        userDetailsTask.downloadUserDetails(req, res, req.params.steamid, function(error, result){
          if(!error)
          {
            res.json(result);
          }
          else {
            res.send("errored");
          }
        });
      }
      else {
        res.json(result.rows[0]);
      }
      done();
    });
  });
});

module.exports = router;
