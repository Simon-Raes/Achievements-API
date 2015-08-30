var express = require('express');
var router = express.Router();

// api call test
var request = require('request');

/* GET users listing. */
router.get('/', function(req, res, next) {
  var db = req.db;
  var collection = db.get('games');
  collection.find({},function(e,docs){
    res.json(docs);
  });
});


router.get('/:appid', function(req, res, next) {
  var db = req.db;
  var collection = db.get('detailedgames');
  var number = Number(req.params.appid);

  collection.findOne({appid:number}, function(e, docs){
    res.json(docs);
  });
});

/*
router.get('/:appid', function(req, res, next) {
  var db = req.db;
  var collection = db.get('games');
  var number = Number(req.params.appid);

  collection.findOne({appid:number}, function(e, docs){
    res.json(docs);
  });
});
*/

module.exports = router;
