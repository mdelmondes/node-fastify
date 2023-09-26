import { randomUUID } from "crypto"
import { sql } from "./db.js"

export class DatabasePostgres {

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

        return true
    }

    async getCategory(search){
        let videos

        if (search){
            videos = await sql`select * from categoria where cat_name ilike ${'%' + search + '%'}`
        } else {
            videos = await sql`select * from categoria`
        }

        return videos
    }

    async createCategory(categoria) {
        const {cat_name, cat_status} = categoria

        try {
            await sql`insert into categoria (cat_name, cat_status) values (${cat_name}, ${cat_status})`
        } catch ({name, message}) {
            return false
        }

        return true
       
    }

    async updateCategory(id, categoria) {
        const {cat_name, cat_status} = categoria

        await sql`update categoria set cat_name = ${cat_name}, cat_status = ${cat_status} where id = ${id}`
    }

    async deleteCategory(id) {
        await sql`delete from categoria where id = ${id}`
       
    }
}