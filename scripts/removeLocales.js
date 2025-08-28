// removeLocales.js
/**
 * 移除部分用不到的语言、优化electron包的大小
 */

const fs = require("fs");
const path = require("path");

// Find the out directory
const outDir = path.join(__dirname, "..", "out");

// Find the packaged app directory (assuming single platform for now)
const packagedAppDir = fs.readdirSync(outDir).find(file => {
  const fullPath = path.join(outDir, file);
  return fs.statSync(fullPath).isDirectory() && file.startsWith("sues-gpa-analyzer");
});

if (!packagedAppDir) {
  console.log("Packaged app directory not found");
  process.exit(1);
}

const appDir = path.join(outDir, packagedAppDir);
const localeDir = path.join(appDir, "locales");

// Check if the directory exists
if (!fs.existsSync(localeDir)) {
  console.log("Locales directory not found, skipping locale removal");
  process.exit(0);
}

// Read the directory
const files = fs.readdirSync(localeDir);

//files is array of filenames (basename form)
if (!(files && files.length)) {
  console.log("No locale files found");
  process.exit(0);
}

let removedCount = 0;
for (let i = 0, len = files.length; i < len; i++) {
  // zh 和 en 开头的都不删
  if (!(files[i].startsWith("en") || files[i].startsWith("zh"))) {
    fs.unlinkSync(path.join(localeDir, files[i]));
    console.log(`Removed locale file: ${files[i]}`);
    removedCount++;
  }
}

console.log(`Finished removing ${removedCount} unnecessary locale files`);