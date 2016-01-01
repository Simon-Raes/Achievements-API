// detailed stats for 1 game for 1 user

var mongoose = require("mongoose");

var UserGameSchema = new mongoose.Schema({
  steamid:{
    type: String,
    index: true
  },
  appid: {
    type: String,
    index: true
  },
    name: String,
    stats: [{
      name: String,
      value: Number
    }],
    achievements: [{
      name: String,
      achieved: Boolean
    }]
});

var UserGame = mongoose.model("UserGame", UserGameSchema);

module.exports = {
  UserGame: UserGame
};
