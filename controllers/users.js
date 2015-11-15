var express = require('express');
var router = express.Router();

var User = require("../models/user").User;
var DetailedUser = require("../models/detaileduser").DetailedUser;
var UserGame = require("../models/usergame").UserGame;

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

  // TODO: make this return a DetailedUser if that ever gets used.
  DetailedUser.findOne({"steamid":  req.params.steamid}, function(error, result) {
    if(result == undefined) {


      // User isn't known yet, download his info first
      userDetailsTask.downloadUserDetails(req, res, req.params.steamid);
      // TODO add a way to send the info once it has been retrieved and saved
      res.send("Now downloading. Will be available later.");
    }
    else
    {
      DetailedUser.find({"steamid":result.steamid}, function(error, user) {

        // TODO: ? create DetailedUser when downloading instead of every time it's queried
        // var composedUser = new DetailedUser({
        //   steamid: result.steamid,
        //   name: result.name,
        //   image: result.image,
        //   url: result.url,
        //   numberOfAchievements: result.numberOfAchievements,
        //   perfectGames: result.perfectGames,
        //   games: gameResult
        // });

        res.json(user);
      });
    }
  });
});

module.exports = router;
