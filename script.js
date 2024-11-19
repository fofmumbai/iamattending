// Get the file input element and the span to show the file name
const fileInput = document.getElementById("imageInput");
const fileNameDisplay = document.getElementById("file-name");

// Listen for changes in the file input
fileInput.addEventListener("change", function () {
  const fileName = fileInput.files[0] ? fileInput.files[0].name : ""; // Get file name
  if (fileName) {
    fileNameDisplay.textContent = `${fileName}`; // Display file name
  } else {
    fileNameDisplay.textContent = ""; // Clear file name if no file selected
  }
});

const nameInput = document.getElementById("nameInput");
const imageInput = document.getElementById("imageInput");
const generateButton = document.getElementById("generateButton");
const downloadButton = document.getElementById("downloadButton");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const ctx = canvas.getContext("2d", { alpha: true });

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
backgroundImageSquare.src = "template-square.png"; // Add a new square template image
backgroundImageSquare.crossOrigin = "Anonymous";

generateButton.addEventListener("click", generateGraphic);
downloadButton.addEventListener("click", downloadImages);

Promise.all([
  new Promise((resolve) => (backgroundImageVertical.onload = resolve)),
  new Promise((resolve) => (backgroundImageSquare.onload = resolve)),
]).then(() => {
  generateButton.disabled = false;
});

function generateGraphic() {
  const name = nameInput.value.trim();
  const file = imageInput.files[0];
  const nameColor = "#000000";

  if (!name || !file) {
    alert("Please enter your name and upload a profile picture");
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
        name,
        nameColor,
        true,
        backgroundImageVertical,
        "vertical"
      );

      // Generate high-resolution vertical version
      generateVersion(
        outputCtxVertical,
        outputCanvasVertical.width,
        outputCanvasVertical.height,
        profileImage,
        name,
        nameColor,
        false,
        backgroundImageVertical,
        "vertical"
      );

      // Generate high-resolution square version
      generateVersion(
        outputCtxSquare,
        outputCanvasSquare.width,
        outputCanvasSquare.height,
        profileImage,
        name,
        nameColor,
        false,
        backgroundImageSquare,
        "square"
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
        name,
        nameColor,
        true,
        backgroundImageSquare,
        "square"
      );

      const previewSquareDataUrl = previewSquareCanvas.toDataURL("image/png");
      const previewSquare = document.getElementById("preview-square");
      previewSquare.src = previewSquareDataUrl;
      previewSquare.style.display = "block";

      document.getElementById("square-template-text").style.display = "block";
      document.getElementById("vertical-template-text").style.display = "block";

      downloadButton.style.display = "block";

      generateButton.classList.remove("loading");
      generateButton.textContent = "Generate Graphic";
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
  name,
  nameColor,
  isPreview,
  backgroundImage,
  templateType
) {
  context.clearRect(0, 0, width, height);

  // Draw background template
  context.drawImage(backgroundImage, 0, 0, width, height);

  // Calculate dimensions for square crop with different sizes for templates
  const centerX = width / 2;
  const centerY =
    templateType === "vertical"
      ? height * 0.29 // Vertical template
      : height * 0.25; // Square template

  // Adjust image size based on template type
  const size =
    templateType === "vertical"
      ? isPreview
        ? 360
        : 720 // Vertical template size
      : isPreview
      ? 240
      : 480; // Larger image for square template

  // Calculate cropping dimensions
  let sourceSize = Math.min(profileImage.width, profileImage.height);
  let sourceX = (profileImage.width - sourceSize) / 2;
  let sourceY = (profileImage.height - sourceSize) / 2;

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

  // Adjust font size based on template type
  const fontSize =
    templateType === "vertical"
      ? isPreview
        ? 80
        : 160 // Vertical template font size
      : isPreview
      ? 60
      : 120; // Smaller font for square template

  // Draw name with scaled font settings
  context.font = `400 ${fontSize}px "Poppins"`;
  context.textAlign = "center";
  context.fillStyle = nameColor;

  const textY =
    templateType === "vertical"
      ? centerY + size / 2 + (isPreview ? 190 : 380) // Vertical template
      : centerY + size / 2 + (isPreview ? 130 : 260); // Adjusted for square template

  context.fillText(name, centerX, textY);
}

function downloadImages() {
  const verticalLink = document.createElement("a");
  verticalLink.download = `Wireframed2024_${nameInput.value.replace(
    /\s+/g,
    "_"
  )}_vertical.png`;
  verticalLink.href = outputCanvasVertical.toDataURL("image/png", 1.0);
  verticalLink.click();

  const squareLink = document.createElement("a");
  squareLink.download = `Wireframed2024_${nameInput.value.replace(
    /\s+/g,
    "_"
  )}_square.png`;
  squareLink.href = outputCanvasSquare.toDataURL("image/png", 1.0);
  squareLink.click();
}

// Disable generate button until background images load
generateButton.disabled = true;
