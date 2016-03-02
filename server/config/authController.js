var jwt = require('jsonwebtoken');
var _ = require('lodash');

var secret = 'the cobra command';

module.exports = {

  /* checks token for route handling (when authenticate: true in app.js?) */
  authorize: function(req, res, next) {
    var token = req.body.token || req.headers['x-access-token'];

    if (token) {
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          console.error('JWT Verification Error', err);
          return res.status(403).send(err);
        } else {
          req.decoded = decoded;
          return next();
        }
      });
    } else {
      res.status(403).send('Token not provided');
    }
  },

  /* creates user token used for authentication site wide */
  createToken: function(user) {
    return jwt.sign(_.omit(user, 'password'), secret, {
      expiresIn: 24 * 60 * 60
    });
  }

};
