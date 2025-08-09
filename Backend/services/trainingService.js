const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const ScheduleInteraction = require('../models/ScheduleInteraction');
const User = require('../models/User');
const { spawn } = require('child_process');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function buildPromptForUser(user, interaction) {
  const profile = {
    timezone: user.preferences?.timezone || 'UTC',
    plan: user.subscription?.plan || 'free',
    prefs: user.preferences || {}
  };
  return `User profile: ${JSON.stringify(profile)}\n` +
         `Action: ${interaction.action}\n` +
         `Metadata: ${JSON.stringify(interaction.metadata || {})}`;
}

async function exportUserTrainingData(userId, since = null) {
  const query = { user: userId };
  if (since) query.occurredAt = { $gte: since };
  const interactions = await ScheduleInteraction.find(query).sort({ occurredAt: 1 }).lean();
  const user = await User.findById(userId).lean();
  const items = interactions.map((it) => ({
    messages: [
      { role: 'system', content: 'You are LifeBuddy, a personal schedule assistant.' },
      { role: 'user', content: buildPromptForUser(user, it) },
      { role: 'assistant', content: `Record: ${it.action}` }
    ]
  }));
  return items;
}

async function fineTuneUserModel(userId) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const dataset = await exportUserTrainingData(userId);
  const filePath = path.join(__dirname, `user_${userId}_train.jsonl`);
  const jsonl = dataset.map(d => JSON.stringify(d)).join('\n');
  fs.writeFileSync(filePath, jsonl);
  const file = await openai.files.create({ file: fs.createReadStream(filePath), purpose: 'fine-tune' });
  const ft = await openai.fineTuning.jobs.create({ training_file: file.id, model: process.env.OPENAI_BASE_MODEL || 'gpt-4o-mini' });
  return ft;
}

module.exports = { exportUserTrainingData, fineTuneUserModel };

// --- PEFT/LoRA SFT EXPORT (for HF/QLoRA) ---
function buildSftExample(user, it, windowSummary = '') {
  const profile = `prefers: ${user.preferences?.timezone || 'UTC'} tz, plan: ${user.subscription?.plan || 'free'}`;
  const instruction = `User profile: ${profile}. Action: ${it.action}. Using recent context, propose today's improved schedule.`;
  const input = windowSummary || JSON.stringify(it.metadata || {});
  const response = it.action === 'rescheduled' ? 'Reschedule with stated constraints and preferences.' : `Acknowledge ${it.action} and optimize remaining day.`;
  return { instruction, input, response };
}

async function exportUserSFT(userId, outDir) {
  const user = await User.findById(userId).lean();
  const interactions = await ScheduleInteraction.find({ user: userId }).sort({ occurredAt: 1 }).lean();
  const items = interactions.map((it) => buildSftExample(user, it));
  const jsonl = items.map((d) => JSON.stringify(d)).join('\n');
  const datasetDir = outDir || path.join(__dirname, '..', 'training', 'datasets');
  if (!fs.existsSync(datasetDir)) fs.mkdirSync(datasetDir, { recursive: true });
  const filePath = path.join(datasetDir, `user_${userId}_sft.jsonl`);
  fs.writeFileSync(filePath, jsonl);
  return { filePath, count: items.length };
}

// Spawn a local QLoRA training job (requires Python env on the host)
async function runLocalLoraTraining({ userId, baseModel = process.env.LORA_BASE_MODEL || 'openai/gpt-oss-20b' }) {
  const datasetInfo = await exportUserSFT(userId);
  const scriptPath = path.join(__dirname, '..', 'training', 'fine_tune_lora.py');
  const adaptersDir = path.join(__dirname, '..', 'training', 'adapters');
  if (!fs.existsSync(adaptersDir)) fs.mkdirSync(adaptersDir, { recursive: true });
  return new Promise((resolve) => {
    const args = [scriptPath, '--model', baseModel, '--dataset', datasetInfo.filePath, '--out', path.join(adaptersDir, `user_${userId}_lora`)];
    const proc = spawn('python3', args, { stdio: 'pipe' });
    let logs = '';
    proc.stdout.on('data', (d) => (logs += d.toString()));
    proc.stderr.on('data', (d) => (logs += d.toString()));
    proc.on('close', (code) => resolve({ code, logs, adaptersDir }));
  });
}

module.exports.exportUserSFT = exportUserSFT;
module.exports.runLocalLoraTraining = runLocalLoraTraining;


