var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../models/user").User;
var Game = require("../models/game").Game;

var UserGameTask = require("../scripts/userGameTask.js");

var tasksStarted = 0;
var tasksCompleted = 0;

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
            Game.findOne({appid:Number(entry.appid)}, function (err, docs)
            {
              if(!err && (docs.hasStats || docs.numberOfAchievements > 0))
              {
                console.log("valid game: " + docs.name);

                tasksStarted++;

                var userGameTask = new UserGameTask(res, req, user, entry.appid);

                userGameTask.load(function(result)
                {
                  tasksCompleted++;
                  console.log("started " + tasksStarted + ", completed " + tasksCompleted);

                  if(tasksStarted == tasksCompleted)
                  {
                    res.send("all done");
                  }

                });

                console.log(tasksStarted + " tasks running");
              }
            });

            // TODO some kind of callback and counter to determine when all calls are finished and when everything has been saved in the database

          });
        }
      });
    }
  });
}
