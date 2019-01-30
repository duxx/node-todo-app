const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')
const {authenticate} = require('./middleware/authenticate')
const config = require('./config/config')

let app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Please, use endpoints [todos, users]')
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user)
})

app.post('/users/login', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password'])
        const user = await User.findByCredentials(body.email, body.password)
        const token = await user.generateAuthToken()
        res.header('x-auth', token).send(user)
    } catch(e) {
        res.status(400).send()
    }
})

app.delete('/users/me/token', authenticate, async (req, res) => {
    try {
        await req.user.removeToken(req.token)
        res.status(200).send()
    } catch(e) {
        res.status(400).send()
    }
})

app.post('/users', async (req, res) => {
    const body = _.pick(req.body, ['email', 'password'])
    try {
        const user = new User(body)
        await user.save()
        const token = await user.generateAuthToken()
        res.header('x-auth', token).send(user)
    } catch (e) {
        console.log("Error", e)
        res.status(400).send()
    }
})

app.get('/todos', authenticate, async (req, res) => {
    try {
        const todos = await Todo.find({_creator: req.user.id})
        res.send({ todos })
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

app.get('/todos/:id', authenticate, async (req, res) => {
    const id = req.params.id
    if(!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    try {
        const todo = await Todo.findOne({_id: id, _creator: req.user._id})
        if(!todo) {
            throw new Error(`Item ${id} cannot be found in your collection`)
        }
        res.send(todo)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

app.post('/todos', authenticate, async (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    })

    try {
        const doc = await todo.save()
        res.send(doc)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

app.patch('/todos/:id', authenticate, async (req, res) => {
    const id = req.params.id
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

    try {
        const todo = await Todo.findOneAndUpdate({
            _id: id,
            _creator: req.user._id
        }, { $set: body }, { new: true })
        res.send(todo)
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
})

app.delete('/todos/:id', authenticate, async (req, res) => {
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }

    try {
        const todo = await Todo.findOneAndRemove({_id: id, _creator: req.user.id})
        if(!todo) {
            throw new Error(`Unable to delete ${id}.`)
        }
        res.send({ todo })
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})