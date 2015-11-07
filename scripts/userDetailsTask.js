var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../models/user").User;
var Game = require("../models/game").Game;

var userGameTask = require("../scripts/userGameTask.js");

exports.downloadUserDetails = function(req, res, inSteamId)
{
  // TODO: use inSteamId once testing is done, using an account with a low amount of games and achievements for testing here
  // var userId = "76561198075926354";

  // hardcoded kip id
  var userId = "76561197960378945";


  // Download user info
  request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=EB5773FAAF039592D9383FA104EEA55D&steamids=' + userId, function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      var userJson = JSON.parse(body).response.players[0];

      var user = new User({
        steamid: userId,
        name: userJson.personaname,
        image: userJson.avatarfull,
        url: userJson.profileurl,
        numberOfAchievements: 0,
        perfectGames: 0
      });

      // Download list of games
      request('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userId, function (error, response, body)
      {
        if (!error && response.statusCode == 200)
        {
          var games = JSON.parse(body).response.games;

          console.log("found " + games.length + " games for this user.");

          // Get the stats for every game
          games.forEach(function(entry)
          {
            // Do this for every game for this user

            // TODO first check if this game even has achievements or stats - only start the next part if it does
            Game.findOne({appid:Number(entry.appid)}, function (err, docs)
            {
              if(err || (!docs.hasStats && docs.numberOfAchievements <= 0))
              {
                console.log("invalid game " + err);
              }
              else
              {
                console.log("valid game: " + docs.name);

                var UserGameTask = new userGameTask(res, req, user, entry.appid);
                UserGameTask.load();
              }
            });

            // TODO some kind of callback and counter to determine when all calls are finished and when everything has been saved in the database

          });
        }
      });
    }
  });
}
