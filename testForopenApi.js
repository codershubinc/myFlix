import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration for the API
export const options = {
  stages: [
    // Ramp up to 100 virtual users over 30 seconds
    { duration: '30s', target: 100 },
    // Stay at 100 users for 1 minute
    { duration: '1m', target: 100 },
    // Ramp down to 0 users
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'], // less than 1% failed requests
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

// --- Test Setup ---
const baseUrl = 'http://openapi.codershubinc.tech';

const countryCodes = [
    "AU", "BR", "CA", "CH", "DE", "DK", "ES", "GB", "IN", "US"
];

export default function () {
  // 1. Make a request to the base user endpoint
  const baseRes = http.get(`${baseUrl}/v1.0/user`);
  check(baseRes, {
    'Base user endpoint is OK (status 200)': (r) => r.status === 200,
  });

  // --- Select a random country code for the next request ---
  const randomCountryCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];

  // 2. Make a request to the user endpoint with a random country code
  const countryRes = http.get(`${baseUrl}/v1.0/user/${randomCountryCode}`);
  check(countryRes, {
    [`User endpoint for ${randomCountryCode} is OK (status 200)`]: (r) => r.status === 200,
  });
  
  // Wait for 1 second before the virtual user makes another request
  sleep(1);
}

