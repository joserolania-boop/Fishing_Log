const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, '../assets/images');
const sourceIcon = path.join(iconsDir, 'icon.png');

// Icon sizes required by Expo/Android
const sizes = {
  'icon.png': 1024,           // App icon - 1024x1024
  'android-icon-foreground.png': 1080,  // Android adaptive icon foreground
  'android-icon-background.png': 1080,  // Android adaptive icon background
  'android-icon-monochrome.png': 192,   // Android adaptive icon monochrome
  'splash-icon.png': 512,               // Splash screen icon
  'favicon.png': 192,                   // Web favicon
};

async function generateIcons() {
  try {
    console.log('Generating optimized icons...');
    
    // Read the original icon
    const imageBuffer = fs.readFileSync(sourceIcon);
    
    for (const [filename, size] of Object.entries(sizes)) {
      const outputPath = path.join(iconsDir, filename);
      
      console.log(`Creating ${filename} (${size}x${size})...`);
      
      await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 30, g: 136, b: 229, alpha: 1 } // Blue from app.json
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✓ Created ${filename}`);
    }
    
    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
