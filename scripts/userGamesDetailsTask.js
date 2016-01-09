// what do here?
var express = require('express');
var router = express.Router();
var request = require('request');
var pg = require('pg');
var async = require('async');

exports.gameDetails = function(appid, steamid, mainCallback){
  console.log(appid);

  var conString = "postgres://postgres:admin@localhost/achievements";


  request('http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=' + appid + '&key=EB5773FAAF039592D9383FA104EEA55D&steamid=' + steamid, function (error, response, body)
  {

    if(error)
    {
      mainCallback(error, null);
      return;
    }


    var jsonParsed = JSON.parse(body);

    if(jsonParsed.playerstats !== undefined && jsonParsed.playerstats !== null)
    {
      pg.connect(conString, function(err, client, done)
      {
        userGameStats = jsonParsed.playerstats;
        var queries = [];

        if(userGameStats.achievements !== undefined && userGameStats.achievements !==null)
        {
          userGameStats.achievements.forEach(function(item){

            item.name = item.name.split("'").join("''");

            var funcAchievements = function(callback)
            {
              client.query("INSERT INTO userachievements VALUES (" + steamid + ", " + appid + ", '" + item.name + "') "+
              "ON CONFLICT (steamid, appid, name) DO NOTHING;", function(err, result)
              {
                if(err) {
                  callback(error, null);
                  console.log("insert error: " + err);
                  return;
                }
                callback(null, "insert done");
              });
            };  
            queries.push(funcAchievements);
          });

        }

        if(userGameStats.stats !== undefined && userGameStats.stats !==null)
        {
          userGameStats.stats.forEach(function(item){

            item.name = item.name.split("'").join("''");

            var funcStats = function(callback)
            {
              client.query("INSERT INTO userstats VALUES (" + steamid + ", " + appid + ", '" + item.name + "', '" + item.value + "') "+
              "ON CONFLICT (steamid, appid, name) DO UPDATE SET value = excluded.value;", function(err, result)
              {
                if(err) {
                  callback(error, null);
                  console.log("insert error: " + err);
                  return;
                }
                callback(null, "insert done");
              });
            };
            queries.push(funcStats);

          });
        }

        async.parallel(queries, function(err, results)
        {
          if(err)
          {
            console.log("err " + err);
          }
          done();
          console.log("very much done");
          mainCallback(null, "done");
        });
      });

    }
  });
};
