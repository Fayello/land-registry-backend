import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, UserRole } from "./entities/User";
import { Parcel, ParcelStatus } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { Case, CaseType, CaseStatus } from "./entities/Case";
import { AuditLog } from "./entities/AuditLog";
import { Transaction } from "./entities/Transaction";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database_final.sqlite",
    synchronize: true,
    logging: false,
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction],
    subscribers: [AuditSubscriber],
});

async function seed() {
    await AppDataSource.initialize();
    console.log("Connected for seeding...");

    // 4. Create Users (Cameroonian Identities)
    // Clear existing for demo purposes (optional, but good for clean seed)
    await Transaction.clear();
    await Case.clear();
    await Deed.clear();
    await Parcel.clear();
    await User.clear();

    const bcrypt = require("bcrypt");
    const password_hash = await bcrypt.hash("password123", 10);

    const users = [];

    const u1 = User.create({
        email: "jean.fossi@gmail.com",
        password_hash,
        role: UserRole.BUYER,
        full_name: "Jean-Pierre Fossi",
        phone_number: "677123456",
        national_id_number: "112233445"
    });
    await u1.save();
    users.push(u1);

    const u2 = User.create({
        email: "marie.atangana@yahoo.fr",
        password_hash,
        role: UserRole.OWNER,
        full_name: "Marie Atangana",
        phone_number: "699876543",
        national_id_number: "556677889"
    });
    await u2.save();
    users.push(u2);

    const u3 = User.create({
        email: "roger.milla@gov.cm",
        password_hash,
        role: UserRole.CONSERVATOR,
        full_name: "Roger Milla (Conservator)",
        phone_number: "670998877",
        national_id_number: "998877665"
    });
    await u3.save();
    users.push(u3);

    const u4 = User.create({
        email: "ibrahim.daouda@business.cm",
        password_hash,
        role: UserRole.OWNER,
        full_name: "Ibrahim Daouda",
        phone_number: "655443322",
        national_id_number: "334455667"
    });
    await u4.save();
    users.push(u4);

    console.log("Users created");

    // 5. Create Parcels (Yaoundé Coordinates - Bastos & Mfoundi)
    const parcels = await Parcel.save([
        Parcel.create({
            parcel_number: "YDE-2024-001",
            locality: "Bastos, Yaoundé",
            area_sq_meters: 500,
            status: ParcelStatus.VALID,
            boundary: {
                type: "Polygon",
                coordinates: [[[11.517, 3.875], [11.518, 3.875], [11.518, 3.876], [11.517, 3.876], [11.517, 3.875]]]
            }
        }),
        Parcel.create({
            parcel_number: "YDE-22-002",
            locality: "Mvan, Yaoundé",
            area_sq_meters: 1200,
            status: ParcelStatus.VALID,
            boundary: {
                type: "Polygon",
                coordinates: [[[11.520, 3.840], [11.522, 3.840], [11.522, 3.842], [11.520, 3.842], [11.520, 3.840]]]
            }
        }),
    ]);

    console.log("Parcels created");

    // 6. Create Deeds
    await Deed.save([
        Deed.create({
            deed_number: "DEED-2024-001",
            parcel: parcels[0],
            owner: users[1], // Marie Atangana
            conservator: users[2],
            is_active: true,
            title_deed_url: "/assets/title_deed_sample.pdf", // Local PDF
            vol: "155",
            folio: "197",
            department: "LA MEFOU ET AFAMBA",
            digital_seal_hash: "sha256-mock-hash-123",
            registration_date: new Date("2023-01-15")
        }),
        Deed.create({
            deed_number: "DEED-2024-002",
            parcel: parcels[1],
            owner: users[3], // Ibrahim Daouda
            conservator: users[2],
            is_active: true,
            title_deed_url: "/assets/title_deed_sample.pdf",
            vol: "127",
            folio: "172",
            department: "MFOUNDI",
            digital_seal_hash: "sha256-mock-hash-456",
            registration_date: new Date("2023-06-20")
        })
    ]);

    console.log("Deeds created");

    // 7. Create Case
    const caseItem = new Case();
    caseItem.type = CaseType.NEW_REGISTRATION;
    caseItem.initiator = users[1];
    caseItem.status = CaseStatus.SUBMITTED;
    caseItem.data = {
        parcel_number: "YDE-PENDING-003",
        locality: "Etoudi, Yaoundé",
        area: 800,
        checklist: {}
    };
    await caseItem.save();

    console.log("Seeding complete. Case ID:", caseItem.id);
    process.exit(0);
}


seed().catch(err => {
    fs.writeFileSync('seed_error.txt', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error(err);
});
