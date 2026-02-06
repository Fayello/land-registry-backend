import axios from "axios";

async function diagConservator() {
    try {
        const loginRes = await axios.post("http://localhost:3001/api/auth/login", {
            email: "roger.milla@gov.cm",
            password: "password123"
        });
        const token = loginRes.data.token;
        console.log("Logged in as Roger Milla");

        const casesRes = await axios.get("http://localhost:3001/api/cases/pending", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const case4 = casesRes.data.find((c: any) => c.id === 4);
        if (case4) {
            console.log("CASE #4 FULL CHECK:");
            console.log("Status:", case4.status);
            console.log("Type:", case4.type);
            console.log("Initiator Name:", case4.initiator ? case4.initiator.full_name : "NULL");
            console.log("Initiator Object Keys:", case4.initiator ? Object.keys(case4.initiator) : "N/A");
        } else {
            console.log("CASE #4 NOT RETURNED BY API");
        }

    } catch (error: any) {
        console.error("Diagnostic failed:", error.response?.data || error.message);
    }
}

diagConservator();
