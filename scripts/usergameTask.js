var express = require('express');
var router = express.Router();
var request = require('request');
var RateLimiter = require('limiter').RateLimiter;
// var limiter = new RateLimiter(1, 'second');

//TODO clean up unused imports
var User = require("../models/user").User;
var UserDetails = require("../models/detaileduser").DetailedUser;
var UserGame = require("../models/usergame").UserGame;
var Game = require("../models/game").Game;

var DetailedGame = require("../models/detailedgame").DetailedGame;


var req;
var res;
var user;
var inAppId;

module.exports = UserLoader;

function UserLoader(req, res, inUser, inAppId)
{
  this.req = req;
  this.res = res;
  this.user = inUser;
  this.inAppId = inAppId;
}

UserLoader.prototype.load = function(callback)
{
  var dbGame;
  var userGameStats;

  var localAppId = this.inAppId;
  var localUser = this.user;


  // Load the Game from the database
  Game.findOne({appid:Number(localAppId)}, function (err, docs)
  {
    if(err){console.log(err);}

    dbGame = docs;

    // Load the user's stats for this game from the API
    request('http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=' + localAppId + '&key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + localUser.steamid, function (error, response, body)
    {
      //console.log(response);
      if(error)
      {
        console.log(error);
        callback(0,0);
        return;
      }

      var jsonParsed = JSON.parse(body);

      if(jsonParsed.playerstats !== undefined && jsonParsed.playerstats !== null)
      {
        userGameStats = jsonParsed.playerstats;

        if(dbGame !== undefined && dbGame !== null && userGameStats !== undefined && userGameStats !== null)
        {
          // WARNING this will never work if the game is not yet in the database
          if(dbGame.numberOfAchievements > 0 || dbGame.hasStats)
          {
            var userGame = new UserGame({
              steamid: localUser.steamid,
              appid: dbGame.appid,
              name: dbGame.name,
              stats: userGameStats.stats,
              achievements: userGameStats.achievements
            });

            UserGame.remove({appid: userGame.appid, steamid: userGame.steamid}, function(error, success){
              if(error){console.log(error);}

              userGame.save(function (err, userGame) {
                if(err){console.log(err);}

                // TODO: maybe clean up duplicate values here, some of them are already contained in the userGame.
                callback(localAppId, userGame, userGameStats.achievements.length, dbGame.numberOfAchievements);
              });
            });
          }
          else
          {
            callback(localAppId, null, 0, 0);
          }
        }
        else
        {
          callback(localAppId, null, 0, 0);
        }
      }
      else
      {
        callback(localAppId, null, 0, 0);
      }
    });
  });
};



// Use this somewhere else

      // var achievements = jsonParsed.playerstats.achievements;
      //
      // var totalAchievements = 0;
      // var earnedAchievements = achievements.length;
      //
      // // update user's total number of achievements
      // user.numberOfAchievements = user.numberOfAchievements + earnedAchievements;
      //
      // // load the game from the database
      // Game.findOne({appid:Number(entry.appid)}, function (err, docs)
      // {
      //   if(err){console.log(err);}
      //
      //   totalAchievements = docs.numberOfAchievements;
      // });
