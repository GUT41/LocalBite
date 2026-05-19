const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizePngsInDirectory(directory) {
  try {
    const files = fs.readdirSync(directory).filter(file => file.endsWith('.png'));
    
    if (files.length === 0) {
      console.log(`No PNG files found in ${directory}`);
      return;
    }
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      console.log(`Optimizing: ${filePath}`);
      
      await sharp(filePath)
        .png({ 
          quality: 85,
          progressive: true,
          compressionLevel: 9
        })
        .toFile(filePath + '.tmp');
      
      fs.renameSync(filePath + '.tmp', filePath);
      const originalSize = fs.statSync(filePath).size;
      console.log(`✓ ${file} optimized (${Math.round(originalSize / 1024)}KB)`);
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error.message);
  }
}

async function optimizeNestedPngs(pattern, baseDir) {
  try {
    const walkSync = (dir) => {
      let results = [];
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          results = results.concat(walkSync(filePath));
        } else if (file.endsWith('.png')) {
          results.push(filePath);
        }
      }
      
      return results;
    };
    
    const pngFiles = walkSync(baseDir);
    
    if (pngFiles.length === 0) {
      console.log(`No PNG files found in ${baseDir}`);
      return;
    }
    
    for (const filePath of pngFiles) {
      console.log(`Optimizing: ${filePath}`);
      
      await sharp(filePath)
        .png({ 
          quality: 85,
          progressive: true,
          compressionLevel: 9
        })
        .toFile(filePath + '.tmp');
      
      fs.renameSync(filePath + '.tmp', filePath);
      const size = fs.statSync(filePath).size;
      console.log(`✓ ${path.basename(filePath)} optimized (${Math.round(size / 1024)}KB)`);
    }
  } catch (error) {
    console.error(`Error processing directory ${baseDir}:`, error.message);
  }
}

(async () => {
  try {
    console.log('Optimizing PNG files...\n');
    
    // Optimize assets folder
    await optimizePngsInDirectory('assets');
    
    // Optimize Android resources
    console.log('\nOptimizing Android resources...');
    await optimizeNestedPngs('**/*.png', 'android/app/src/main/res');
    
    console.log('\n✓ All PNG files optimized successfully!');
  } catch (error) {
    console.error('Error optimizing PNG files:', error);
    process.exit(1);
  }
})();
