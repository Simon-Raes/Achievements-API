var express = require('express');
var router = express.Router();
var request = require('request');

//TODO clean up unused imports
var User = require("../models/user").User;
var UserDetails = require("../models/detaileduser").DetailedUser;
var UserGame = require("../models/usergame").UserGame;
var Game = require("../models/game").Game;

var DetailedGame = require("../models/detailedgame").DetailedGame;


// TODO
// for every game downloaded:

// store the gameforuser info in the usergame collection

// store the needed info in the user collection
// increase the user totalAchievements counter based on the number of achieved achievements of that game
// increase the perfect games counter if he has all achievements

// store the gameforuser info in the detaileduser collection



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

UserLoader.prototype.load = function(inCallback)
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
      console.log("found stats for id " + localAppId);
      var jsonParsed = JSON.parse(body);

      if(jsonParsed.playerstats != undefined)
      {
        userGameStats = jsonParsed.playerstats;

        if(dbGame != undefined && userGameStats != undefined)
        {
          // WARNING this will never work if the game is not yet in the database
          if(dbGame.numberOfAchievements > 0 || dbGame.hasStats)
          {
            // TODO steamId is not correct after saving as number, make it a String!
            var userGame = new UserGame({
              steamid: localUser.steamid,
              appid: dbGame.appid,
              name: dbGame.name,
              stats: userGameStats.stats,
              achievements: userGameStats.achievements
            });

            console.log("about to remove usergame info");

            UserGame.remove({appid: userGame.appid, steamid: userGame.steamid}, function(error, success){
              if(error){console.log(error);}

              console.log("about to save usergame info");

              userGame.save(function (err, userGame) {
                if(err){console.log(err);}

                inCallback("ok! " + localAppId);

                // TODO: we're done, alert something
                console.log("did save usergame info");
              });
            });
          }
        }
      }
    });
  });
}


function updateUserGame()
{

}


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
