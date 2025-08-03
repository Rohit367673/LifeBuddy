#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoRestart {
  constructor() {
    this.process = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 2000; // 2 seconds
    this.isRestarting = false;
  }

  start() {
    console.log('🚀 Starting LifeBuddy Backend with Auto-Restart...');
    console.log('📁 Monitoring for file changes and crashes...');
    console.log('🔄 Auto-restart enabled (max 10 restarts)');
    console.log('⏹️  Press Ctrl+C to stop\n');

    this.spawnProcess();
    this.setupFileWatcher();
  }

  spawnProcess() {
    if (this.isRestarting) return;

    this.isRestarting = true;
    
    // Kill existing process if running
    if (this.process) {
      this.process.kill('SIGTERM');
    }

    console.log(`\n🔄 Starting backend process (attempt ${this.restartCount + 1}/${this.maxRestarts})...`);
    
    this.process = spawn('node', ['app.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    this.process.on('error', (error) => {
      console.error('❌ Process error:', error.message);
      this.handleCrash();
    });

    this.process.on('exit', (code, signal) => {
      console.log(`\n⚠️  Process exited with code ${code} and signal ${signal}`);
      this.handleCrash();
    });

    this.process.on('close', (code) => {
      console.log(`\n⚠️  Process closed with code ${code}`);
      this.handleCrash();
    });

    // Reset restart flag after a delay
    setTimeout(() => {
      this.isRestarting = false;
    }, 1000);
  }

  handleCrash() {
    if (this.restartCount >= this.maxRestarts) {
      console.error('❌ Maximum restart attempts reached. Stopping auto-restart.');
      process.exit(1);
    }

    this.restartCount++;
    console.log(`\n🔄 Restarting in ${this.restartDelay}ms... (${this.restartCount}/${this.maxRestarts})`);
    
    setTimeout(() => {
      this.spawnProcess();
    }, this.restartDelay);
  }

  setupFileWatcher() {
    const watchPaths = [
      path.join(__dirname, 'app.js'),
      path.join(__dirname, 'routes'),
      path.join(__dirname, 'controllers'),
      path.join(__dirname, 'models'),
      path.join(__dirname, 'middlewares')
    ];

    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
            console.log(`\n📝 File changed: ${filename}`);
            console.log('🔄 Restarting due to file change...');
            this.restartCount = 0; // Reset restart count for file changes
            this.spawnProcess();
          }
        });
      }
    });
  }

  stop() {
    console.log('\n🛑 Stopping auto-restart...');
    if (this.process) {
      this.process.kill('SIGTERM');
    }
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  autoRestart.stop();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  autoRestart.stop();
});

const autoRestart = new AutoRestart();
autoRestart.start(); 