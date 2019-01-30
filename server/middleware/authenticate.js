let {User} = require('./../models/user')

let authenticate = async (req, res, next) => {
    const token = req.header('x-auth')
    try {
        const user = await User.findByToken(token)
        if(!user) {
            throw new Error(`User with token ${token} was not found`)
        }
        req.user = user
        req.token = token
    } catch (e) {
        console.log(e)
        res.status(401).send()
    }
    /* User.findByToken(token).then((user) => {
        if (!user) {
            return Promise.reject()
        }

        req.user = user
        req.token = token
        next()
    }).catch((e) => {
        console.log("Error!")
        res.status(401).send(e)
    }) */
}

module.exports = {authenticate}