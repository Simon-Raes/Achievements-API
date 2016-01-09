var express = require('express');
var router = express.Router();
var async = require('async');
var pg = require('pg');

var constants = require('../util/constants');

var gamesTask = require("../scripts/gamesListTask.js");
var usersTask = require("../scripts/userDetailsTask.js");
var gameDetailsTask = require("../scripts/gameDetailsTask.js");

// TODO a less dumb system for running scripts

/*
* Downloads and stores a list of all steam games. Basic info only.
*/
router.get('/games', function(req, res, next) {

  gamesTask.downloadGamesList(req, res, function(result){
    res.send(result);
  });
});


/*
*Downloads the detailed info of all games.
*/
router.get('/detailed', function(req, res, next) {
  var queries = [];

  loadGames(function(error, result){

    // Limited to the first 50 for testing
    // todo, try without limit! :o
    for (i = 0; i < 50; i++) {
      // var funcGameDetails = ;
      queries.push(makeGameFunction(req, res, result, i));
    }

    // Execute all queries
    async.parallel(queries, function(err, results)
    {
      if(err)
      {
        //res.send("err");
        console.log("err " + err);
      }
      res.send("done");
      console.log("done...");
    });

  });
});

/**Downloads info for a single user*/
router.get('/user/:steamid', function(req, res, next) {

  usersTask.downloadUserDetails(req, res, req.params.steamid);
  // TODO send some better data here ("task queued" or something), the task is not yet done when this is returned!
  res.send("done");

});


/*
*Utils
*/
function makeGameFunction(req, res, result, i) {
    return function(callback){
      gameDetailsTask.downloadGameDetails(req, res, result[i].appid, function taskCallback(error, result){

        if(error)
        {
          callback(true, null);
          return;
        }
        else
        {
          callback(false, result);
          return;
        }
      });
    };
}

// TODO: this is duplicated from games.js
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
        return;
      }

      if(result === undefined || result === null || result.rows.length === 0)
      {
        callback("no results", null);
        return;
      }
      else
      {
        callback(null, result.rows);
        return;
      }
      done();
    });
  });
}

module.exports = router;
