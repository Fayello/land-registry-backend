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
