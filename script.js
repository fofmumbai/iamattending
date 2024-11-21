// Updated script for image-only graphic generation

const imageInput = document.getElementById("imageInput");
const generateButton = document.getElementById("generateButton");
const downloadButton = document.getElementById("downloadButton");
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
outputCanvasSquare.height = 1080 * 2;

// Enable image smoothing for all canvases
[ctx, outputCtxVertical, outputCtxSquare].forEach((context) => {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
});

let backgroundImageVertical = new Image();
backgroundImageVertical.src = "template.png";
backgroundImageVertical.crossOrigin = "Anonymous";

let backgroundImageSquare = new Image();
backgroundImageSquare.src = "template-square.png";
backgroundImageSquare.crossOrigin = "Anonymous";

generateButton.addEventListener("click", generateGraphic);
downloadButton.addEventListener("click", downloadImages);

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

Promise.all([
  new Promise((resolve) => (backgroundImageVertical.onload = resolve)),
  new Promise((resolve) => (backgroundImageSquare.onload = resolve)),
]).then(() => {
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
      previewSquareCanvas.height = 1080;

      generateVersion(
        previewSquareCtx,
        1080,
        1080,
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

      downloadButton.style.display = "block";

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

  // Calculate dimensions for square crop with different sizes for templates
  const centerX = width / 2;
  const centerY =
    templateType === "vertical"
      ? height * 0.327 // Vertical template
      : height * 0.32; // Square template

  // Adjust image size based on template type
  const size =
    templateType === "vertical"
      ? isPreview
        ? 405
        : 810 // Vertical template size
      : isPreview
      ? 324
      : 648; // Larger image for square template

  // Calculate cropping dimensions
  let sourceSize = Math.min(profileImage.width, profileImage.height);
  let sourceX = (profileImage.width - sourceSize) / 2;
  let sourceY = (profileImage.height - sourceSize) / 2;

  // Calculate border width proportional to image size
  const borderWidth = isPreview ? 5 : 10;

  // Draw black border
  context.fillStyle = "#000000";
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
}

function downloadImages() {
  const verticalLink = document.createElement("a");
  verticalLink.download = `Wireframed2024_story.png`;
  verticalLink.href = outputCanvasVertical.toDataURL("image/png", 1.0);
  verticalLink.click();

  const squareLink = document.createElement("a");
  squareLink.download = `Wireframed2024_post.png`;
  squareLink.href = outputCanvasSquare.toDataURL("image/png", 1.0);
  squareLink.click();
}

// Disable generate button until background images load
generateButton.disabled = true;
