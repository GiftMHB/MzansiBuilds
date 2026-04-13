const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('../utils/db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with Google provider
      let user = await query(
        'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
        ['google', profile.id]
      );
      
      if (user.rows.length === 0) {
        // Check if email exists (maybe registered with email/password)
        const existingUser = await query(
          'SELECT * FROM users WHERE email = $1',
          [profile.emails[0].value]
        );
        
        if (existingUser.rows.length > 0) {
          // Link Google account to existing email user
          user = await query(
            'UPDATE users SET provider = $1, provider_id = $2 WHERE email = $3 RETURNING *',
            ['google', profile.id, profile.emails[0].value]
          );
        } else {
          // Create new user
          user = await query(
            `INSERT INTO users (email, name, provider, provider_id, avatar_url, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [profile.emails[0].value, profile.displayName, 'google', profile.id, profile.photos[0]?.value, true]
          );
        }
      }
      
      return done(null, user.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;