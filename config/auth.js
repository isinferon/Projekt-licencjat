module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "Musisz się zalogować!!");
    res.redirect("/users/login");
  },
};
