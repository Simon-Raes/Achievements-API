var request = require('request');

var Game = require("../models/game").Game;
var DetailedGame = require("../models/detailedgame").DetailedGame;

/*
* Downloads and stores the stats for a single game. Pass in the game's appid to specificy which one.
*/

var gameSchemeJson;
var gameGlobalStatsJson;

var schemeReady = false, globalStatsReady = false;
var hasStats = false;
var numberOfAchievements = 0;

var appId;

var response;

/*
* Downloads the game's scheme: detailed info on achievements and stats.
*/

exports.downloadGameDetails = function(req, res, inAppId) {

  response = res;
  appId = inAppId;

  request('http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=EB5773FAAF039592D9383FA104EEA55D&appid=' + appId, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        gameSchemeJson = JSON.parse(body);
        schemeReady = true;

        // Check if the game has achievements or stats.
        if(gameSchemeJson.game.gameName != undefined)
        {
          numberOfAchievements = gameSchemeJson.game.availableGameStats.achievements.length;
          hasStats = ((gameSchemeJson.game.availableGameStats.stats != undefined) && (gameSchemeJson.game.availableGameStats.stats.length > 0));
        }

        combineData();
     }
  });

  /*
  * Downloads the global achievement percetages.
  */
  request('http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=' + appId, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        gameGlobalStatsJson = JSON.parse(body);
        globalStatsReady = true;

        combineData();
     }
  });

}

function combineData()
{
  if(schemeReady && globalStatsReady)
  {
    if(numberOfAchievements > 0 || hasStats)
    {
      gameSchemeJson.game.availableGameStats.achievements.forEach(function(item){
        // FIXME can this not just return an item instead of an array with 1 item?
        var globalPercentage = getGlobalPercentage(item.name)[0].percent;

        item.percent = globalPercentage;
      });

      saveData();
    }
    else {
      // Game has no achievements or stats
      updateGame();
    }
  }
}

/*
* Saves the game details to the detailedGames collection.
*/
function saveData() {
  if(numberOfAchievements > 0 || hasStats) {

    Game.findOne({appid:Number(appId)}, function (err, docs){

      if(err){console.log(err);}

        // Set the game name, since this field is often empty in the Steam scheme API.
        gameSchemeJson.game.gameName = docs.name;
        // Add the appId, could be useful.
        gameSchemeJson.game.appid = Number(appId);

        DetailedGame.find({appid:Number(appId)}).remove( function(){

            var detgame = new DetailedGame(gameSchemeJson.game);

            detgame.save(function(err){
              if(err){console.log(err);}
              updateGame();
            });
        });
      });
  }
  else {
    updateGame();
  }
}

/*
* Updates the game in the simple games table. Adds the hasStats and numberOfAchievements fields.
*/
function updateGame()
{
  console.log("Updating basic game");
  var conditions = {appid:Number(appId)};

  Game.update(
    conditions,
    {$set:
      {"hasStats":hasStats,
      "numberOfAchievements":Number(numberOfAchievements)}
    },
    {},
    function(e, docs)
    {
      console.log('All done.');
      response.send("Done.");
    }
  );
}

function getGlobalPercentage(searchName) {
  return gameGlobalStatsJson.achievementpercentages.achievements.filter(
    function(gameGlobalStatsJson) {
      return gameGlobalStatsJson.name == searchName;
    }
  );
}
