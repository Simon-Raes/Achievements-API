var request = require('request');
var async = require('async');
var pg = require('pg');

var Game = require("../models/game").Game;
var DetailedGame = require("../models/detailedgame").DetailedGame;

/*
* Downloads and stores the stats for a single game. Pass in the game's appid to specificy which one.
*/

var appId;

var response;

var callback;


exports.downloadGameDetails = function(req, inRes, inAppId, inCallback) {

  console.log("ss ");
  response = inRes;
  appId = inAppId;
  callback = inCallback;

  /*
  * Downloads the game's scheme: detailed info on achievements and stats.
  */
  var one = function(callback){
    request('http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=EB5773FAAF039592D9383FA104EEA55D&appid=' + appId, function (error, response, body) {

      if (!error && response.statusCode == 200)
       {
        callback(null, JSON.parse(body));
      }
      else
      {
        callback(error, null);
      }
    });
  };

  /*
  * Downloads the global achievement percetages.
  */
  var two = function(callback){
    request('http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=' + appId, function (error, response, body) {

      if (!error && response.statusCode == 200)
      {
        callback(null, JSON.parse(body));
      }
      else
      {
        callback(error, null);
      }
    });
  };

  async.parallel([one, two], function(err, results){

    if(err)
    {
      console.log("err " + err);
    }
    // combine data

    var gameSchemeJson = results[0];
    var game = gameSchemeJson.game;
    var gameGlobalStatsJson = results[1];
    var globalAchievements = gameGlobalStatsJson.achievementpercentages.achievements;

    // Check if the game has achievements or stats.
    var numberOfAchievements = 0;
    var hasStats = false;

    if(game.gameName !== undefined && game.gameName !== null)
    {
      numberOfAchievements = game.availableGameStats.achievements.length;
      hasStats = ((game.availableGameStats.stats !== undefined && game.availableGameStats.stats !== null) && (game.availableGameStats.stats.length > 0));
    }

    if(numberOfAchievements > 0 || hasStats)
    {




      var conString = "postgres://postgres:admin@localhost/simong";
      pg.connect(conString, function(err, client, done)
      {
        var queries = [];

        if(hasStats)
        {
          game.availableGameStats.achievements.forEach(function(item){

            var statsQuery = function(callback)
            {
              client.query("INSERT INTO stats VALUES ('" + item.name + "', '" + item.displayName + "', '" + appId + "') " +
              "ON CONFLICT DO UPDATE SET name = exluded.name, displayName = exluded.displayName, appid = excluded.appid;", function(err, result)
              {
                if(err) {
                  console.log("stats insert error " + err);
                }
                callback(null, "stats insert done");
              });
            };
            queries.push(statsQuery);
          });
        }

        // Need to loop over all achievements to add their global percentage
        game.availableGameStats.achievements.forEach(function(item){
          // FIXME can this not just return an item instead of an array with 1 item?

          console.log(item.name);

          var globalPercentage = getGlobalPercentage(globalAchievements, item.name.toLowerCase())[0].percent;
          item.percent = globalPercentage;

          var achievementsQuery = function(callback)
          {
            client.query("INSERT INTO achievements VALUES ('" +
            item.name + "', '" +
            item.displayName + "', " +
            item.hidden + ", '" +
            item.description + "', '" +
            item.icon + "', '" +
            item.icongray + "', " +
            appId + ") " +
            "ON CONFLICT DO UPDATE SET name = exluded.name, displayName = excluded.displayName, hidden = excluded.hidden, description = excluded.description, icon = excluded.icon, icongray = excluded.icongray, appid = excluded.appid;", function(err, result)
            {
              if(err) {
                console.log("achievement insert error " + err);
              }
              callback(null, "achievement insert done");
            });
          };
          queries.push(achievementsQuery);
        });

        // Execute all queries
        async.series(queries, function(err, results)
        {
          if(err)
          {
            console.log("err " + err);
          }
          done();
          console.log("done.");
        });

      });






      // Game.findOne({appid:Number(appId)}, function (err, docs){
      //
      //   if(err){console.log(err);}
      //
      //   // Set the game name, since this field is often empty in the Steam scheme API.
      //   game.name = docs.name;
      //   // Add the appId, could be useful.
      //   game.appid = Number(appId);
      //
      //   /*
      //   * Saves the game details to the detailedGames collection.
      //   */
      //
      //
      //
      //   // todo this needs to save to gamestats and gameachievements, not 1 game record
      //   DetailedGame.find({appid:Number(appId)}).remove( function(){
      //
      //     var detgame = new DetailedGame(gameSchemeJson.game);
      //
      //     callback(detgame);
      //
      //     detgame.save(function(err){
      //       if(err){console.log(err);}
      //
      //       /*
      //       * Updates the game in the simple games table. Adds the hasStats and numberOfAchievements fields.
      //       todo this can be removed
      //
      //       */
      //       Game.update(
      //         {appid:Number(appId)},
      //         {$set:
      //           {"hasStats":hasStats,
      //           "numberOfAchievements":Number(numberOfAchievements)}
      //         },
      //         {},
      //         function(e, docs)
      //         {
      //           console.log('All done.');
      //         }
      //       );
      //     });
      //   });
      // });
    }
    else {
      // Game has no achievements or stats
      invalidGame();
    }
  });

};








function invalidGame()
{
  console.log("invalid game detected");
  callback(null);
}

function getGlobalPercentage(globalAchievements, searchName) {
  return globalAchievements.filter(
    function(gameGlobalStatsJson) {
      return gameGlobalStatsJson.name.toLowerCase() == searchName;
    }
  );
}
