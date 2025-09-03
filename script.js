const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const originalImage = document.getElementById('originalImage');
const processedCanvas = document.getElementById('processedCanvas');
const ctx = processedCanvas.getContext('2d');
const previewArea = document.getElementById('previewArea');
const downloadSection = document.getElementById('downloadSection');
const downloadButton = document.getElementById('downloadButton');
const loadingState = document.getElementById('loadingState');
const outputFileName = document.getElementById('outputFileName');
const outputFileSize = document.getElementById('outputFileSize');

// Range inputs
const intensityRange = document.getElementById('intensityRange');
const contrastRange = document.getElementById('contrastRange');
const brightnessRange = document.getElementById('brightnessRange');

// Displays
const intensityDisplay = document.getElementById('intensityDisplay');
const contrastDisplay = document.getElementById('contrastDisplay');
const brightnessDisplay = document.getElementById('brightnessDisplay');

// Color values
const PINK_COLOR = { r: 200, g: 101, b: 154 };
const GREEN_COLOR = { r: 45, g: 90, b: 61 };

let currentFileName = '';
let processingImage = new Image();
let currentFileId = ''; // Store consistent file ID

// Update displays when sliders change
intensityRange.oninput = function () {
    intensityDisplay.textContent = this.value + '%';
    applyDuotoneEffect();
};

contrastRange.oninput = function () {
    contrastDisplay.textContent = this.value + '%';
    applyDuotoneEffect();
};

brightnessRange.oninput = function () {
    brightnessDisplay.textContent = this.value + '%';
    applyDuotoneEffect();
};

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name.split('.')[0]; // Remove extension
    currentFileId = generateRandomId(); // Generate once and reuse
    const reader = new FileReader();

    reader.onload = function (e) {
        processingImage.src = e.target.result;
        processingImage.onload = function () {
            showLoading(true);
            setTimeout(() => {
                setupCanvas();
                displayImages();
                applyDuotoneEffect();
                updateDownloadInfo();
                showResults();
                showLoading(false);
            }, 600);
        };
    };
    reader.readAsDataURL(file);
}

function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function setupCanvas() {
    const img = processingImage;
    const maxDimension = 800;
    let { width, height } = img;

    // Maintain aspect ratio
    if (width > height) {
        if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
        }
    } else {
        if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
        }
    }

    processedCanvas.width = width;
    processedCanvas.height = height;
}

function displayImages() {
    // Show original
    originalImage.src = processingImage.src;
}

function applyDuotoneEffect() {
    if (!processingImage.src) return;

    const canvas = processedCanvas;
    const context = canvas.getContext('2d');

    // Draw original image
    context.drawImage(processingImage, 0, 0, canvas.width, canvas.height);

    // Get pixel data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const intensity = parseInt(intensityRange.value) / 100;
    const contrast = parseInt(contrastRange.value) / 100;
    const brightness = parseInt(brightnessRange.value) / 100;

    // Process each pixel
    for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];

        // Apply brightness and contrast adjustments
        r = ((r / 255 - 0.5) * contrast + 0.5) * brightness * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * brightness * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * brightness * 255;

        // Clamp values
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Apply duotone mapping
        let targetColor;
        if (luminance > 0.5) {
            // Lighter areas → pink
            const pinkFactor = (luminance - 0.5) * 2;
            targetColor = {
                r: PINK_COLOR.r + (255 - PINK_COLOR.r) * pinkFactor * 0.3,
                g: PINK_COLOR.g + (255 - PINK_COLOR.g) * pinkFactor * 0.3,
                b: PINK_COLOR.b + (255 - PINK_COLOR.b) * pinkFactor * 0.3
            };
        } else {
            // Darker areas → green
            const greenFactor = (0.5 - luminance) * 2;
            targetColor = {
                r: GREEN_COLOR.r * (1 - greenFactor * 0.5),
                g: GREEN_COLOR.g * (1 - greenFactor * 0.5),
                b: GREEN_COLOR.b * (1 - greenFactor * 0.5)
            };
        }

        // Blend original with duotone
        pixels[i] = r * (1 - intensity) + targetColor.r * intensity;
        pixels[i + 1] = g * (1 - intensity) + targetColor.g * intensity;
        pixels[i + 2] = b * (1 - intensity) + targetColor.b * intensity;
    }

    // Apply processed pixels back to canvas
    context.putImageData(imageData, 0, 0);
}

function generateRandomId(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function updateDownloadInfo() {
    const newFileName = `${currentFileName}-duotone-${currentFileId}.png`;
    outputFileName.textContent = newFileName;
    outputFileSize.textContent = `${processedCanvas.width} × ${processedCanvas.height}px`;
}

function showResults() {
    previewArea.classList.add('visible');
    downloadSection.classList.add('visible');
    downloadButton.disabled = false;
}

downloadButton.addEventListener('click', function () {
    const fileName = `${currentFileName}-duotone-${currentFileId}.png`;

    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.href = processedCanvas.toDataURL('image/png', 1.0);
    downloadLink.click();
});

// Drag & drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.add('drag-active');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.remove('drag-active');
    }, false);
});

uploadZone.addEventListener('drop', function (e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
    }
});