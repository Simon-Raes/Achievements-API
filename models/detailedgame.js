var mongoose = require("mongoose");

var DetailedGameSchema = new mongoose.Schema({

  gameName: String,
  gameVersion: Number,
  availableGameStats: {
      stats: [{
        name: String,
        defaultvalue: Number,
        displayName: String
      }],
      achievements: [{
        name: String,
        defaultvalue: Number,
        displayeName: String,
        hidden: Number,
        description: String,
        icon: String,
        icongray: String,
        percent: Number
      }]
  },
  appid: {
    type: Number,
    index: true
  }


});

var DetailedGame = mongoose.model("DetailedGame", DetailedGameSchema);

module.exports = {
  DetailedGame: DetailedGame
}
