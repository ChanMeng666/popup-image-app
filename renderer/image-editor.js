// Image Editor Module
const imageEditor = (function() {
  // DOM Elements
  const modal = document.getElementById('editorModal');
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');
  const cropOverlay = document.getElementById('cropOverlay');
  const cropBox = document.getElementById('cropBox');
  const cropBtn = document.getElementById('cropBtn');
  const resizeBtn = document.getElementById('resizeBtn');
  const cropControls = document.getElementById('cropControls');
  const resizeControls = document.getElementById('resizeControls');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const lockAspect = document.getElementById('lockAspect');
  const applyBtn = document.getElementById('applyEditBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const closeBtn = document.getElementById('closeEditorBtn');

  // State
  let originalImage = null;
  let currentMode = 'crop';
  let aspectRatio = 1;
  let cropRect = { x: 0, y: 0, width: 100, height: 100 };
  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  let resizeHandle = null;

  // Initialize
  function init() {
    // Mode switching
    cropBtn.addEventListener('click', () => setMode('crop'));
    resizeBtn.addEventListener('click', () => setMode('resize'));

    // Resize inputs
    resizeWidth.addEventListener('input', handleWidthChange);
    resizeHeight.addEventListener('input', handleHeightChange);

    // Apply/Cancel
    applyBtn.addEventListener('click', apply);
    cancelBtn.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    // Crop box interactions
    setupCropInteractions();
  }

  function setMode(mode) {
    currentMode = mode;

    cropBtn.classList.toggle('active', mode === 'crop');
    resizeBtn.classList.toggle('active', mode === 'resize');
    cropControls.classList.toggle('hidden', mode !== 'crop');
    resizeControls.classList.toggle('hidden', mode !== 'resize');
    cropOverlay.classList.toggle('hidden', mode !== 'crop');

    if (mode === 'resize' && originalImage) {
      resizeWidth.value = originalImage.width;
      resizeHeight.value = originalImage.height;
      aspectRatio = originalImage.width / originalImage.height;
    }
  }

  function handleWidthChange() {
    if (lockAspect.checked && aspectRatio) {
      resizeHeight.value = Math.round(parseInt(resizeWidth.value) / aspectRatio);
    }
  }

  function handleHeightChange() {
    if (lockAspect.checked && aspectRatio) {
      resizeWidth.value = Math.round(parseInt(resizeHeight.value) * aspectRatio);
    }
  }

  function setupCropInteractions() {
    const container = document.querySelector('.editor-canvas-container');

    cropBox.addEventListener('mousedown', (e) => {
      if (e.target === cropBox) {
        isDragging = true;
        dragStart = { x: e.clientX - cropRect.x, y: e.clientY - cropRect.y };
        e.preventDefault();
      }
    });

    // Create resize handles
    const handles = ['nw', 'ne', 'sw', 'se'];
    handles.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `crop-handle crop-handle-${pos}`;
      handle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: #667eea;
        border: 2px solid white;
        border-radius: 2px;
        cursor: ${pos}-resize;
      `;

      if (pos.includes('n')) handle.style.top = '-5px';
      if (pos.includes('s')) handle.style.bottom = '-5px';
      if (pos.includes('w')) handle.style.left = '-5px';
      if (pos.includes('e')) handle.style.right = '-5px';

      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeHandle = pos;
        dragStart = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
      });

      cropBox.appendChild(handle);
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const containerRect = container.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        // Constrain to canvas
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;

        newX = Math.max(offsetX, Math.min(newX, offsetX + canvas.offsetWidth - cropRect.width));
        newY = Math.max(offsetY, Math.min(newY, offsetY + canvas.offsetHeight - cropRect.height));

        cropRect.x = newX;
        cropRect.y = newY;
        updateCropBox();
      }

      if (isResizing) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        dragStart = { x: e.clientX, y: e.clientY };

        if (resizeHandle.includes('e')) cropRect.width += dx;
        if (resizeHandle.includes('w')) { cropRect.x += dx; cropRect.width -= dx; }
        if (resizeHandle.includes('s')) cropRect.height += dy;
        if (resizeHandle.includes('n')) { cropRect.y += dy; cropRect.height -= dy; }

        cropRect.width = Math.max(20, cropRect.width);
        cropRect.height = Math.max(20, cropRect.height);
        updateCropBox();
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      resizeHandle = null;
    });
  }

  function updateCropBox() {
    cropBox.style.left = cropRect.x + 'px';
    cropBox.style.top = cropRect.y + 'px';
    cropBox.style.width = cropRect.width + 'px';
    cropBox.style.height = cropRect.height + 'px';
  }

  function open(imageDataUrl) {
    modal.classList.remove('hidden');

    const img = new Image();
    img.onload = () => {
      originalImage = img;

      // Calculate display size (fit within container)
      const maxWidth = 400;
      const maxHeight = 300;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Initialize crop box
      const container = document.querySelector('.editor-canvas-container');
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      cropRect = {
        x: canvasRect.left - containerRect.left + 10,
        y: canvasRect.top - containerRect.top + 10,
        width: Math.min(100, width - 20),
        height: Math.min(100, height - 20)
      };
      updateCropBox();

      setMode('crop');
    };
    img.src = imageDataUrl;
  }

  function close() {
    modal.classList.add('hidden');
    originalImage = null;
  }

  function apply() {
    if (!originalImage) return;

    let resultCanvas = document.createElement('canvas');
    let resultCtx = resultCanvas.getContext('2d');

    if (currentMode === 'crop') {
      // Calculate crop coordinates relative to original image
      const scaleX = originalImage.width / canvas.width;
      const scaleY = originalImage.height / canvas.height;

      const container = document.querySelector('.editor-canvas-container');
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offsetX = canvasRect.left - containerRect.left;
      const offsetY = canvasRect.top - containerRect.top;

      const cropX = (cropRect.x - offsetX) * scaleX;
      const cropY = (cropRect.y - offsetY) * scaleY;
      const cropW = cropRect.width * scaleX;
      const cropH = cropRect.height * scaleY;

      resultCanvas.width = cropW;
      resultCanvas.height = cropH;
      resultCtx.drawImage(originalImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    } else {
      // Resize
      const newWidth = parseInt(resizeWidth.value) || originalImage.width;
      const newHeight = parseInt(resizeHeight.value) || originalImage.height;

      resultCanvas.width = newWidth;
      resultCanvas.height = newHeight;
      resultCtx.drawImage(originalImage, 0, 0, newWidth, newHeight);
    }

    const resultDataUrl = resultCanvas.toDataURL('image/png');

    // Call the callback in renderer.js
    if (window.applyEditedImage) {
      window.applyEditedImage(resultDataUrl);
    }

    close();
  }

  // Initialize on load
  init();

  return {
    open,
    close
  };
})();
