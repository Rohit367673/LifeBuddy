// Force Railway redeploy by creating a dummy change
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString();
const deployFile = path.join(__dirname, 'DEPLOY_TIMESTAMP.txt');

fs.writeFileSync(deployFile, `Last deploy: ${timestamp}\nForce redeploy to update Railway with latest backend fixes`);

console.log('✅ Created deploy trigger file');
console.log('🚀 This will force Railway to redeploy with latest changes');
