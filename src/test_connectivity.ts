import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'clerk@mindaf.gov',
            password: 'password123'
        });
        console.log('Login successful:', response.data);
    } catch (error: any) {
        console.error('Login failed:', error.response?.data || error.message);
    }
}

testLogin();
