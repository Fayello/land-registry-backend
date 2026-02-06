import axios from 'axios';

async function testFullDigitization() {
    try {
        console.log('--- Phase 4.1 Verification: Full Digital System ---');
        console.log('1. Logging in as clerk...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'clerk@mindaf.gov',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        console.log('2. Requesting Full OCR extraction...');
        const ocrRes = await axios.post('http://localhost:3001/api/ingestion/extract', {
            scanUrl: 'https://example.com/legacy_scan.pdf'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const extracted = ocrRes.data.extractedData;
        console.log('Extracted Data (Full System):', {
            Deed: extracted.deed_number,
            Locality: extracted.locality,
            Area: extracted.area_sq_meters,
            GPS: extracted.boundary
        });

        console.log('3. Confirming Ingestion to Universal Ledger...');
        const confirmRes = await axios.post('http://localhost:3001/api/ingestion/confirm', {
            extractedData: extracted,
            scanUrl: 'https://example.com/legacy_scan.pdf',
            ownerEmail: 'jean.fossi@gmail.com' // Using a known user
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Ingestion Response:', confirmRes.data.message);
        console.log('4. SUCCESS: Legacy Deed migrated to Digital Twin.');
        process.exit(0);

    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testFullDigitization();
