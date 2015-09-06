var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  steamid: {
    type: String,
    index: true
  },
  name: String,
  image: String,
  url: String,
  numberOfAchievements: Number,
  perfectGames: Number
});

var User = mongoose.model("User", UserSchema);

module.exports = {
  User: User
}
