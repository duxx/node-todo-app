const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')

let app = express()
const port = process.env.port || 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Please, use endpoints [todos, users]')
})

app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password'])
    let user = new User(body)

    user.save().then((user) => {
        res.send(user)
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({todos})
    }).catch((e) => {
        console.log("Error")
        res.status(400).send(e)
    })
})

app.get('/todos/:id', (req, res) => {
    let id = req.params.id
    if(!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findById(id).then((todo) => {
        if(!todo) {
            return res.status(404).send()
        }

        res.send({todo})
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text
    })

    todo.save().then((doc) => {
        res.send(doc)
    }).catch((e) => {
        console.log("Error")
        res.status(400).send()
    })
})

app.patch('/todos/:id', (req, res) => {
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

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
        res.send(todo)
    }).catch((e) => {
        res.status(400).send()
    })
})

app.delete('/todos/:id', (req, res) => {
    let id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    Todo.findByIdAndRemove(id).then((todo) => {
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