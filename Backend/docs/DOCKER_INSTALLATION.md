# Docker Installation for macOS

## Install Docker Desktop

1. **Download Docker Desktop for Mac:**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose your chip type (Intel or Apple Silicon)

2. **Install Docker Desktop:**
   - Open the downloaded `.dmg` file
   - Drag Docker to Applications folder
   - Launch Docker from Applications
   - Follow setup wizard

3. **Verify Installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

## Alternative: Install via Homebrew

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

## After Installation

1. **Start WAHA Container:**
   ```bash
   cd /Applications/folders/LifeBuddy/Backend
   docker-compose -f docker-compose.waha.yml up -d
   ```

2. **Check Container Status:**
   ```bash
   docker ps
   ```

3. **Access WAHA Dashboard:**
   - Open: http://localhost:3000/dashboard/
   - Login: waha/waha

## Alternative: Node.js WAHA Setup (No Docker)

If you prefer not to use Docker, you can run WAHA directly with Node.js:

```bash
# Install WAHA globally
npm install -g @devlikeapro/waha

# Start WAHA server
waha --api-key=your-secret-key-321 --port=3000
```

Then proceed with the WhatsApp session setup at http://localhost:3000/dashboard/
