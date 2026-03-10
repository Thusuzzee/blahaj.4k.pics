const imageElement = document.querySelector('#displayed-image');
const loadingElement = document.querySelector('#loading');
const refreshButton = document.querySelector('#refresh-btn');
const themeToggle = document.querySelector('#theme-toggle');
const infoButton = document.querySelector('#info-btn');
const infoModal = document.querySelector('#info-modal');
const closeModalButton = document.querySelector('.close-btn');

// API and fallback configuration
const apiUrl = 'https://transgirl.wamellow.com';
const fallbackImages = [
  'https://r2.wamellow.com/blahaj/reddit_w5898lq8vxle1.webp',
  'https://r2.wamellow.com/blahaj/reddit_cl6nds8rxble1.webp',
  'https://r2.wamellow.com/blahaj/reddit_1jl8s1l.webp'
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

// Fetch data from API with abort controller and timeout
async function fetchData() {
  if (currentFetchController) {
    currentFetchController.abort();
  }

  // Create a new controller for this request
  currentFetchController = new AbortController();

  // Add a timeout to prevent hanging requests
  const timeoutId = setTimeout(() => {
    if (currentFetchController) {
      currentFetchController.abort();
    }
  }, 5000);

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
    clearTimeout(timeoutId);
    currentFetchController = null;
  }
}

// Set button loading state
function setButtonLoading(loading) {
  if (!refreshButton) return;

  refreshButton.disabled = loading;
  refreshButton.classList.toggle('btn-loading', loading);
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
    imageElement.onload = handleImageLoad;
    imageElement.onerror = handleImageError;

    // Try to get an image from the API
    try {
      const data = await fetchData();
      if (data && data.url) {
        imageElement.src = data.url;
        return;
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }

    // If we get here, use a fallback image
    imageElement.src = getRandomFallbackImage();
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
  console.warn('Image failed to load, using fallback');
  imageElement.src = getRandomFallbackImage();
}

// Show or hide loading screen
function showLoading(show) {
  if (!loadingElement) return;

  if (show) {
    loadingElement.style.display = 'flex';
    if (imageElement) imageElement.style.opacity = '0';
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
  initApp();
}
