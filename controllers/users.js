var express = require('express');
var router = express.Router();

var User = require("../models/user").User;
var DetailedUser = require("../models/detaileduser").DetailedUser;

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
  User.findOne({"steamid":  req.params.steamid}, function(error, result) {
    if(result == undefined) {

      // User isn' known yet, download his info first
      userDetailsTask.downloadUserDetails(req, res, id);
      // TODO add a callback or something so the response can be sent once the game has been retrieved
      res.send("Try again in a couple of minutes.");
    }
    else {
      res.json(result);
    }
  });
});

module.exports = router;
