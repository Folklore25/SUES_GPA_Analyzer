const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs-extra');

const inputPng = path.join(__dirname, '../logo.png');
const outputIco = path.join(__dirname, '../logo.ico');

async function convert() {
  try {
    // Check if the input PNG file exists
    if (!fs.existsSync(inputPng)) {
      console.error(`Error: Input file ${inputPng} does not exist.`);
      process.exit(1);
    }
    
    // Convert PNG to ICO
    const buf = await pngToIco(inputPng);
    
    // Write the ICO file
    await fs.writeFile(outputIco, buf);
    
    console.log(`Successfully converted ${inputPng} to ${outputIco}`);
  } catch (err) {
    console.error('Error converting PNG to ICO:', err);
    process.exit(1);
  }
}

convert();