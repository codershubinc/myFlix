import http from 'k6/http';
import { check, sleep } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Test configuration
export const options = {
    stages: [
        // Ramp up to 50 connections very quickly
        { duration: '10s', target: 50 },
        // Hold the peak load for 2 minutes
        { duration: '2m', target: 50 },
        // Ramp down
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        'http_req_failed': ['rate<0.02'], // Allow for 2% failure rate
        'http_req_duration': ['p(95)<5000'], // 95% of requests must complete below 5s
    },
};

// --- Test Setup ---
// Get the target video from an environment variable for flexibility
// How to run: k6 run -e VIDEO_FILE="/path/to/your/movie.mkv" stress-test.js
const videoFile = __ENV.VIDEO_FILE || '/home/swap/Downloads/Abigail.2019.1080p.BluRay.Hindi.English.D2.0.x264.ESubs.mkv';
const baseUrl = 'http://192.168.1.108:3000'; // Set your server IP here

// Updated URL construction to match your server's endpoint
const url = new URL(`${baseUrl}/stream/movies/stream`);
url.searchParams.append('path', videoFile);
const videoUrl = url.toString();

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

export default function () {
    console.log(`Requesting video: ${videoUrl}`);
    // 1. Initial request to get the video size from Content-Range header
    const initialRes = http.get(videoUrl, { headers: { 'Range': 'bytes=0-1' } });

    const isStatusPartialContent = check(initialRes, {
        'Initial request status is 206': (r) => r.status === 206,
    });

    // Proceed only if the first request was successful
    if (!isStatusPartialContent) {
        console.error(`Initial request failed with status ${initialRes.status}`);
        return; // Abort this iteration
    }

    // Note: For piped ffmpeg streams, we might not get a total size.
    // We'll just stream chunks for a simulated duration.

    // 2. Fire off 5 chunk requests in parallel for each user
    const requests = [];
    for (let i = 0; i < 5; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE - 1;
        requests.push(['GET', videoUrl, null, { headers: { 'Range': `bytes=${start}-${end}` } }]);
    }

    // http.batch sends all requests concurrently
    const responses = http.batch(requests);

    // Check that all parallel requests were successful
    responses.forEach(res => {
        check(res, {
            'Parallel chunk request status is 206': (r) => r.status === 206,
        });
    });

    // Wait before this user loops again to simulate a pause in activity
    sleep(10);
}

