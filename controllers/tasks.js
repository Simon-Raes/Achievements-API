var express = require('express');
var router = express.Router();

var gamesTask = require("../scripts/gamesListTask.js");
var usersTask = require("../scripts/userDetailsTask.js");

// TODO a less dumb system for running scripts

/*
* Downloads and stores a list of all steam games.
*/
router.get('/games', function(req, res, next) {

  gamesTask.downloadGamesList(req, res);
  res.send("done");

});

/**Downloads info for a single user*/
router.get('/user/:steamid', function(req, res, next) {

  usersTask.downloadUserDetails(req, res, req.params.steamid);
  res.send("done");

});

module.exports = router;
