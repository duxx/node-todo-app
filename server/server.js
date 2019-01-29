const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')
const {authenticate} = require('./middleware/authenticate')

let app = express()
const port = process.env.port || 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Please, use endpoints [todos, users]')
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user)
})

app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password'])

    User.findByCredentials(body.email, body.password).then((user) => {
        user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user)
        })
    }).catch((e) => {
        res.status(400).send()
    })
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    })
})

app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password'])
    let user = new User(body)

    user.save().then((user) => {
        return user.generateAuthToken()
    }).then((token) => {
        res.header('x-auth', token).send(user)
    }).catch((e) => {
        console.log("Error", e)
        res.status(400).send()
    })
})

app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user.id
    }).then((todos) => {
        res.send({todos})
    }).catch((e) => {
        console.log("Error")
        res.status(400).send(e)
    })
})

app.get('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id
    if(!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findOne({
            _id: id,
            _creator: req.user._id
        }
    ).then((todo) => {
        if(!todo) {
            return res.status(404).send()
        }

        res.send({todo})
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.post('/todos', authenticate, (req, res) => {
    let todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    })

    todo.save().then((doc) => {
        res.send(doc)
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.patch('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['text', 'completed'])
    
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime()
    } else {
        body.completed = false
        body.completedAt = null
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, {$set: body}, {new: true}).then((todo) => {
        res.send(todo)
    }).catch((e) => {
        res.status(400).send()
    })
})

app.delete('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findOneAndRemove({
            _id: id,
            _creator: req.user.id
        }
    ).then((todo) => {
        if (!todo) {
            return res.status(404).send()
        }

        res.send({ todo })
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})