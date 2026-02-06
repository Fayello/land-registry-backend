import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

async function checkDb() {
    const ds = new DataSource({
        type: "sqlite",
        database: "database_final.sqlite",
        entities: [User],
    });

    await ds.initialize();
    console.log("Checking users in database_final.sqlite...");
    const users = await User.find({ select: ["id", "email", "full_name", "password_hash"] });
    console.log("Users found:", JSON.stringify(users, null, 2));
    await ds.destroy();
}

checkDb();
