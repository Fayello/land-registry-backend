import axios from "axios";

const API_URL = "http://localhost:3001/api";

async function testHistory() {
    try {
        // 1. Login as Admin to see everything
        const login = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@landregistry.cm",
            password: "password123"
        });
        const token = login.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Fetch History
        const historyResponse = await axios.get(`${API_URL}/cases/pending`, {
            headers,
            params: { history: "true" }
        });

        console.log("HISTORY CASES FOUND:", historyResponse.data.length);
        historyResponse.data.forEach((c: any) => {
            console.log(`ID: ${c.id}, Status: ${c.status}, Type: ${c.type}`);
        });

        const allCasesRaw = await axios.get(`${API_URL}/cases/pending`, { headers });
        console.log("PENDING CASES FOUND:", allCasesRaw.data.length);

    } catch (err: any) {
        console.error("TEST FAILED:", err.response?.data || err.message);
    }
}

testHistory();
