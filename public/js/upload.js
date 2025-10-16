const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const speedText = document.getElementById('speedText');
const remainingText = document.getElementById('remainingText');
const status = document.getElementById('status');
const fileInfo = document.getElementById('fileInfo');
const queueInfo = document.getElementById('queueInfo');
const uploadPath = document.getElementById('uploadPath');
let fileQueue = [];
let currentIndex = 0;

// Drag and drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

function handleFiles(files) {
    fileQueue = Array.from(files);
    currentIndex = 0;
    updateQueueInfo();
    uploadButton.disabled = fileQueue.length === 0;
    if (fileQueue.length > 0) {
        updateFileInfo(fileQueue);
    }
}

function updateFileInfo(files) {
    let html = '<div style="display:flex; flex-wrap:wrap; gap:12px;">';
    files.forEach((file, idx) => {
        html += `
        <div style="border:1.5px solid #2196f3; background:#e3f2fd; border-radius:8px; padding:10px 14px; margin-bottom:8px; min-width:220px; box-shadow:0 1px 4px rgba(33,150,243,0.08);">
            <div style="font-weight:bold; color:#1565c0; font-size:15px;">${idx + 1}. ${file.name}</div>
            <div style="font-size:13px; color:#333; margin-top:4px;">${formatFileSize(file.size)} &nbsp;|&nbsp; <span style='color:#666;'>${file.type}</span></div>
        </div>`;
    });
    html += '</div>';
    fileInfo.innerHTML = html;
}

function updateQueueInfo() {
    if (fileQueue.length === 0) {
        queueInfo.textContent = '';
    } else {
        queueInfo.textContent = `Queued files: ${fileQueue.length}`;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

uploadButton.addEventListener('click', async () => {
    const path = uploadPath.value.trim();
    const title = document.getElementById('titleInput').value.trim();
    if (fileQueue.length === 0) {
        showStatus('Please select files first.', 'error');
        return;
    }
    if (!path) {
        showStatus('Please enter an upload path.', 'error');
        return;
    }
    if (!title) {
        showStatus('Please enter a title.', 'error');
        return;
    }
    uploadButton.disabled = true;
    progressContainer.style.display = 'block';
    status.style.display = 'none';
    await uploadNextFile(path, title);
    uploadButton.disabled = false;
});

async function uploadNextFile(path, title) {
    if (currentIndex >= fileQueue.length) {
        showStatus('All files uploaded!', 'success');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        speedText.textContent = '';
        remainingText.textContent = '';
        return;
    }
    const file = fileQueue[currentIndex];
    showStatus(`Uploading ${file.name} (${currentIndex + 1}/${fileQueue.length}) ...`, '');
    await uploadFile(file, path, title);
    currentIndex++;
    updateQueueInfo();
    await uploadNextFile(path, title);
}

async function uploadFile(file, path, title) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/movies/upload/?path=${encodeURIComponent(path)}`);

        let lastLoaded = 0;
        let lastTime = Date.now();
        let total = file.size;

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                const percentCompleted = Math.round((e.loaded * 100) / e.total);
                progressBar.style.width = percentCompleted + '%';
                progressText.textContent = percentCompleted + '%';

                // Speed calculation
                const now = Date.now();
                const timeDiff = (now - lastTime) / 1000;
                const bytesDiff = e.loaded - lastLoaded;
                if (timeDiff > 0) {
                    const speed = bytesDiff / timeDiff; // bytes/sec
                    speedText.textContent = `Speed: ${formatFileSize(speed)}/s`;
                }
                lastLoaded = e.loaded;
                lastTime = now;

                // Remaining size
                const remaining = total - e.loaded;
                remainingText.textContent = `Remaining: ${formatFileSize(remaining)}`;
            }
        };

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                showStatus(`File ${file.name} uploaded successfully!`, 'success');
                resolve();
            } else {
                showStatus(`Error uploading ${file.name}: ${xhr.statusText}`, 'error');
                reject();
            }
        };

        xhr.onerror = function () {
            showStatus(`Error uploading ${file.name}: Network error`, 'error');
            reject();
        };

        xhr.send(formData);
    });
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = type;
    status.style.display = 'block';
}
