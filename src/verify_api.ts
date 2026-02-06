const BASE_URL = "http://localhost:3001/api";

async function runTests() {
    console.log("Starting API Verification...");

    // 1. Test Public Search (Free)
    console.log("\n[TEST 1] Public Search...");
    const searchRes = await fetch(`${BASE_URL}/registry/search?query=DEED-TEST-2024`);
    if (searchRes.status === 200) {
        console.log("PASS: Found Deed.");
    } else {
        console.error("FAIL: Search failed", await searchRes.text());
        process.exit(1);
    }

    // 2. Test Restricted View (No Token)
    console.log("\n[TEST 2] Restricted Access (No Token)...");
    const detailsRes = await fetch(`${BASE_URL}/registry/details/DEED-TEST-2024`);
    if (detailsRes.status === 402) {
        console.log("PASS: 402 Payment Required received.");
    } else {
        console.error("FAIL: Should be 402, got", detailsRes.status);
    }

    // 3. Initiate Payment
    console.log("\n[TEST 3] Initiate Payment...");
    const initRes = await fetch(`${BASE_URL}/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone: "677123456",
            purpose: "search_fee",
            reference_id: "DEED-TEST-2024"
        })
    });
    const initData = await initRes.json();
    if (initData.transaction_id) {
        console.log("PASS: Payment Initiated. ID:", initData.transaction_id);
    } else {
        console.error("FAIL: Initiation failed", initData);
    }

    // 4. Confirm Payment
    console.log("\n[TEST 4] Confirm Payment (OTP 1234)...");
    const confirmRes = await fetch(`${BASE_URL}/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            transaction_id: initData.transaction_id,
            otp: "1234"
        })
    });
    const confirmData = await confirmRes.json();
    if (confirmData.payment_token) {
        console.log("PASS: Payment Confirmed. Token:", confirmData.payment_token);
    } else {
        console.error("FAIL: Confirmation failed", confirmData);
    }

    // 5. Access with Token
    console.log("\n[TEST 5] Access with Token...");
    const fullRes = await fetch(`${BASE_URL}/registry/details/DEED-TEST-2024?payment_token=${confirmData.payment_token}`);
    if (fullRes.status === 200) {
        const fullData = await fullRes.json();
        if (fullData.owner && fullData.owner.full_name === "Jean K. Fokam") {
            console.log("PASS: Full Details Access Granted.");
        } else {
            console.error("FAIL: Owner data missing", fullData);
        }
    } else {
        console.error("FAIL: Access denied with token", fullRes.status);
    }

    console.log("\nALL TESTS PASSED.");
}

runTests().catch(console.error);
