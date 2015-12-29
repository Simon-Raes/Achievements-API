var express = require('express');
var router = express.Router();
var request = require('request');

var userGameTask = require("../scripts/userGameTask.js");
var pg = require('pg');
var async = require('async');

// Downloads and stores info about the user and his list of games
// User: steamid, name, avatar, profile url
// Games: appid
exports.downloadUserDetails = function(req, res, userId)
{
  // TODO: use incoming userId once testing is done, using an account with a lower amount of games and achievements for testing here (kip):
  userId = "76561197960378945";

  // TODO: API sometimes sends back an HTML error, handle that instead of crashing completely

  // Download user info
  request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=EB5773FAAF039592D9383FA104EEA55D&steamids=' + userId, function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      var userJson = JSON.parse(body).response.players[0];

      var queries = [];

      // todo don't commit credentials
      var conString = "postgres://postgres:admin@localhost/simong";

      pg.connect(conString, function(err, client, done)
      {
        if(err) {
          console.log(err);
        }
        console.log("success!");
        client.query("INSERT INTO users VALUES (" + userJson.steamid +", '"+userJson.personaname+"', '"+userJson.avatarfull+"', '"+userJson.profileurl+"') "+
        "ON CONFLICT DO UPDATE SET name = exluded.name, image = excluded.image, url = excluded.url;", function(err, result)
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

          pg.connect(conString, function(err, client, done)
          {
            if(err) console.log(err);

            // First clear the user's games
            var clearF = function(callback)
            {
              client.query("DELETE FROM ONLY usergames WHERE steamid = '" + userJson.steamid + "';", function(err, result)
              {
                if(err) {
                  console.log("delete error " + err);
                }
                callback(null, "clear done");
              });
            };
            queries.push(clearF);

            // Then insert the new list of his games
            games.forEach(function(entry)
            {
              var f = function(callback)
              {
                client.query("INSERT INTO usergames VALUES (" + userJson.steamid + ", " + entry.appid + ");", function(err, result)
                {
                  if(err) {
                    console.log("insert error: " + err);
                  }
                  callback(null, "insert done");
                  console.log("saved " + entry.appid);

                });
              };

            queries.push(f);
            });

            // Execute all queries
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
