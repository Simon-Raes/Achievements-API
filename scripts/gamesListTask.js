var express = require('express');
var router = express.Router();

var request = require('request');
var Game = require("../models/game").Game;


exports.downloadGamesList = function(req, res, callback) {

  request('http://api.steampowered.com/ISteamApps/GetAppList/v2', function (error, response, body) {
    if (!error && response.statusCode == 200) {

      var json = JSON.parse(body);

      Game.remove({}, function(error, success){
        Game.collection.insert(json.applist.apps, function(callback){
          // TODO send this back with a callback instead of doing to response here.
          res.send("Saved " + json.applist.apps.length + " games.");
        });
      });
    }
  });

}
