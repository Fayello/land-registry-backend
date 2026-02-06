import { Permission } from "../entities/Permission";
import { Role } from "../entities/Role";
import { User, UserRole } from "../entities/User";

export const seedRBAC = async () => {
    console.log("🌱 Seeding RBAC permissions and roles...");

    // 1. Define Permissions
    const permissionMap: { [key: string]: string } = {
        "cases.view_all": "View all registry applications",
        "cases.schedule_visit": "Schedule land commission visits",
        "cases.upload_report": "Upload technical field reports",
        "cases.validate_technical": "Certify technical cadastral plans",
        "cases.start_notice": "Initiate public opposition period",
        "cases.request_governor": "Request final governor clearance",
        "cases.seal": "Affix final digital authority seal",
        "registry.create_parcel": "Create and modify land parcels",
        "registry.view_deeds": "View full private title deed details",
        "registry.ingest": "Digitize and ingest legacy land records",
        "admin.manage_rbac": "Create and modify roles and permissions"
    };

    const permissions: Permission[] = [];
    for (const [name, description] of Object.entries(permissionMap)) {
        let p = await Permission.findOneBy({ name });
        if (!p) {
            p = Permission.create({ name, description });
            await p.save();
        }
        permissions.push(p);
    }

    const getP = (name: string) => permissions.find(p => p.name === name)!;

    // 2. Define Roles and Assign Permissions
    const rolesConfig = [
        {
            name: "Super Admin",
            permissions: permissions.map(p => p.name) // All permissions
        },
        {
            name: "Conservator",
            permissions: ["cases.view_all", "cases.schedule_visit", "cases.start_notice", "cases.request_governor", "cases.seal", "registry.view_deeds"]
        },
        {
            name: "Cadastre",
            permissions: ["cases.view_all", "cases.validate_technical", "registry.create_parcel"]
        },
        {
            name: "Surveyor",
            permissions: ["cases.view_all", "cases.upload_report"]
        },
        {
            name: "Notary",
            permissions: ["cases.view_all", "registry.view_deeds"]
        },
        {
            name: "Clerk",
            permissions: ["registry.ingest", "registry.view_deeds"]
        }
    ];

    for (const config of rolesConfig) {
        let r = await Role.findOne({ where: { name: config.name }, relations: ["permissions"] });
        if (!r) {
            r = Role.create({ name: config.name });
        }
        r.permissions = config.permissions.map(name => getP(name));
        await r.save();
    }

    // 3. Migrate existing users to the new Role objects
    console.log("🔄 Migrating existing users to new RBAC roles...");
    const users = await User.find({ relations: ["role_obj"] });
    for (const user of users) {
        if (!user.role_obj) {
            let roleName = "";
            switch (user.role) {
                case UserRole.ADMIN: roleName = "Super Admin"; break;
                case UserRole.CONSERVATOR: roleName = "Conservator"; break;
                case UserRole.CADASTRE: roleName = "Cadastre"; break;
                case UserRole.SURVEYOR: roleName = "Surveyor"; break;
                case UserRole.NOTARY: roleName = "Notary"; break;
                case UserRole.CLERK: roleName = "Clerk"; break;
                default: continue;
            }

            if (roleName) {
                const targetRole = await Role.findOneBy({ name: roleName });
                if (targetRole) {
                    user.role_obj = targetRole;
                    await user.save();
                }
            }
        }
    }

    console.log("✅ RBAC Seeding Complete.");
};
