# Basic Authentication Example

### Description
The project creates a user info and saves it into local 'auth' mongo database with /register route, creates sessionID and JWT Token with post to /login route and then checks the credentials at get /users route.

### User
No restrictions applied to the user info, it only must be string and unique. So, a user can register with a username of 'a' and a password of 'a'. Also, No hashing applied to the password.

### How It Works
After a user is registered, user can now login fron the /login route. The login route creates a JWT token and a sessionID which includes the username. 

Logged in users can now access /users route to check their info. Info consists the name, surname, username, sessionID, JWT token, JWT initiation and expiration date. 

Currently, sessionID saved for 60minutes and JWT token is for 30seconds. /users route checks for sessionID first and then JWT Token with middlewares. If one of them expired, user cannot access to /users route and must login again. 

Session info can be checked via req.sessionID and JWT Token is sent via res.cookie to the client.