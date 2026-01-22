const sharp = require("sharp");
const path = require("path");

async function optimizeLogo() {
  const inputPath = path.join(__dirname, "public", "lslogo.png");
  const outputPath = path.join(__dirname, "public", "lslogo-optimized.png");

  try {
    await sharp(inputPath)
      .resize(192, 192) // Resize to 192x192 (2x for retina displays)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);

    const stats = require("fs").statSync(outputPath);
    console.log(`✅ Optimized logo saved!`);
    console.log(`📦 New size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`📁 Output: ${outputPath}`);
  } catch (err) {
    console.error("Error:", err);
  }
}

optimizeLogo();
