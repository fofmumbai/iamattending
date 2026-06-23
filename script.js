// Updated script for image-only graphic generation

const imageInput = document.getElementById("imageInput");
const generateButton = document.getElementById("generateButton");
const downloadButtons = document.getElementById("downloadButtons");
const downloadPostButton = document.getElementById("downloadPostButton");
const downloadStoryButton = document.getElementById("downloadStoryButton");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const ctx = canvas.getContext("2d", { alpha: true });
const fileNameDisplay = document.getElementById("file-name");

// Create separate high-resolution canvases for both templates
const outputCanvasVertical = document.createElement("canvas");
const outputCanvasSquare = document.createElement("canvas");
const outputCtxVertical = outputCanvasVertical.getContext("2d", {
  alpha: true,
});
const outputCtxSquare = outputCanvasSquare.getContext("2d", { alpha: true });

// Set preview canvas dimensions (for display)
canvas.width = 1080;
canvas.height = 1920;

// Set output canvas dimensions (match template resolutions)
outputCanvasVertical.width = 1080 * 2; // Vertical template
outputCanvasVertical.height = 1920 * 2;
outputCanvasSquare.width = 1080 * 2; // Square template
outputCanvasSquare.height = 1440 * 2;

// Enable image smoothing for all canvases
[ctx, outputCtxVertical, outputCtxSquare].forEach((context) => {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
});

let backgroundImageVertical = new Image();
backgroundImageVertical.src = "config26story.png";
backgroundImageVertical.crossOrigin = "Anonymous";

let backgroundImageSquare = new Image();
backgroundImageSquare.src = "config26post.png";
backgroundImageSquare.crossOrigin = "Anonymous";

// Round MUMBAI badge drawn on top of the photo
let stickerImage = new Image();
stickerImage.src = "fofsticker.png";
stickerImage.crossOrigin = "Anonymous";

// ── Layout config — all values are fractions of the template canvas ──────────
//   photo:   cx/cy = center of the white photo box, size = box width
//   sticker: cx/cy = center of the sticker artwork, w = its width
// Currently set for the OLD config26 templates (sticker baked in at the top).
// Values measured from the actual config26 template PNGs. The MUMBAI badge is
// baked into the template at the bottom edge of the photo box; the photo covers
// it, so the sticker entry redraws the same badge on top at the same spot.
const LAYOUT = {
  vertical: {
    photo: { cx: 0.4998, cy: 0.4508, size: 0.4995 },
    sticker: { cx: 0.4998, cy: 0.5911, w: 0.132 },
  },
  square: {
    photo: { cx: 0.4998, cy: 0.4962, size: 0.4995 },
    sticker: { cx: 0.4998, cy: 0.6823, w: 0.132 },
  },
};

generateButton.addEventListener("click", generateGraphic);
downloadPostButton.addEventListener("click", downloadPost);
downloadStoryButton.addEventListener("click", downloadStory);

// Modify image input to only accept specific file types
imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB file size limit

  const fileName = file ? file.name : ""; // Get file name
  if (fileName) {
    fileNameDisplay.textContent = `${fileName}`; // Display file name
  } else {
    fileNameDisplay.textContent = ""; // Clear file name if no file selected
  }

  // Validate file type and size
  if (file) {
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload only JPG, JPEG, or PNG images.");
      this.value = ""; // Clear the file input
      fileNameDisplay.textContent = "";
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      alert("File size should not exceed 5MB.");
      this.value = ""; // Clear the file input
      fileNameDisplay.textContent = "";
      return;
    }
  }
});

// Resolve on load; on error, flag the missing file instead of hanging forever.
const missingAssets = [];
function whenLoaded(img) {
  return new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = () => {
      missingAssets.push(img.src);
      resolve();
    };
  });
}

Promise.all([
  whenLoaded(backgroundImageVertical),
  whenLoaded(backgroundImageSquare),
  whenLoaded(stickerImage),
]).then(() => {
  if (missingAssets.length) {
    const list = missingAssets.join(", ");
    console.error("Missing template assets:", list);
    fileNameDisplay.textContent = `Missing files: ${list}`;
    fileNameDisplay.style.color = "#e53935";
  }
  // Enable anyway so the failure is obvious on click rather than a dead button.
  generateButton.disabled = false;
});

