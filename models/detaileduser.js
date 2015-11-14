var mongoose = require("mongoose");

var DetailedUserSchema = new mongoose.Schema({
  steamid: {
    type: String,
    index: true
  },
  name: String,
  image: String,
  games : [{
    appid: {
      type: Number,
      index: true
    },
    name: String,
    achieved: Number,
    total: Number
  }]
});

var DetailedUser = mongoose.model("DetailedUser", DetailedUserSchema);

module.exports = {
  DetailedUser: DetailedUser
}
