var express = require('express');
var router = express.Router();

var pg = require('pg');
var async = require('async')
var request = require('request');

var Game = require("../models/game").Game;

exports.downloadGamesList = function(req, res, callback) {

  request('http://api.steampowered.com/ISteamApps/GetAppList/v2', function (error, response, body) {
    if (!error && response.statusCode == 200) {

      var json = JSON.parse(body);
      var conString = "postgres://postgres:admin@localhost/simong";

      pg.connect(conString, function(err, client, done) {
        if(err) {
          console.log(err);
        }
        console.log("success!");

        var count = json.applist.apps.length;

        var queries = [];

        json.applist.apps.forEach(function(entry)
        {
          //console.log("now saving  " + entry.appid + " " + entry.name);


          // TODO find and replace apostrophes '
          var escapedName = entry.name;

          var f = function(callback){
            client.query("INSERT INTO games VALUES (" + entry.appid +", '" + escapedName + "');"
            , function(err, result){
              if(err) {
                // TODO conflict resolution, or just update to postgres 9.5 for UPSERT
                console.log("insert error " + err);
              }
              console.log("saved " + entry.appid);
              
            }
            );

          }

          queries.push(f);

        });

        console.log(queries.length);



        async.series([queries[0], queries[1]]);

        /*, function(err, results){
          // TODO figure out why it never reaches this completion block
          // and why series doesn't progress past the first query
          console.log("done queries");
          if(err)
          {
            console.log("err " + err);
          }
          done();
        });*/
      });
    }
  });
}
