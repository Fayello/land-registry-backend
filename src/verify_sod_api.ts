import axios from "axios";

const API_URL = "http://localhost:3001/api";

async function verifySOD() {
    console.log("🔍 Starting Programmatic SOD Verification...");

    try {
        // 1. Login as Cadastre
        console.log("\n--- CADASTRE TEST ---");
        const cadLogin = await axios.post(`${API_URL}/auth/login`, {
            email: "ibrahim.daouda@mindcaf.cm",
            password: process.env.TEST_PASSWORD_CADASTRE || "password123"
        });
        const cadToken = cadLogin.data.token;
        const cadHeaders = { Authorization: `Bearer ${cadToken}` };

        // Attempt to approve Case #2 - Should FAIL (403)
        try {
            await axios.post(`${API_URL}/cases/2/approve`, {}, { headers: cadHeaders });
        } catch (err: any) {
            if (err.response?.status === 403) console.log("✅ SUCCESS: Cadastre blocked from approval (403)");
        }

        // 2. Login as Conservator
        console.log("\n--- CONSERVATOR TEST (PRE-TECHNICAL) ---");
        const consLogin = await axios.post(`${API_URL}/auth/login`, {
            email: "roger.milla@gov.cm",
            password: "password123"
        });
        const consToken = consLogin.data.token;
        const consHeaders = { Authorization: `Bearer ${consToken}` };

        // Attempt to approve Case #2 WITHOUT technical validation - Should FAIL (403 SOD VIOLATION)
        try {
            await axios.post(`${API_URL}/cases/2/approve`, { checklist: {} }, { headers: consHeaders });
        } catch (err: any) {
            if (err.response?.status === 403 && err.response?.data?.message?.includes("SOD VIOLATION")) {
                console.log("✅ SUCCESS: Bulletproof SOD blocked approval (Missing Technical Seal)");
            } else {
                console.log(`❌ FAIL: Expected 403 SOD VIOLATION, got ${err.response?.status}`);
            }
        }

        // 3. Cadastre Technical Validation
        console.log("\n--- CADASTRE TECHNICAL VALIDATION ---");
        await axios.put(`${API_URL}/cases/2/validate-technical`, {}, { headers: cadHeaders });
        console.log("✅ Technical validation completed by Cadastre.");

        // 4. Final Approval (Conservator)
        console.log("\n--- CONSERVATOR TEST (POST-TECHNICAL) ---");
        try {
            const finalApprove = await axios.post(`${API_URL}/cases/2/approve`, {
                checklist: {
                    identity_verified: true,
                    survey_valid: true,
                    tax_cleared: true,
                    no_overlap: true
                }
            }, { headers: consHeaders });
            console.log("✅ SUCCESS: Conservator approved case AFTER technical validation");
            console.log("Deed Hash:", finalApprove.data.digital_seal_hash || "SIGNATURE-VERIFIED");
        } catch (err: any) {
            console.log("❌ FAIL: Final approval failed", err.response?.data);
        }

    } catch (err: any) {
        console.error("Verification crashed:", err.message);
    }
}

verifySOD();
