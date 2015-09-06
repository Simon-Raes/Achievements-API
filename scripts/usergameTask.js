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

var dbGame;
var userGameStats;

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

UserLoader.prototype.load = function()
{
  // Load the Game from the database
  Game.findOne({appid:Number(this.inAppId)}, function (err, docs){
    if(err){console.log(err);}

    this.dbGame = docs;
    console.log(this.dbGame);
    updateUserGame();

  });

  // Load the user's stats for this game from the API
  request('http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=' + this.inAppId + '&key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + this.user.steamid, function (error, response, body)
  {
    var jsonParsed = JSON.parse(body);

    if(jsonParsed.playerstats != undefined)
    {
      this.userGameStats = jsonParsed.playerstats;
      updateUserGame();
    }
    else
    {
      // user has no stats or achievements (game might not have any)
    }
  });
}


function updateUserGame()
{
  // WHY ARE THESE UNDEFINED AGAIN AFTER SETTING THEM?
  console.log("dbgame "+ this.dbGame);
  console.log("usergamestats "+ this.userGameStats);

  if(this.dbGame != undefined && this.userGameStats != undefined)
  {
    console.log("going");
    // WARNING this will never work if the game is not yet in the database
    if(this.dbGame.numberOfAchievements > 0 || this.dbGame.hasStats)
    {
      var userGame = new UserGame({
        steamid: this.user.steamid,
        appid: this.dbGame.appid,
        name: this.dbGame.name,
        stats: this.userGameStats.stats,
        achievements: this.userGameStats.achievements
      });

      UserGame.remove({appid: userGame.appid, steamid: userGame.steamid}, function(error, success){
        if(error){console.log(error);}

        userGame.save(function (err, userGame) {
          if(err){console.log(err);}

          // TODO: we're done, alert something
          console.log("did save");
        });
      });
    }
    else
    {
      console.log("invalid game");
    }
  }
  else
  {
    console.log("not yet");
  }
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
