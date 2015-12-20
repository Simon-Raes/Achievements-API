var express = require('express');
var router = express.Router();

var Game = require("../models/game").Game;
var DetailedGame = require("../models/detailedgame").DetailedGame;

var gameDetailsTask = require("../scripts/gameDetailsTask.js");

var pg = require('pg');


/* GET a list of all games. */
router.get('/', function(req, res, next) {
  Game.find({}, function(error, result){
    res.json(result);
  });
});

/* GET the details of a single game. */
router.get('/:appid', function(req, res, next) {

  var number = Number(req.params.appid);

  DetailedGame.findOne({"appid":number}, function(error, result) {
    if(result == undefined) {
      // Game isn't known yet, download it first
      gameDetailsTask.downloadGameDetails(req, res, number, function callback(result)
      {
        console.log("in callback");
        if(result != undefined)
        {
          res.json(result);
        }
        else
        {
          res.send("Game has no achievements or stats. ");
        }
      });
      // TODO add a callback or something so the response can be sent once the game has been retrieved
      //res.send("Try again in a minute.");
    }
    else {
      res.json(result);
    }
  });
});


module.exports = router;
