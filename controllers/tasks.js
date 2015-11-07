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
  // TODO send some better data here ("task queued" or something), the task is not yet done when this is returned!
  res.send("done");
});

/**Downloads info for a single user*/
router.get('/user/:steamid', function(req, res, next) {

  usersTask.downloadUserDetails(req, res, req.params.steamid);
  // TODO send some better data here ("task queued" or something), the task is not yet done when this is returned!
  res.send("done");

});

module.exports = router;
