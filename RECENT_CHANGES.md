# LifeBuddy – Recent Changes and End‑to‑End Schedule Pipeline

This document captures what changed and how the full ‘Premium AI Scheduling + Messaging + Personalization’ flow works.

## 1) Overview
- Rebuilt Productivity UX (multi‑step, mobile‑safe, sticky actions).
- Added platform selection and Telegram deep‑link connect/check.
- Stabilized AI generation via OpenRouter with user context.
- Delivery via Telegram/WhatsApp/Email with rich formatting.
- Data capture for interactions; SFT export; training triggers (OpenAI or local LoRA/QLoRA).

## 2) Frontend (Productivity System)
- Frontend/lifebuddy/src/pages/Productivity.jsx
  - Step 1: Title + Start/End dates.
  - Step 2: Description + Requirements.
  - Step 3: Preferred Platform (Email/WhatsApp/Telegram).
    - Telegram: Connect (t.me link) + Check Connection; fills telegramChatId.
    - WhatsApp: country code + number.
    - Email: email input.
  - Consent required; submit to /api/premium-tasks/setup.

## 3) Backend (APIs/Services)
- Backend/services/openRouterService.js: reads OPENROUTER_API_KEY, adds headers, accepts userContext for personalized prompts, parses day plans.
- Backend/services/messagingService.js: Email/Telegram/WhatsApp delivery; multi‑message support for chat apps; HTML email.
- Backend/routes/premiumTaskRoutes.js:
  - POST /api/premium-tasks/setup → create, generate schedule, send Day 1.
  - POST /api/premium-tasks/:id/mark → complete/skip, streaks, regenerate or send next.
  - GET /api/premium-tasks/today and /weekly-summary.
  - POST /api/premium-tasks/:id/interactions and /:id/event → capture user actions.
- Backend/routes/userRoutes.js:
  - GET /api/users/telegram/link-token and POST /api/users/telegram/link.
  - GET /api/users/profile.
  - Training: GET /api/users/training/sft, POST /api/users/training/fine-tune.
- Models:
  - ScheduleInteraction for event capture.
  - User.fineTunedModel to store adapter/model id.
- Bot: Backend/bot/lifebuddy_telegram_bot.js links chat IDs.

## 4) End‑to‑End Flow
1. User completes steps, selects platform, consents.
2. Client calls POST /api/premium-tasks/setup with platform + contact.
3. Server builds personalized prompt with userContext and calls OpenRouter.
4. Response parsed into generatedSchedule[] and stored.
5. Day 1 is delivered via preferred platform.
6. Daily usage: show today (GET /today), mark complete/skip (POST /:id/mark), next day sent if applicable.

## 5) Personalization Pipeline
- Capture: schedule actions (accepted/skipped/rescheduled/completed/snoozed) + metadata.
- Export: GET /api/users/training/sft → JSONL SFT examples.
- Train:
  - OpenAI fine‑tune (set TRAINING_MODE=openai, OPENAI_API_KEY).
  - Local LoRA/QLoRA stub: spawns training/fine_tune_lora.py on GPU host.
- Attach: store per‑user adapter/model id on user.fineTunedModel; prefer personalized model at inference.

## 6) Configuration
Backend env:
- OPENROUTER_API_KEY (required), OPENROUTER_MODEL (default: deepseek/deepseek-r1:free).
- OPENROUTER_REFERRER, OPENROUTER_TITLE (optional).
- TELEGRAM_BOT_TOKEN, BACKEND_URL, JWT_SECRET.
- OPENAI_API_KEY, OPENAI_BASE_MODEL (for OpenAI fine‑tune).
- TRAINING_MODE=openai to use OpenAI; otherwise local LoRA path.

Frontend env:
- VITE_API_URL, VITE_TELEGRAM_BOT_USERNAME.

## 7) Key Routes
- Premium tasks: setup, mark, interactions/event, today, weekly‑summary.
- Users: profile, telegram link‑token/link, training sft, training fine‑tune.

## 8) Run
- Backend: cd Backend && npm install && npm start.
- Frontend: cd Frontend/lifebuddy && npm install && npm run dev.
- Telegram bot: node Backend/bot/lifebuddy_telegram_bot.js (ensure BACKEND_URL).

## 9) Troubleshooting
- OpenRouter 401 → set OPENROUTER_API_KEY and restart.
- Telegram not linked → Connect then Check.
- Training errors → ensure Python deps on GPU host (transformers, peft, trl, datasets).

## 10) Next
- Frontend capture everywhere; admin training dashboard; per‑user adapter inference service; privacy/consent UI.

## 11) AI Integration Update (DeepSeek R1 via OpenRouter)

### Context-Based Personalization
- **OpenRouter DeepSeek R1**: Exclusive provider for AI responses across chat and scheduling
- **Smart Prompt Engineering**: Dynamic prompts include user profile, learning style, and interaction history
- **Topic Specialization**: Dedicated flows for coding, fitness, education, and productivity

### User Profile Enhancement
- **AI Profile Fields**: Learning style, experience level, communication prefs, and goals
- **Context-Aware Responses**: Considers background and previous interactions
- **Personalized Recommendations**: Tailored advice based on individual needs

### Frontend AI Chat Interface
- **Topic Selection**: General, coding, fitness, education, and productivity
- **Real-time Chat**: Interactive chat interface with message history and user context
- **Responsive Design**: Mobile-friendly with smooth animations
- **Context Display**: Shows AI profile and recent interaction history

### Backend Implementation
- **openRouterService**: Handles all OpenRouter API calls with DeepSeek R1
- **AI Chat Routes**: All endpoints call OpenRouter with DeepSeek R1; no fallbacks
- **Context Injection**: Automatically includes user profile and interaction history
- **Interaction Logging**: Records chat interactions for personalization

### Environment Variables
- **OPENROUTER_API_KEY**: Your OpenRouter API key
- **OPENROUTER_MODEL**: Defaults to deepseek/deepseek-r1:free

### Usage
- Navigate to `/ai-chat`
- Select a topic (coding, fitness, education, productivity, or general)
- Chat with LifeBuddy AI and receive personalized responses
