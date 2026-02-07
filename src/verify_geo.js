async function runGeoTest() {
    console.log("GeoTest JS Running...");

    const existingParcels = [
        {
            parcel_number: "YDE-SEED-1",
            boundary: {
                type: "Polygon",
                coordinates: [[[11.517, 3.875], [11.518, 3.875], [11.518, 3.876], [11.517, 3.876], [11.517, 3.875]]]
            }
        }
    ];

    const safeGeo = {
        type: "Polygon",
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
    };

    const overlappingGeo = {
        type: "Polygon",
        coordinates: [[[11.5175, 3.8755], [11.5185, 3.8755], [11.5185, 3.8765], [11.5175, 3.8765], [11.5175, 3.8755]]]
    };

    async function checkForOverlap(newGeo, existing) {
        const turf = await import('@turf/turf');
        const newFeature = turf.feature(newGeo);
        for (const parcel of existing) {
            const existingFeature = turf.feature(parcel.boundary);
            const intersection = turf.intersect(turf.featureCollection([newFeature, existingFeature]));
            if (intersection) return true;
        }
        return false;
    }

    console.log("Checking SAFE parcel...");
    if (!await checkForOverlap(safeGeo, existingParcels)) {
        console.log("PASS: Safe parcel detected as valid.");
    } else {
        console.error("FAIL: Safe parcel flagged as overlapping.");
    }

    console.log("Checking OVERLAPPING parcel...");
    if (await checkForOverlap(overlappingGeo, existingParcels)) {
        console.log("PASS: Overlapping parcel detected correctly.");
    } else {
        console.error("FAIL: Overlapping parcel NOT detected.");
    }
}

runGeoTest();
