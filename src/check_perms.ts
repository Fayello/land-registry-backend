import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";

const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database_v2.sqlite",
    entities: [User, Role, Permission],
});

async function check() {
    await AppDataSource.initialize();
    const user = await User.findOne({
        where: { email: "ibrahim.daouda@mindcaf.cm" },
        relations: ["role_obj", "role_obj.permissions"]
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("User:", user.full_name);
    console.log("Role (legacy):", user.role);
    console.log("Role (obj):", user.role_obj?.name);
    console.log("Permissions:", user.role_obj?.permissions.map(p => p.name));

    process.exit(0);
}

check();
