import axios from 'axios';

async function testSpreadsheetIngestion() {
    try {
        console.log('--- Phase 4.2 Verification: Spreadsheet Ingestion ---');
        console.log('1. Logging in as clerk...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'clerk@mindaf.gov',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        console.log('2. Requesting Data Extraction from Spreadsheet (mock metadata)...');
        const extractRes = await axios.post('http://localhost:3001/api/ingestion/extract', {
            scanUrl: 'https://example.com/deeds_roster.xlsx', // Mocking a spreadsheet URL
            fileName: 'deeds_roster.xlsx'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const extracted = extractRes.data.extractedData;
        console.log('Extracted Data (Spreadsheet Mode):', {
            Deed: extracted.deed_number,
            Locality: extracted.locality,
            Owner: extracted.owner_name,
            AutoOwnerEmail: extracted.owner_email,
            IsSpreadsheet: extractRes.data.isSpreadsheet
        });

        if (extractRes.data.isSpreadsheet && extracted.owner_email === 'jean.fossi@gmail.com') {
            console.log('3. SUCCESS: Spreadsheet detected and owner auto-populated.');
        } else {
            console.error('3. FAILURE: Spreadsheet detection or auto-population failed.');
            process.exit(1);
        }

        console.log('4. Confirming Ingestion...');
        const confirmRes = await axios.post('http://localhost:3001/api/ingestion/confirm', {
            extractedData: extracted,
            scanUrl: 'https://example.com/deeds_roster.xlsx',
            ownerEmail: extracted.owner_email
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Ingestion Response:', confirmRes.data.message);
        console.log('5. FINAL SUCCESS: Bulk Ingestion from Spreadsheet verified.');
        process.exit(0);

    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testSpreadsheetIngestion();
