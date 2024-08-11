const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const buildsDir = path.join(__dirname, 'builds');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src, { withFileTypes: true });

  items.forEach(item => {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);

    if (item.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy public directory to builds
copyDirectory(publicDir, buildsDir);

console.log('Contents copied from public to builds.');
