var mongoose = require("mongoose");

var DetailedUserSchema = new mongoose.Schema({
  steamid: {
    type: String,
    index: true
  },
  name: String,
  image: String,
  url: String,
  numberOfAchievements: Number,
  perfectGames: Number,
  games : [{
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
  }
]
});

var DetailedUser = mongoose.model("DetailedUser", DetailedUserSchema);

module.exports = {
  DetailedUser: DetailedUser
};
