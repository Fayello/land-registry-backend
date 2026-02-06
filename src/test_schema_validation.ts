import axios from 'axios';

async function testSchemaValidation() {
    try {
        console.log('--- Phase 4.3 Verification: Schema Validation ---');
        console.log('1. Logging in as clerk...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'clerk@mindaf.gov',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        console.log('\n2. Testing INVALID Template (family_photos.xlsx)...');
        try {
            await axios.post('http://localhost:3001/api/ingestion/extract', {
                fileName: 'family_photos.xlsx'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.error('FAILURE: System accepted an invalid template.');
            process.exit(1);
        } catch (error: any) {
            if (error.response?.data?.code === 'SCHEMA_MISMATCH') {
                console.log('SUCCESS: System rejected family_photos.xlsx with SCHEMA_MISMATCH.');
            } else {
                console.error('FAILURE: System returned unexpected error:', error.response?.data || error.message);
                process.exit(1);
            }
        }

        console.log('\n3. Testing VALID Template (2024_National_Deeds_Registry.xlsx)...');
        const validRes = await axios.post('http://localhost:3001/api/ingestion/extract', {
            fileName: '2024_National_Deeds_Registry.xlsx'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (validRes.data.isSpreadsheet && validRes.data.confidenceScore === 1.0) {
            console.log('SUCCESS: Valid template recognized and parsed.');
        } else {
            console.error('FAILURE: Valid template recognition failed.');
            process.exit(1);
        }

        console.log('\n4. FINAL SUCCESS: Schema Validation & Template Enforcement verified.');
        process.exit(0);

    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testSchemaValidation();
