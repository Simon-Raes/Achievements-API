var request = require('request');
var async = require('async');
var pg = require('pg');

/*
* Downloads and stores the stats for a single game. Pass in the game's appid to specificy which one.
*/

var appId;
var response;
var callback;


exports.downloadGameDetails = function(req, inRes, inAppId, inCallback) {

  console.log(inAppId);
  response = inRes;
  appId = inAppId;
  callback = inCallback;

  /*
  * Downloads the game's scheme: detailed info on achievements and stats.
  */
  var one = function(callback){
    request('http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=EB5773FAAF039592D9383FA104EEA55D&appid=' + appId, function (error, response, body) {

      var r = JSON.parse(body);
      console.log("fml");
      console.log(r);
      if (!error && response.statusCode == 200 && r !== null && r.game !== null)
      {
        callback(null, r);
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

    if(gameSchemeJson === undefined || gameSchemeJson === null)
    {
      inCallback("error", "error");
      return;
    }

    var game = gameSchemeJson.game;
    var gameGlobalStatsJson = results[1];
    var globalAchievements;
    if(gameGlobalStatsJson !== null)
    {
      globalAchievements = gameGlobalStatsJson.achievementpercentages.achievements;
    }

    // Check if the game has achievements or stats.
    var numberOfAchievements = 0;
    var hasStats = false;

    if(game.gameName !== undefined && game.gameName !== null)
    {
      numberOfAchievements = (game.availableGameStats.achievements === null || game.availableGameStats.achievements === undefined) ? 0 : game.availableGameStats.achievements.length;
      hasStats = ((game.availableGameStats.stats !== undefined && game.availableGameStats.stats !== null) && (game.availableGameStats.stats.length > 0));
    }

    if(globalAchievements !== undefined && globalAchievements !== null && (numberOfAchievements > 0 || hasStats))
    {

      var conString = "postgres://postgres:admin@localhost/achievements";
      pg.connect(conString, function(err, client, done)
      {
        var queries = [];

        if(hasStats)
        {
          game.availableGameStats.stats.forEach(function(item){

            item.displayName = item.displayName.split("'").join("''");
            var statsQuery = function(callback)
            {
              client.query("INSERT INTO stats VALUES ('" + item.name + "', '" + item.displayName + "', '" + appId + "') " +
              "ON CONFLICT (name) DO UPDATE SET displayName = excluded.displayName, appid = excluded.appid;", function(err, result)
              {
                if(err) {
                  console.log("stats insert error " + err);
                  callback(err, "error");
                  return;
                }
                callback(null, "stats insert done");
                return;
              });
            };
            queries.push(statsQuery);
          });
        }

        if(numberOfAchievements > 0)
        {
          // Need to loop over all achievements to add their global percentage
          game.availableGameStats.achievements.forEach(function(item){

            console.log(item.name);

            var globalPercentage = getGlobalPercentage(globalAchievements, item.name.toLowerCase()).percent;
            item.percent = globalPercentage;
            item.displayName = (item.displayName === null || item.displayName === undefined) ? "" : item.displayName.split("'").join("''");
            item.description = (item.description === null || item.description === undefined) ? "" : item.description.split("'").join("''");

            var achievementsQuery = function(callback)
            {
              client.query("INSERT INTO achievements VALUES ('" +
              item.name + "', '" +
              item.displayName + "', " +
              (item.hidden == 1 ? true : false) + ", '" +
              item.description + "', '" +
              item.icon + "', '" +
              item.icongray + "', " +
              appId + ") " +
              "ON CONFLICT (name) DO UPDATE SET displayName = excluded.displayName, hidden = excluded.hidden, description = excluded.description, icon = excluded.icon, icongray = excluded.icongray, appid = excluded.appid;", function(err, result)
              {
                if(err) {
                  console.log("achievement insert error " + err);
                  callback(error, "error");
                  return;
                }
                callback(null, "achievement insert done");
                return;
              });
            };
            queries.push(achievementsQuery);
          });
        }

        // Execute all queries
        async.series(queries, function(err, results)
        {
          if(err)
          {
            console.log("err " + err);
          }
          done();
          console.log("done.");
          inCallback(null, "done");
          return;
        });

      });
    }
    else {
      // Game has no achievements or stats
      console.log("invalid game detected");

      inCallback(true, null);
    }
  });
};


function getGlobalPercentage(globalAchievements, searchName) {
  return globalAchievements.filter(
    function(gameGlobalStatsJson) {
      return gameGlobalStatsJson.name.toLowerCase() == searchName;
    }
  )[0];
}
