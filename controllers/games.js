var express = require('express');
var router = express.Router();
var pg = require('pg');

var constants = require('../util/constants');

var gameDetailsTask = require("../scripts/gameDetailsTask.js");


/*
* GET a list of all games. Basic info only (appid and name).
*/
router.get('/', function(req, res, next) {
  loadGames(function(error, result){
    console.log(result);
    if(error)
    {
      res.send("error occurred");
    }
    else
    {
      res.json(result);
    }
  });
});



/*
* GET the details of a single game.
TODO: also include its achievements and stats
*/
router.get('/:appid', function(req, res, next) {
  console.log("onde");

  var number = Number(req.params.appid);

  pg.connect(constants.CONNECTION_STRING, function(err, client, done)
  {
    if(err) {
      console.log(err);
    }

    client.query("SELECT * FROM games WHERE appid = " + req.params.appid + ";", function(error, result)
    {
      if(error)
      {
        console.log(error);
      }

      if(result === undefined || result === null || result.rows.length === 0)
      {
        gameDetailsTask.downloadGameDetails(req, res, number, function callback(error, result){
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


function loadGames(callback){

  pg.connect(constants.CONNECTION_STRING, function(err, client, done)
  {
    if(err) {
      callback(error, null);
    }

    client.query("SELECT * FROM games;", function(error, result)
    {
      if(error)
      {
        callback(error, null);
      }

      if(result === undefined || result === null || result.rows.length === 0)
      {
        callback("no results", null);
      }
      else
      {
        callback(null, result.rows);
      }
      done();
    });
  });
}


module.exports = router;
