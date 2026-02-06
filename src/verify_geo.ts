import "reflect-metadata";
import { DataSource } from "typeorm";
import { Parcel, ParcelStatus } from "./entities/Parcel";
import { GeoUtils } from "./utils/GeoUtils";
import dotenv from "dotenv";

dotenv.config();

const TestDataSource = new DataSource({
    type: "sqlite",
    database: "database_final.sqlite",
    synchronize: true,
    logging: false,
    entities: [Parcel],
    // minimal entities setup for test
});

async function runGeoTest() {
    await TestDataSource.initialize();
    console.log("GeoTest DB Connected.");

    // 1. Get Existing Parcels
    const existingParcels = await Parcel.find();
    console.log(`Loaded ${existingParcels.length} existing parcels.`);

    // 2. Define a SAFE new parcel (Far away)
    const safeGeo = {
        type: "Polygon",
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] // In the middle of the ocean
    };

    // 3. Define an OVERLAPPING parcel (Overlaps with YDE-2024-001 from seed)
    // Seed Parcel YDE-2024-001 is at roughly 11.517, 3.875
    const overlappingGeo = {
        type: "Polygon",
        coordinates: [[[11.5175, 3.8755], [11.5185, 3.8755], [11.5185, 3.8765], [11.5175, 3.8765], [11.5175, 3.8755]]]
    };

    console.log("Checking SAFE parcel...");
    const isOverlapSafe = await GeoUtils.checkForOverlap(safeGeo, existingParcels);
    if (!isOverlapSafe) {
        console.log("PASS: Safe parcel detected as valid.");
    } else {
        console.error("FAIL: Safe parcel detected as overlapping!");
    }

    console.log("Checking OVERLAPPING parcel...");
    const isOverlapBad = await GeoUtils.checkForOverlap(overlappingGeo, existingParcels);
    if (isOverlapBad) {
        console.log("PASS: Overlapping parcel detected correctly.");
    } else {
        console.error("FAIL: Overlapping parcel NOT detected!");
    }

    process.exit(0);
}

runGeoTest().catch(console.error);
