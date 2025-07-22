const path = require('path');
const fs = require('fs');
const servicePath = path.resolve(__dirname, '../services/openRouterService.js');
console.log('USING SERVICE FILE:', servicePath, 'Exists:', fs.existsSync(servicePath));
const { generateMessageWithOpenRouter } = require(servicePath);

async function testModel() {
  const prompt = 'Explain the roadmap to become a software developer.';
  const apiKey = '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';
  const aiResponse = await generateMessageWithOpenRouter(prompt, 800, undefined, apiKey);
  console.log('--- AI Model Test Result ---');
  console.log(aiResponse);
}

testModel(); 