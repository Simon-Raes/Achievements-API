var express = require('express');
var router = express.Router();
var pg = require('pg');

var constants = require('../util/constants');

var userDetailsTask = require("../scripts/userDetailsTask.js");

/* GET a list of all users. */
router.get('/', function(req, res, next) {

  pg.connect(constants.CONNECTION_STRING, function(err, client, done)
  {
    if(err) {
      console.log(err);
    }

    client.query("SELECT * FROM users;", function(error, result)
    {
      if(error)
      {
        console.log(error);
        res.send("errored");
      }
      else
      {
        res.json(result.rows);
      }
    });
  });
});

/* GET the details of a single user. */
  // TODO: make this accept some parameter to force a refresh of that user's data
router.get('/:steamid', function(req, res, next) {

  pg.connect(constants.CONNECTION_STRING, function(err, client, done)
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
            res.send("error");
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
