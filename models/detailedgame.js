var mongoose = require("mongoose");

var DetailedGameSchema = new mongoose.Schema({
  appid: {
    type: Number,
    index: true
  },
  name: String,
  version: Number,
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
  }
});

var DetailedGame = mongoose.model("DetailedGame", DetailedGameSchema);

module.exports = {
  DetailedGame: DetailedGame
}