function generateGraphic() {
  const file = imageInput.files[0];

  if (!file) {
    alert("Please upload a profile picture");
    return;
  }

  generateButton.classList.add("loading");
  generateButton.textContent = "Generating...";

  const reader = new FileReader();
  reader.onload = function (e) {
    const profileImage = new Image();
    profileImage.crossOrigin = "Anonymous";

    profileImage.onload = function () {
      // Generate preview version (vertical template)
      generateVersion(
        ctx,
        canvas.width,
        canvas.height,
        profileImage,
        backgroundImageVertical,
        "vertical",
        true
      );

      // Generate high-resolution vertical version
      generateVersion(
        outputCtxVertical,
        outputCanvasVertical.width,
        outputCanvasVertical.height,
        profileImage,
        backgroundImageVertical,
        "vertical",
        false
      );

      // Generate high-resolution square version
      generateVersion(
        outputCtxSquare,
        outputCanvasSquare.width,
        outputCanvasSquare.height,
        profileImage,
        backgroundImageSquare,
        "square",
        false
      );

      // Update previews
      const previewDataUrl = canvas.toDataURL("image/png");
      preview.src = previewDataUrl;
      preview.style.display = "block";

      // Add square template preview
      const previewSquareCanvas = document.createElement("canvas");
      const previewSquareCtx = previewSquareCanvas.getContext("2d");
      previewSquareCanvas.width = 1080;
      previewSquareCanvas.height = 1440;

      generateVersion(
        previewSquareCtx,
        1080,
        1440,
        profileImage,
        backgroundImageSquare,
        "square",
        true
      );

      const previewSquareDataUrl = previewSquareCanvas.toDataURL("image/png");
      const previewSquare = document.getElementById("preview-square");
      previewSquare.src = previewSquareDataUrl;
      previewSquare.style.display = "block";

      document.getElementById("square-template-text").style.display = "block";
      document.getElementById("vertical-template-text").style.display = "block";

      downloadButtons.style.display = "flex";

      generateButton.classList.remove("loading");
      generateButton.textContent = "Get My Graphics";
    };
    profileImage.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function generateVersion(
  context,
  width,
  height,
  profileImage,
  backgroundImage,
  templateType,
  isPreview
) {
  context.clearRect(0, 0, width, height);

  // Draw background template
  context.drawImage(backgroundImage, 0, 0, width, height);

  // Position the photo inside the white box of each template (fraction-based,
  // so it scales correctly for both preview and high-res output canvases).
  const box = LAYOUT[templateType].photo;
  const centerX = width * box.cx;
  const centerY = height * box.cy;

  // Box is square; tiny overscan avoids a white seam at the edges.
  const size = width * box.size * 1.01;

  // Calculate cropping dimensions
  let sourceSize = Math.min(profileImage.width, profileImage.height);
  let sourceX = (profileImage.width - sourceSize) / 2;
  let sourceY = (profileImage.height - sourceSize) / 2;

  // Calculate border width proportional to image size
  const borderWidth = isPreview ? 0 : 0;

  // Draw black border
  context.fillStyle = "#ffffff";
  context.fillRect(
    centerX - size / 2 - borderWidth,
    centerY - size / 2 - borderWidth,
    size + borderWidth * 2,
    size + borderWidth * 2
  );

  // Draw the cropped square image
  context.drawImage(
    profileImage,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    centerX - size / 2,
    centerY - size / 2,
    size,
    size
  );

  // Apply black & white + grain effect over the photo area
  applyMonoGrain(context, centerX - size / 2, centerY - size / 2, size, size);

  // Redraw the "I Am Attending" sticker on top so it overlaps the photo,
  // matching where it sits baked into the template.
  drawSticker(context, width, height, templateType);
}

// Draw attending.png on top, centered on the bottom edge of the photo box so
// it overlaps the lower part of the user's photo.
function drawSticker(context, width, height, templateType) {
  // Native sticker geometry (fofsticker.png): square, full-bleed badge
  const NATIVE_W = 1155;
  const NATIVE_H = 1155;
  const CONTENT_X = 0; // content fills the whole canvas
  const CONTENT_Y = 0;
  const CONTENT_W = 1155;
  const CONTENT_H = 1155;

  // Skip if the sticker image failed to load — drawing a broken image throws
  // and would abort the whole render.
  if (!stickerImage.complete || stickerImage.naturalWidth === 0) return;

  const stk = LAYOUT[templateType].sticker;
  const targetContentW = stk.w * width;
  const scale = targetContentW / CONTENT_W;
  const drawW = NATIVE_W * scale;
  const drawH = NATIVE_H * scale;

  // Center the sticker's visible artwork on (cx, cy).
  const contentLeft = stk.cx * width - targetContentW / 2;
  const contentTop = stk.cy * height - (CONTENT_H * scale) / 2;
  const drawX = contentLeft - CONTENT_X * scale;
  const drawY = contentTop - CONTENT_Y * scale;

  context.drawImage(stickerImage, drawX, drawY, drawW, drawH);
}

// Convert a region of the canvas to high-contrast black & white with film grain
function applyMonoGrain(context, x, y, w, h) {
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  w = Math.round(w);
  h = Math.round(h);

  const contrast = 30; // higher = punchier blacks/whites
  const brightness = 45; // positive = lighter overall
  const grain = 65; // amount of per-pixel noise

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const imageData = context.getImageData(x, y, w, h);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    // Luminance-weighted grayscale
    let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Contrast around mid-gray
    v = factor * (v - 128) + 128;
    // Brightness lift
    v += brightness;
    // Film grain
    v += (Math.random() - 0.5) * grain;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    d[i] = d[i + 1] = d[i + 2] = v;
  }

  context.putImageData(imageData, x, y);
}

function downloadPost() {
  const squareLink = document.createElement("a");
  squareLink.download = `Config2026_post.png`;
  squareLink.href = outputCanvasSquare.toDataURL("image/png", 1.0);
  squareLink.click();
}

function downloadStory() {
  const verticalLink = document.createElement("a");
  verticalLink.download = `Config2026_story.png`;
  verticalLink.href = outputCanvasVertical.toDataURL("image/png", 1.0);
  verticalLink.click();
}

// Disable generate button until background images load
generateButton.disabled = true;
