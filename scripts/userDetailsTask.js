var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../models/user").User;
var DetailedUser = require("../models/detaileduser").DetailedUser;

var Game = require("../models/game").Game;

var userGameTask = require("../scripts/userGameTask.js");
var pg = require('pg');

exports.downloadUserDetails = function(req, res, inSteamId)
{
  console.log("fuckaroro");
  // TODO: use inSteamId once testing is done, using an account with a low amount of games and achievements for testing here
  // var userId = "76561198075926354";

  // hardcoded kip id
  //var userId = "76561197960378945";
  var userId = inSteamId;

  // TODO: API sometimes sends back an HTML error, handle that instead of crashing completely

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






    // todo don't commit credentials
    var conString = "postgres://postgres:admin@localhost/simong";

    pg.connect(conString, function(err, client, done) {
      if(err) {
        console.log(err);
      }
      console.log("success!");
      client.query("INSERT INTO users VALUES (" + userId +", '"+userJson.personaname+"', '"+userJson.avatarfull+"', '"+userJson.profileurl+"');")
      {
        console.log("saved user");
        done();
      }
    });









      // Download list of the games owned by this user
      request('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userId, function (error, response, body)
      {
        if (!error && response.statusCode == 200)
        {
          console.log("downloaded user games!" + userId);
          var games = JSON.parse(body).response.games;


          // Values to set for the User after all games have been checked.
          var achievementCount = 0;
          var perfectedGames = 0;
          // Counter to know when all games have been checked.
          var numberOfGames = games.length;
          var counter = 0;

          // Get the stats for every game
          var gamesArray = [];

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
                UserGameTask.load(function callback(appId, game, achieved, total)
                {
                  achievementCount += achieved;

                  if(game != null)
                  {
                    gamesArray.push(game);
                    console.log(game);
                  }

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

                    // TODO: the same for detaileduser

                    DetailedUser.find({steamid:userId}).remove( function(){
                      var composedUser = new DetailedUser({
                        steamid: user.steamid,
                        name: user.name,
                        image: user.image,
                        url: user.url,
                        numberOfAchievements: user.numberOfAchievements,
                        perfectGames: user.perfectGames,
                        games: gamesArray
                      });
                      composedUser.save(function(err){
                        if(err){console.log(err);}
                        console.log("saved detaied user!");
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
