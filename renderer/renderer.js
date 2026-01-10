// State
let images = [];
let currentEditIndex = -1;

// DOM Elements
const textInput = document.getElementById('textInput');
const addImageBtn = document.getElementById('addImageBtn');
const addUrlBtn = document.getElementById('addUrlBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const urlInputContainer = document.getElementById('urlInputContainer');
const urlInput = document.getElementById('urlInput');
const urlSubmitBtn = document.getElementById('urlSubmitBtn');
const urlCancelBtn = document.getElementById('urlCancelBtn');
const dropZone = document.getElementById('dropZone');
const imageGallery = document.getElementById('imageGallery');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');
const alwaysOnTopCheckbox = document.getElementById('alwaysOnTop');

// Window Controls
minimizeBtn.addEventListener('click', () => {
  window.electronAPI.minimizeWindow();
});

closeBtn.addEventListener('click', () => {
  window.electronAPI.closeWindow();
});

alwaysOnTopCheckbox.addEventListener('change', (e) => {
  window.electronAPI.toggleAlwaysOnTop(e.target.checked);
});

// Add Image from File
addImageBtn.addEventListener('click', async () => {
  const selectedImages = await window.electronAPI.selectImages();
  if (selectedImages.length > 0) {
    selectedImages.forEach(img => addImage(img.data, img.name));
  }
});

// Add Image from URL
addUrlBtn.addEventListener('click', () => {
  urlInputContainer.classList.remove('hidden');
  urlInput.focus();
});

urlCancelBtn.addEventListener('click', () => {
  urlInputContainer.classList.add('hidden');
  urlInput.value = '';
});

urlSubmitBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (url) {
    loadImageFromUrl(url);
  }
});

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    urlSubmitBtn.click();
  }
});

function loadImageFromUrl(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    // Convert to base64
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      addImage(dataUrl, 'URL Image');
      urlInputContainer.classList.add('hidden');
      urlInput.value = '';
    } catch (e) {
      alert('Cannot load this image due to CORS restrictions. Try downloading it first.');
    }
  };

  img.onerror = () => {
    alert('Failed to load image from URL. Please check the URL and try again.');
  };

  img.src = url;
}

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const files = Array.from(e.dataTransfer.files).filter(file =>
    file.type.startsWith('image/')
  );

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      addImage(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  });
});

// Add Image to Gallery
function addImage(dataUrl, name = 'Image') {
  const id = Date.now() + Math.random();
  images.push({ id, data: dataUrl, name });
  renderGallery();
}

// Remove Image
function removeImage(id) {
  images = images.filter(img => img.id !== id);
  renderGallery();
}

// Edit Image
function editImage(index) {
  currentEditIndex = index;
  imageEditor.open(images[index].data);
}

// Apply Edited Image
window.applyEditedImage = function(newDataUrl) {
  if (currentEditIndex >= 0 && currentEditIndex < images.length) {
    images[currentEditIndex].data = newDataUrl;
    renderGallery();
  }
  currentEditIndex = -1;
};

// Render Image Gallery
function renderGallery() {
  imageGallery.innerHTML = '';

  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'image-item';

    item.innerHTML = `
      <img src="${img.data}" alt="${img.name}" title="${img.name}">
      <div class="image-actions">
        <button class="image-action-btn edit-btn" title="Edit">&#9998;</button>
        <button class="image-action-btn delete-btn" title="Delete">&#10005;</button>
      </div>
    `;

    // Edit button
    item.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      editImage(index);
    });

    // Delete button
    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeImage(img.id);
    });

    // Click to view full size (optional - opens editor)
    item.querySelector('img').addEventListener('click', () => {
      editImage(index);
    });

    imageGallery.appendChild(item);
  });
}

// Save Content
saveBtn.addEventListener('click', async () => {
  const content = {
    text: textInput.value,
    images: images.map(img => ({
      name: img.name,
      data: img.data
    }))
  };

  const success = await window.electronAPI.saveContent(content);
  if (success) {
    showNotification('Content saved successfully!');
  }
});

// Load Content
loadBtn.addEventListener('click', async () => {
  const content = await window.electronAPI.loadContent();
  if (content) {
    textInput.value = content.text || '';
    images = (content.images || []).map(img => ({
      id: Date.now() + Math.random(),
      name: img.name,
      data: img.data
    }));
    renderGallery();
    showNotification('Content loaded successfully!');
  }
});

// Simple notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    z-index: 2000;
    animation: fadeInOut 2s ease-in-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
`;
document.head.appendChild(style);
