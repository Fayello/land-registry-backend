import "reflect-metadata";
import axios from "axios";

async function verifyOwnerPortal() {
    const API_URL = "http://localhost:3001/api";
    console.log("Starting Owner Portal Verification...");

    try {
        // 0. Login to get real Token
        console.log("[TEST 0] Logging in as Marie Atangana...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "marie.atangana@yahoo.fr",
            password: "password123"
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;
        console.log(`PASS: Logged in. Token starts with: ${token.substring(0, 10)}...`);

        const authHeader = { "Authorization": `Bearer ${token}` };

        // 1. Verify Properties
        console.log("[TEST 1] Fetching owner properties...");
        const pRes = await axios.get(`${API_URL}/owner/properties`, {
            headers: authHeader
        });
        if (pRes.data.length > 0) {
            console.log(`PASS: Found ${pRes.data.length} properties.`);
        } else {
            throw new Error("FAIL: No properties found for owner.");
        }

        // 2. Submit New Registration
        console.log("[TEST 2] Submitting New Registration...");
        const regRes = await axios.post(`${API_URL}/cases/submit`, {
            type: "new_registration",
            initiator_id: userId,
            data: {
                locality: "Ebolowa",
                area: 2500,
                parcel_number: "EB-TEST-001",
                boundary: { type: "Polygon", coordinates: [[[11.2, 2.9], [11.3, 2.9], [11.3, 3.0], [11.2, 3.0], [11.2, 2.9]]] }
            }
        }, { headers: authHeader });
        if (regRes.status === 201) {
            console.log("PASS: Registration submitted.");
        } else {
            throw new Error("FAIL: Registration submission failed.");
        }

        // 3. Initiate Transfer
        console.log("[TEST 3] Initiating Ownership Transfer...");
        const propertyId = pRes.data[0].id; // Use first property
        const parcelId = pRes.data[0].parcel.id;

        const transferRes = await axios.post(`${API_URL}/cases/submit`, {
            type: "transfer",
            initiator_id: userId,
            related_parcel_id: parcelId,
            data: {
                recipient_email: "buyer@example.com",
                recipient_name: "John Buyer",
                reason: "Sold",
                original_deed_id: propertyId
            }
        }, { headers: authHeader });
        if (transferRes.status === 201) {
            console.log("PASS: Transfer initiated.");
        } else {
            throw new Error("FAIL: Transfer initiation failed.");
        }

        // 4. Verify Applications List
        console.log("[TEST 4] Verifying applications appear in owner portal...");
        const appsRes = await axios.get(`${API_URL}/owner/applications`, {
            headers: authHeader
        });
        // We expect at least the 2 we just created + any from seed
        if (appsRes.data.length >= 2) {
            console.log(`PASS: Found ${appsRes.data.length} applications.`);
        } else {
            console.error("Apps found:", appsRes.data);
            throw new Error(`FAIL: Expected >= 2 applications, found ${appsRes.data.length}`);
        }

        console.log("\nALL OWNER WORKFLOW TESTS PASSED.");

    } catch (error: any) {
        console.error("\nTEST FAILED:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

verifyOwnerPortal();
