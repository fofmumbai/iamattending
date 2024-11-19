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

// Create a separate high-resolution canvas for the actual output
const outputCanvas = document.createElement("canvas");
const outputCtx = outputCanvas.getContext("2d", { alpha: true });

// Set preview canvas dimensions (for display)
canvas.width = 1080;
canvas.height = 1920;

// Set output canvas dimensions (match template resolution)
outputCanvas.width = 1080 * 2; // Double the resolution
outputCanvas.height = 1920 * 2; // Double the resolution

// Enable image smoothing for both canvases
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
outputCtx.imageSmoothingEnabled = true;
outputCtx.imageSmoothingQuality = "high";

let backgroundImage = new Image();
backgroundImage.src = "template.png";
backgroundImage.crossOrigin = "Anonymous";

generateButton.addEventListener("click", generateGraphic);
downloadButton.addEventListener("click", downloadImage);

backgroundImage.onload = function () {
  generateButton.disabled = false;
};

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
      // Generate preview version
      generateVersion(
        ctx,
        canvas.width,
        canvas.height,
        profileImage,
        name,
        nameColor,
        true
      );

      // Generate high-resolution version
      generateVersion(
        outputCtx,
        outputCanvas.width,
        outputCanvas.height,
        profileImage,
        name,
        nameColor,
        false
      );

      // Update preview
      const previewDataUrl = canvas.toDataURL("image/png");
      preview.src = previewDataUrl;
      preview.style.display = "block";
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
  isPreview
) {
  context.clearRect(0, 0, width, height);

  // Draw background template
  context.drawImage(backgroundImage, 0, 0, width, height);

  // Calculate dimensions for square crop
  const centerX = width / 2;
  const centerY = height * 0.29;
  const size = isPreview ? 360 : 720; // Double size for high-res version

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

  // Draw name with scaled font settings
  const fontSize = isPreview ? 80 : 160; // Double font size for high-res
  context.font = `400 ${fontSize}px "Poppins"`;
  context.textAlign = "center";
  context.fillStyle = nameColor;

  const textY = centerY + size / 2 + (isPreview ? 190 : 380);
  context.fillText(name, centerX, textY);
}

function downloadImage() {
  const link = document.createElement("a");
  link.download = `Wireframed2024_${nameInput.value.replace(/\s+/g, "_")}.png`;
  // Use the high-resolution canvas for download
  link.href = outputCanvas.toDataURL("image/png", 1.0);
  link.click();
}

// Disable generate button until background image loads
generateButton.disabled = true;
