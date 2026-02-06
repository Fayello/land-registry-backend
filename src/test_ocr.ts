import axios from 'axios';

async function testOCR() {
    try {
        console.log('Logging in as clerk...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'clerk@mindaf.gov',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token retrieved.');

        console.log('Requesting OCR extraction...');
        const ocrRes = await axios.post('http://localhost:3001/api/ingestion/extract', {
            scanUrl: 'https://example.com/legacy_scan.pdf'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('OCR Result:', ocrRes.data);
    } catch (error: any) {
        console.error('OCR Test failed:', error.response?.data || error.message);
    }
}

testOCR();
