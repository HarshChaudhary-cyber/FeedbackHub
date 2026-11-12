import fs from 'node:fs';
import path from 'node:path';

const targets = ['node_modules', 'dist', '.turbo', '.nyc_output', 'coverage'];

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Cleaned: ${dirPath}`);
    } catch (err) {
      console.warn(`Could not clean ${dirPath}: ${err.message}`);
    }
  }
}

function walkAndClean(currentDir) {
  for (const target of targets) {
    const candidate = path.join(currentDir, target);
    removeDirectory(candidate);
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      walkAndClean(path.join(currentDir, entry.name));
    }
  }
}

const rootDir = process.cwd();
console.log(`Cleaning workspace from root: ${rootDir}`);
walkAndClean(rootDir);
console.log('Workspace clean complete.');
