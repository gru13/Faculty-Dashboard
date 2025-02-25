const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

module.exports = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }
});
