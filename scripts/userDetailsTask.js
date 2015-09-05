var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../models/user").User;
var UserDetails = require("../models/detaileduser").DetailedUser;
var UserGame = require("../models/usergame").DetailedUser;



exports.downloadUserDetails = function(req, res, inSteamId)
{






  // Download the user's info: name, image, etc

  // Download his gamesList
  //http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=76561197966399275&format=json

  // For every game on the list, do a stats for game for user call:
  //http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=440&key=EB5773FAAF039592D9383FA104EEA55D&steamid=76561197966399275



  // TODO: use inSteamId once testing is done, using an account with a low amount of games and achievements for testing here
  var userId = "76561198075926354";

  // Download user info
  request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=EB5773FAAF039592D9383FA104EEA55D&steamids=' + userId, function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {

      var userJson = JSON.parse(body).response.players[0];

      var user = new User({
        steamid: inSteamId,
        name: userJson.personaname,
        image: userJson.avatarfull,
        url: userJson.profileurl
      });

      // all good up to this point!

      // Download list of games
      request('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userId, function (error, response, body)
      {
        if (!error && response.statusCode == 200)
        {
          var games = JSON.parse(body).response.games;

          // Get the stats for every game
          games.forEach(function(entry)
          {
            request('http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid='+entry.appid+'&key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userId, function (error, response, body)
            {
              // do something with those stats
              console.log("got game " + entry.appid);

              // TODO
              // for every game downloaded:

              // store the gameforuser info in the usergame collection

              // store the needed info in the user collection
              // increase the user totalAchievements counter based on the number of achieved achievements of that game
              // increase the perfect games counter if he has all achievements

              // store the gameforuser info in the detaileduser collection

              // TODO some kind of counter to determine when all calls are finished and when everything has been saved in the database
            });
          });

        }
      });
    }
  });

}
