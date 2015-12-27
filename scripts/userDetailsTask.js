var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../models/user").User;
var DetailedUser = require("../models/detaileduser").DetailedUser;

var Game = require("../models/game").Game;

var userGameTask = require("../scripts/userGameTask.js");
var pg = require('pg');
var async = require('async');

exports.downloadUserDetails = function(req, res, inSteamId)
{
  console.log("download user");
  // TODO: use inSteamId once testing is done, using an account with a low amount of games and achievements for testing here
  // var userId = "76561198075926354";

  // hardcoded kip id
  var userId = "76561197960378945";
  // var userId = inSteamId;

  // TODO: API sometimes sends back an HTML error, handle that instead of crashing completely

  // Download user info
  request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=EB5773FAAF039592D9383FA104EEA55D&steamids=' + userId, function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      var userJson = JSON.parse(body).response.players[0];

      // todo don't commit credentials
      var conString = "postgres://postgres:admin@localhost/simong";

      pg.connect(conString, function(err, client, done)
      {
        if(err) {
          console.log(err);
        }
        console.log("success!");
        client.query("INSERT INTO users VALUES (" + userJson.steamid +", '"+userJson.personaname+"', '"+userJson.avatarfull+"', '"+userJson.profileurl+"');", function(err, result)
        {
          console.log("saved user");
          done();
        });
      });

      // Download list of the games owned by this user
      request('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + userJson.steamid, function (error, response, body)
      {
        if(error)
        {
          console.log("error downloading user's games: " + err);
        }
        if (!error && response.statusCode == 200)
        {
          console.log("downloaded user games!" + userId);
          var games = JSON.parse(body).response.games;

          // Counter to know when all games have been checked.
          var numberOfGames = games.length;


          // Get the stats for every game
          var gamesArray = [];
          var queries = [];

          pg.connect(conString, function(err, client, done)
          {

            if(err)
            {
              console.log(err);
            }


            games.forEach(function(entry)
            {
              var f = function(callback)
              {
                // todo clear user's games first
                client.query("INSERT INTO usergames VALUES (" + userJson.steamid + ", " + entry.appid + ");", function(err, result)
                {
                  if(err) {
                    // TODO conflict resolution, or just update to postgres 9.5 for UPSERT
                    console.log("insert error " + err);
                  }
                  callback(null, "done");
                  console.log("saved " + entry.appid);

                });
              };

              queries.push(f);
            });


            async.series(queries, function(err, results)
            {
              console.log("done queries");
              if(err)
              {
                console.log("err " + err);
              }
              done();
            });
          });
        }
      });
    }
  });
};
