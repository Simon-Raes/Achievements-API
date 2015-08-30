var express = require('express');
var router = express.Router();
var gamesListTask = require("../scripts/gamesListTask.js");
var gameDetailsTask = require("../scripts/gameDetailsTask.js");

/*
* Downloads and stores a list of all steam games.
*/
router.get('/gameslist', function(req, res, next) {

  // TODO print out result here instead of in the task script.
  gamesListTask.downloadGamesList(req, res);
  res.send("done");

});


/*
* Downloads and stores the detailed info of a single game.
*/
router.get('/gamedetails/:id', function(req, res, next) {

  var inAppId = Number(req.params.id);

  gameDetailsTask.downloadGameDetails(req, res, inAppId);
  res.send("done");

});

module.exports = router;
