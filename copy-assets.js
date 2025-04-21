import path from "path"
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import pkg from 'ffmpeg-ffprobe-static';

console.log("Copuing assets");

const {ffmpegPath, ffprobePath} = pkg;
const assetFolder = path.join(__dirname, "src", "js", "assets");


function copyAssets() {
  const destFolder = path.join(__dirname, "dist", "cep");
  
  // Create destination folder if it doesn't exist
  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
  }
  
  // Copy asset folder recursively
  function copyAssetFolderRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.lstatSync(srcPath).isDirectory()) {
        copyAssetFolderRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  if (fs.existsSync(assetFolder)) {
    const destAssetFolder = path.join(destFolder, "assets");
    copyAssetFolderRecursive(assetFolder, destAssetFolder);
  }
  
  // Copy ffmpeg and ffprobe executables
  if (fs.existsSync(ffmpegPath)) {
    fs.copyFileSync(ffmpegPath, path.join(destFolder, path.basename(ffmpegPath)));
  }
  
  if (fs.existsSync(ffprobePath)) {
    fs.copyFileSync(ffprobePath, path.join(destFolder, path.basename(ffprobePath)));
  }
}


copyAssets();
