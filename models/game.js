var mongoose = require("mongoose");

var GameSchema = new mongoose.Schema({
  appid: {
    type: Number,
    index: true
  },
  name: String,
  hasStats: Boolean,
  numberOfAchievements: Number
});

var Game = mongoose.model("Game", GameSchema);

module.exports = {
  Game: Game
};
