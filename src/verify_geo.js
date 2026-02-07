const turf = require('@turf/turf');

async function runGeoTest() {
    console.log("GeoTest JS Running...");

    // 1. Existing Parcels (Mock Input)
    const existingParcels = [
        {
            parcel_number: "YDE-SEED-1",
            boundary: {
                type: "Polygon",
                // Existing Parcel at ~ 11.517, 3.875
                coordinates: [[[11.517, 3.875], [11.518, 3.875], [11.518, 3.876], [11.517, 3.876], [11.517, 3.875]]]
            }
        }
    ];

    // 2. Define a SAFE new parcel (Far away)
    const safeGeo = {
        type: "Polygon",
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
    };

    // 3. Define an OVERLAPPING parcel
    const overlappingGeo = {
        type: "Polygon",
        coordinates: [[[11.5175, 3.8755], [11.5185, 3.8755], [11.5185, 3.8765], [11.5175, 3.8765], [11.5175, 3.8755]]]
    };

    function checkForOverlap(newGeo, existing) {
        const newFeature = turf.feature(newGeo);
        for (const parcel of existing) {
            const existingFeature = turf.feature(parcel.boundary);
            const intersection = turf.intersect(newFeature, existingFeature);
            if (intersection) return true;
        }
        return false;
    }

    console.log("Checking SAFE parcel...");
    if (!checkForOverlap(safeGeo, existingParcels)) {
        console.log("PASS: Safe parcel detected as valid.");
    } else {
        console.error("FAIL: Safe parcel flagged as overlapping.");
    }

    console.log("Checking OVERLAPPING parcel...");
    if (checkForOverlap(overlappingGeo, existingParcels)) {
        console.log("PASS: Overlapping parcel detected correctly.");
    } else {
        console.error("FAIL: Overlapping parcel NOT detected.");
    }
}

runGeoTest();
