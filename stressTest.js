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
const baseUrl = 'http://192.168.1.108:3000'; // Set your server IP here

// An array of video file paths to be requested randomly
const videoFiles = [
    "/media/swap/MVS/MVS/2_A.Quite.Place.2.2021.1080p.WEB-DL.Hindi-English.DD5.1.ESub.x264-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/Aashiqui.2.2013.1080p.Hindi.BluRay.5.1.ESub.x264-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/Abigail.2019.1080p.BluRay.Hindi.English.D2.0.x264.ESubs.mkv",
    "/media/swap/MVS/MVS/Final.Destination-BloodLines.2025.1080p.PRE-HD.Hindi.LiNE.2.0-English.2.0.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Heretic.2024.1080p.10Bit.WEB-DL.Hindi.2.0-English.5.1.HEVC.x265-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Iron.Man.2.2010.1080p.BluRay.Hindi.English.DD.5.1.x264.ESubs.mkv",
    "/media/swap/MVS/MVS/Iron.Man.3.2013.1080p.Bluray.Hindi.English.DD.5.1.x264.ESubs.mkv",
    "/media/swap/MVS/MVS/Jaat.2025.1080p.10Bit.Hindi.DS4K.WEB-DL.5.1.HEVC.x265-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Jurassic.World.Rebirth.2025.1080p.HDTC.V2.Hindi.Clean.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Kesari.Chapter.2.2025.1080p.Hindi.WEB-DL.5.1.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Nosferatu.2024.WEB-DL.[Hindi.DDP.5.1+English].1080p.x264.mkv",
    "/media/swap/MVS/MVS/Oddity.2024.1080p.10Bit.BluRay.Hindi.2.0-English.5.1.HEVC.x265-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Padakkalam.2025.1080p.WEB-DL.Hindi.5.1-Malayalam.5.1.ESub.x264-HDHub4u.Do.mkv",
    "/media/swap/MVS/MVS/Raid-2.2025.1080p.PRE-HD.Hindi.2.0.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Rakta.Charitra.2010.1080p.AMZN.WEB-DL.HINDI.DD5.1.H.264-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/Retro.2025.1080p.DS4K.WEB-DL.Hindi.5.1-Tamil.5.1.ESub.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Saint.maud.2021.1080p.WEB.DL.HIN.ENG.5.1.ESub.x264.mkv",
    "/media/swap/MVS/MVS/Sanam.Teri.Kasam.2016.2160p.ZEE5.WEB-DL.DDP5.1.H.265-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/Tenet.2020.iMAX.1080p.10Bit.BluRay.Hindi.5.1-English.5.1.HEVC.x265-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/The.Boy.2016.1080p.BluRay.Hindi.English.DD.5.1.x264.ESubs.mkv",
    "/media/swap/MVS/MVS/The.Conjuring-Last.Rites.2025.1080p.HEVC.HDTC.Hindi-Multi.LiNE.x265-HDHub4u..Ms.mkv",
    "/media/swap/MVS/MVS/The.Monkey.2025.1080p.10Bit.WEB-DL.Hindi.5.1-English.5.1.HEVC.x265-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/The.Ugly.Stepsister.2025.1080p.10bit.WEB-DL.x265.6CH(2).mkv",
    "/media/swap/MVS/MVS/The.Ugly.Stepsister.2025.1080p.10bit.WEB-DL.x265.6CH.mp4",
    "/media/swap/MVS/MVS/The.Well.2023.1080p.WEB-DL.Hindi.2.0-English.2.0.ESub.x264-HDHub4u.Tv.mkv",
    "/media/swap/MVS/MVS/Until.Dawn.2025.1080p.AMZN.WEB-DL.Hindi.DDP5.1-English.DDP5.1.ESub.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Vash.2023.1080p.Gujarati.DS4K.WEB-DL.2.0.ESub.x264-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Vash.Level.2.2025.1080p.HEVC.HDTC.Hindi-Gujarati.LiNE.x265-HDHub4u.Ms.mkv",
    "/media/swap/MVS/MVS/Wish.Dragon.2021.1080p.Web-DL.Hindi.English.DD.5.1.x264.ESubs.mkv"
];

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

export default function () {
    // --- Select a random video for each user iteration ---
    const randomVideoFile = videoFiles[Math.floor(Math.random() * videoFiles.length)];

    // Updated URL construction to use the random file
    const url = new URL(`${baseUrl}/stream/movies/stream`);
    url.searchParams.append('path', randomVideoFile);
    const videoUrl = url.toString();

    // console.log(`[VU=${__VU}] Requesting video: ${randomVideoFile}`);

    // 1. Initial request to get the video size from Content-Range header
    const initialRes = http.get(videoUrl, { headers: { 'Range': 'bytes=0-1' } });

    const isStatusPartialContent = check(initialRes, {
        'Initial request status is 206': (r) => r.status === 206,
    });

    // Proceed only if the first request was successful
    if (!isStatusPartialContent) {
        console.error(`[VU=${__VU}] Initial request failed for ${randomVideoFile} with status ${initialRes.status}`);
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

