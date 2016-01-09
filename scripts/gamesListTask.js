var express = require('express');
var router = express.Router();

var pg = require('pg');
var async = require('async');
var request = require('request');

exports.downloadGamesList = function(req, res, callback) {

  request('http://api.steampowered.com/ISteamApps/GetAppList/v2', function (error, response, body) {
    if (!error && response.statusCode == 200) {

      var json = JSON.parse(body);

      pg.connect(constants.CONNECTION_STRING, function(err, client, done) {
        if(err) {
          console.log(err);
        }
        console.log("success!");

        var count = json.applist.apps.length;

        var queries = [];

        json.applist.apps.forEach(function(entry)
        {
          //console.log("now saving  " + entry.appid + " " + entry.name);


          // Escape all apostrophes.
          var escapedName = entry.name.split("'").join("''");

          var f = function(callback)
          {
            client.query("INSERT INTO games VALUES (" + entry.appid +", '" + escapedName + "') "+
            "ON CONFLICT (appid) DO UPDATE SET name = excluded.name;", function(err, result){
              if(err) {
                // TODO conflict resolution, or just update to postgres 9.5 for UPSERT
                console.log("insert error " + err);
                console.log(escapedName);
              }
              callback(null, "done");
              // console.log("saved " + entry.appid);

            });
          };

          queries.push(f);

        });

        async.series(queries, function(err, results){
          // TODO figure out why it never reaches this completion block
          // and why series doesn't progress past the first query
          console.log("done queries");
          if(err)
          {
            console.log("err " + err);
          }
          done();
          callback("done");
        });
      });
    }
  });
};
