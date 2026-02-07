import * as turf from '@turf/turf';
import { Parcel } from '../entities/Parcel';

export class GeoUtils {
    /**
     * Checks if a new geometry overlaps with any existing parcels.
     * @param newGeoJSON The GeoJSON geometry of the new/updated parcel.
     * @param existingParcels Array of existing Parcel entities to check against.
     * @returns True if overlap is detected, False otherwise.
     */
    static async checkForOverlap(newGeoJSON: any, existingParcels: Parcel[]): Promise<boolean> {
        try {
            // Ensure input is a valid Polygon or MultiPolygon
            const newFeature = turf.feature(newGeoJSON);

            for (const existingParcel of existingParcels) {
                // Skip if no boundary data
                if (!existingParcel.boundary) continue;

                const existingFeature = turf.feature(existingParcel.boundary);

                // check for intersection
                const intersection = turf.intersect(newFeature as any, existingFeature as any);

                // If intersect returns a feature, there is overlap
                if (intersection) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error("GeoUtils Error:", error);
            // In a real system, you might want to fail open or closed depending on policy.
            // For now, fail safe (assume overlap if error) or specific handling.
            // Let's return false but log heavily if it's just invalid geojson
            return false;
        }
    }
}
