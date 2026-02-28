const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const diagramsDir = path.join(__dirname, '..', 'docs', 'diagrams');
const files = fs.readdirSync(diagramsDir).filter((f) => f.endsWith('.mmd'));

if (files.length === 0) {
  console.log('No .mmd files found in docs/diagrams.');
  process.exit(0);
}

(async () => {
  for (const file of files) {
    const input = path.join(diagramsDir, file);
    const outName = file.replace(/\.mmd$/, '.svg');
    const output = path.join(diagramsDir, outName);
    console.log(`Rendering ${input} -> ${output}`);
    await new Promise((resolve, reject) => {
      const proc = spawn('npx', ['-y', 'mmdc', '-i', input, '-o', output], { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`mmdc failed with exit ${code}`));
      });
    });
  }
  console.log('All diagrams rendered.');
})();
