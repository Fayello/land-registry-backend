import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

async function listUsers() {
    const ds = new DataSource({
        type: "sqlite",
        database: "database_final.sqlite",
        entities: [User],
    });

    await ds.initialize();
    const users = await User.find();
    console.log("--- START USERS ---");
    users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.full_name} | Role: ${u.role}`));
    console.log("--- END USERS ---");
    await ds.destroy();
}

listUsers();
