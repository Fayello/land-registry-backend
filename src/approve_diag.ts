import axios from "axios";

async function approveCase4() {
    try {
        // 1. Login as Roger Milla
        const loginRes = await axios.post("http://localhost:3001/api/auth/login", {
            email: "roger.milla@gov.cm",
            password: "password123"
        });
        const token = loginRes.data.token;
        console.log("Logged in as Roger Milla");

        // 2. Approve CASE #1
        const approveRes = await axios.post("http://localhost:3001/api/cases/1/approve",
            { checklist: { legal_vetting: true } },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("APPROVE RESPONSE:", approveRes.data.message);
        console.log("New Status:", approveRes.data.case.status);

    } catch (error: any) {
        console.error("Approval failed:", error.response?.data || error.message);
    }
}

approveCase4();
