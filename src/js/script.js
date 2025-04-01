// Cache DOM elements
const imageElement = document.getElementById('displayed-image');
const loadingElement = document.getElementById('loading');
const refreshButton = document.getElementById('refresh-btn');
const themeToggle = document.getElementById('theme-toggle');
const infoButton = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModalButton = document.querySelector('.close-btn');

// API and fallback configuration
const apiUrl = 'https://transgirl.wamellow.com';
const fallbackImages = [
    "https://r2.wamellow.com/blahaj/reddit_w5898lq8vxle1.webp",
    "https://r2.wamellow.com/blahaj/reddit_cl6nds8rxble1.webp",
    "https://r2.wamellow.com/blahaj/reddit_1jl8s1l.webp"
];

// Controller to abort fetch requests
let currentFetchController = null;

// Track loading state
let isLoading = false;

// Initialize the application
function initApp() {
    loadBlahajImage();
    setupEventListeners();
    initTheme();
    setupOnlineListener();
}

// Set up online event listener
function setupOnlineListener() {
    window.addEventListener('online', loadBlahajImage);
}

// Set up all event listeners
function setupEventListeners() {
    if (refreshButton) {
        refreshButton.addEventListener('click', loadBlahajImage);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (infoButton) {
        infoButton.addEventListener('click', showInfoModal);
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideInfoModal);
    }

    // Event delegation for modal closing
    window.addEventListener('click', event => {
        if (event.target === infoModal) {
            hideInfoModal();
        }
    });

    // Keyboard handling
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && infoModal.classList.contains('show')) {
            hideInfoModal();
        }
    });
}

// Initialize theme based on preferences
function initTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Show the info modal
function showInfoModal() {
    infoModal.classList.add('show');
}

// Hide the info modal
function hideInfoModal() {
    infoModal.classList.remove('show');
}

// Fetch data from API with abort controller
async function fetchData() {
    if (currentFetchController) {
        currentFetchController.abort();
    }

    // Create a new controller for this request
    currentFetchController = new AbortController();

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            signal: currentFetchController.signal,
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
        console.error('Fetch error:', error);
        throw error;
    } finally {
        currentFetchController = null;
    }
}

// Clean URL by removing query parameters
function cleanUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.origin + urlObj.pathname;
    } catch {
        return url.split('?')[0];
    }
}

// Set button loading state
function setButtonLoading(isLoading) {
    if (!refreshButton) return;

    refreshButton.disabled = isLoading;
    refreshButton.classList.toggle('btn-loading', isLoading);
}

// Get random fallback image
function getRandomFallbackImage() {
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return fallbackImages[randomIndex];
}

// Load and display a Blåhaj image
async function loadBlahajImage() {
    if (isLoading || (refreshButton && refreshButton.disabled)) {
        return;
    }

    isLoading = true;
    showLoading(true);
    setButtonLoading(true);

    try {
        let imageUrl;

        try {
            const data = await fetchData();
            if (data && data.url) {
                imageUrl = cleanUrl(data.url);
            } else {
                imageUrl = getRandomFallbackImage();
            }
        } catch {
            imageUrl = getRandomFallbackImage();
        }

        imageElement.onload = handleImageLoad;
        imageElement.onerror = handleImageError;

        imageElement.src = imageUrl;
    } catch {
        imageElement.src = getRandomFallbackImage();
        handleImageLoad();
    } finally {
        setTimeout(() => {
            isLoading = false;
            setButtonLoading(false);
        }, 500);
    }
}

// Handle successful image load
function handleImageLoad() {
    imageElement.style.opacity = '1';
    showLoading(false);
}

// Handle image loading error
function handleImageError() {
    imageElement.src = getRandomFallbackImage();
}

// Show or hide loading screen
function showLoading(show) {
    if (show) {
        loadingElement.style.display = 'flex';
        imageElement.style.opacity = '0';
    } else {
        loadingElement.style.opacity = '0';

        // Hide loading screen after transition completes
        setTimeout(() => {
            loadingElement.style.display = 'none';
            loadingElement.style.opacity = '1';
        }, 500);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    setTimeout(initApp, 1);
}