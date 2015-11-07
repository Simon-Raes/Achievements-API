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

      // Download list of the games owned by this user
      request('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userId, function (error, response, body)
      {
        if (!error && response.statusCode == 200)
        {
          var games = JSON.parse(body).response.games;

          // Values to set for the User after all games have been checked.
          var achievementCount = 0;
          var perfectedGames = 0;
          // Counter to know when all games have been checked.
          var numberOfGames = games.length;
          var counter = 0;

          // Get the stats for every game
          games.forEach(function(entry)
          {
            Game.findOne({appid:Number(entry.appid)}, function (err, docs)
            {
              if(err || (!docs.hasStats && docs.numberOfAchievements <= 0))
              {
                // TODO fix this, this is somehow never true, but there should definitely be some games in the DB that do not have achievements.
                //counter++;
              }
              else
              {
                var UserGameTask = new userGameTask(res, req, user, entry.appid);

                UserGameTask.load(function callback(appId, achieved, total)
                {
                  achievementCount += achieved;

                  if(total != 0 && achieved >= total)
                  {
                    perfectedGames ++;
                  }

                  counter ++;
                  if(counter == numberOfGames)
                  {
                    user.numberOfAchievements = achievementCount;
                    user.perfectGames = perfectedGames;

                    // Delete the user's old data and save the new one.
                    User.find({steamid:userId}).remove( function(){

                      user.save(function(err){
                        if(err){console.log(err);}
                        console.log("saved user!");
                      });
                    });
                  }
                });
              }
            });
          });
        }
      });
    }
  });
}
