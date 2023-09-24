import { randomUUID } from "crypto"
import { sql } from "./db.js"

export class DatabasePostgres {

    async list(search){
        let videos

        if (search){
            videos = await sql`select * from videos where title ilike ${'%' + search + '%'}`
        } else {
            videos = await sql`select * from videos`
        }

        return videos
    }

    async verifyUsers(user){
        const {email} = user
        let users
        
        users = await sql`select * from users where email = ${email}`

        return users
    }

    async createUsers(user){
        const {email, username, pwHash} = user
        let users
        
        try {        
            users = await sql`insert into users (email, username, status, password) values (${email}, ${username},true, ${pwHash})`
        } catch (error){
            return 'Erro ao cadastrar o usuário. Entre em contato com o responsável!'
        }

        return 'Usuário cadastrado com sucesso'
    }

    async create(video) {
        const videoId = randomUUID()
        const {title, description, duration} = video

        await sql`insert into videos (id, title, description, duration) values (${videoId}, ${title}, ${description}, ${duration})`
       
    }

    async update(id,  video) {
        const {title, description, duration} = video

        await sql`update videos set title = ${title}, description = ${description}, duration = ${duration} where id = ${id}`
    }

    async delete(id) {
        await sql`delete from videos where id = ${id}`
       
    }
}