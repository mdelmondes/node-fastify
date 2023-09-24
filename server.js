//import { DatabaseMemory } from "./database-memory.js"
import { DatabasePostgres } from "./database-postgres.js"
import { fastify } from "fastify"
import fastifyJwt from '@fastify/jwt'
import cors from "@fastify/cors"
import bcrypt from "bcrypt"


const database = new DatabasePostgres()
const server = fastify()

server.register(fastifyJwt, {
    secret: process.env.SECRET
})

server.register(cors, {
    origin: true
})

server.decorate("authenticate", async (req, res) => {
    try {
        await req.jwtVerify()
    } catch (error) {
        return res.status(401).send({msg: error})
    }
})

server.post('/videos', {onRequest: [server.authenticate]}, async (req, res) => {
    const {title, description, duration} = req.body
    
    await database.create({
        title,
        description,
        duration,
    })

    return res.status(201).send()
})

server.get('/videos', async (req, res) => {
    const search = req.query.search
    const videos = await database.list(search)

    return videos
})

server.put('/videos/:id', async (req, res) => {
    const {title, description, duration} = req.body
    const videoId = req.params.id

    await database.update(videoId, {
        title,
        description,
        duration,
    })

    return res.status(204).send()
})

server.delete('/videos/:id', async (req, res) => {
    const videoId = req.params.id

    await database.delete(videoId)

    return res.status(204).send()
})

server.post('/auth/register', async (req, res) => {
    const {email, username, password} = req.body

    if(!email || !password || !username) {
        return res.status(401).send({msg: "Todos os campos são obrigatórios!"})
    }

    const users = await database.verifyUsers({email})
    
    if (users.length >= 1) {
        return res.status(404).send({msg: "Email digitado já existe."})
    }

    const salt = await bcrypt.genSalt(12)
    const pwHash = await bcrypt.hash(password, salt)

    const createUser = await database.createUsers({email, username, pwHash})


    return res.status(201).send({msg: createUser})
})

server.post('/auth/login', async (req, res) => {
    const {email, password} = req.body

    if(!email || !password) {
        return res.status(401).send({msg: "Campos de email e senha obrigatórios"})
    }

    const users = await database.verifyUsers({email})
    
    if (users.length < 1) {
        return res.status(404).send({msg: "Email inválido."})
    }

    const checkPassword = await bcrypt.compare(password, users[0].password)
   
    if (!checkPassword) {
        return res.status(401).send({msg: 'Senha inválida! Tente novamente!'})
    }

    try {
        //const secret = process.env.SECRET
        const token = server.jwt.sign({email: users[0].email}, {expiresIn: 300})

        return res.status(201).send({auth: true, token})
    } catch (err){
        return res.status(401).send({msg: 'Não autorizado.'})
    }   
})

server.post('/validateToken', {onRequest: [server.authenticate]}, async (req, res) => {
    const {email} = req.user
    const users = await database.verifyUsers({email})

    return users
})

server.post('/logout', async (req, res) => {
    return true
})

server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ?? 3333
})