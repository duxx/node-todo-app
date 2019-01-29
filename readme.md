# Node.js + Express.js + MongoDB ToDo REST API

## Installation

> npm install 

> cp ./server/config/config.example.json ./server/config/config.json

Set JWT secret and, if needed, adjust MongoDB path in ./server/db/mongoose.js

> node server/server.js


## Usage

- Register new account by POST /users with email and password
- Login existing account by POST /users/login with email and password
- Logout by DELETE /users/me/token

- List todos GET /todos
- Show a todo GET /todos/:id
- Add todo POST /todos with text
- Modify/complete a todo PATCH /todos/:id with text and/or completed
- Delete a todo DELETE /todos/:id

## Notes

- User passwords are encrypted using bcryptjs
- JWT tokens are generated on POST /users and POST /users/login
- Include x-auth token in request headers for other routes