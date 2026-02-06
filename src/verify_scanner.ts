import axios from "axios";

async function verifyScanner() {
    console.log("🚀 Starting Hardware Bridge Verification...");
    const baseUrl = "http://localhost:3001/api/ingestion/scanner";
    const token = "mock_token"; // In a real test we'd get a valid token, but endpoints are public for simulation now OR we mock auth

    try {
        console.log("\n1. Testing Hardware Initialization...");
        const initRes = await axios.post(`${baseUrl}/initialize`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Initialization Success:", initRes.data);

        console.log("\n2. Testing Scanner Status...");
        const statusRes = await axios.get(`${baseUrl}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Status Success:", statusRes.data);

        console.log("\n3. Testing Scan Trigger...");
        const scanRes = await axios.post(`${baseUrl}/scan`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Scan Trigger Success:", scanRes.data);

        console.log("\n✨ Hardware Bridge backend verified successfully!");
    } catch (error: any) {
        console.error("❌ Verification Failed:", error.response?.data || error.message);
        process.exit(1);
    }
}

verifyScanner();
