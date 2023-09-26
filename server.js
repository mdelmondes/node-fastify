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

server.post('/categories', async (req, res) => {
    const {cat_name, cat_status} = req.body
    
    const createCat = await database.createCategory({
        cat_name,
        cat_status
    })

    if (createCat) {
        return res.status(201).send({statusCode: 201, msg: createCat})
    }
})

server.get('/categories', async (req, res) => {
    const search = req.query.search
    const categories = await database.getCategory(search)

    return categories
})

server.put('/categories/:id', async (req, res) => {
    const {cat_name, cat_status} = req.body
    const cat_id = req.params.id

    await database.updateCategory(cat_id, {
        cat_name,
        cat_status
    })

    return res.status(201).send()
})

server.delete('/categories/:id', async (req, res) => {
    const cat_id = req.params.id

    await database.deleteCategory(cat_id)

    return res.status(201).send()
})

server.post('/auth/register', async (req, res) => {
    const {email, username, password} = req.body

    if(!email || !password || !username) {
        return res.status(201).send({statusCode: 422, msg: "Todos os campos são obrigatórios!"})
    }

    const users = await database.verifyUsers({email})
    
    if (users.length >= 1) {
        return res.status(201).send({statusCode: 409, msg: "Email informado já está cadastrado."})
    }

    const salt = await bcrypt.genSalt(12)
    const pwHash = await bcrypt.hash(password, salt)

    const createUser = await database.createUsers({email, username, pwHash})

    if (createUser) {
        return res.status(201).send({statusCode: 201, msg: "Usuário cadastrado com sucesso"})
    }
})

server.post('/auth/login', async (req, res) => {
    const {email, password} = req.body

    if(!email || !password) {
        return res.status(201).send({msg: "Campos de email e senha obrigatórios"})
    }

    const users = await database.verifyUsers({email})
    
    if (users.length < 1) {
        return res.status(201).send({msg: "Email inválido."})
    }

    const checkPassword = await bcrypt.compare(password, users[0].password)
   
    if (!checkPassword) {
        return res.status(201).send({msg: 'Senha inválida! Tente novamente!'})
    }

    try {
        //const secret = process.env.SECRET
        const token = server.jwt.sign({email: users[0].email}, {expiresIn: 300})

        return res.status(201).send({auth: true, token, user: users})
    } catch (err){
        return res.status(201).send({msg: 'Não autorizado.'})
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