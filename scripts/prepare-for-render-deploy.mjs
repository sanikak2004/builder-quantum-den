#!/usr/bin/env node

/**
 * Prepare Repository for Render Deployment
 * This script automates the preparation of your repository for deployment to Render
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Preparing repository for Render deployment...\n');

try {
  // 1. Check if we're in a git repository
  console.log('1. Checking git repository status...');
  execSync('git status', { stdio: 'pipe' });
  console.log('✅ Git repository found\n');

  // 2. Check current branch
  console.log('2. Checking current branch...');
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  console.log(`✅ Current branch: ${currentBranch}\n`);

  // 3. Ensure we're on main branch
  if (currentBranch !== 'main') {
    console.log('⚠️  Switching to main branch...');
    execSync('git checkout main', { stdio: 'inherit' });
    console.log('✅ Switched to main branch\n');
  }

  // 4. Pull latest changes
  console.log('3. Pulling latest changes...');
  execSync('git pull origin main', { stdio: 'inherit' });
  console.log('✅ Pulled latest changes\n');

  // 5. Check for uncommitted changes
  console.log('4. Checking for uncommitted changes...');
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
  
  if (statusOutput.trim() !== '') {
    console.log('⚠️  Found uncommitted changes. Committing them now...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Prepare for Render deployment"', { stdio: 'inherit' });
    console.log('✅ Committed changes\n');
  } else {
    console.log('✅ No uncommitted changes found\n');
  }

  // 6. Push changes to GitHub
  console.log('5. Pushing changes to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Pushed changes to GitHub\n');

  // 7. Create render.yaml if it doesn't exist
  console.log('6. Creating Render blueprint...');
  const renderYamlPath = path.join(process.cwd(), 'render.yaml');
  
  const renderYamlContent = `# Render Blueprint for eKYC Blockchain System
# This file defines the services and databases for deployment on Render

services:
  - type: web
    name: ekyc-blockchain-app
    env: node
    plan: starter
    buildCommand: npm run build:render
    startCommand: npm run start:render
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
      - key: JWT_SECRET
        value: super_secure_jwt_secret_key_here_32_characters_min
      - key: ENCRYPTION_KEY
        value: 32_character_encryption_key_for_data_protection
      - key: PORT
        value: 10000
`;

  if (!fs.existsSync(renderYamlPath)) {
    fs.writeFileSync(renderYamlPath, renderYamlContent);
    console.log('✅ Created render.yaml\n');
    
    // Commit the new file
    console.log('7. Committing render.yaml...');
    execSync('git add render.yaml', { stdio: 'inherit' });
    execSync('git commit -m "Add Render blueprint for automated deployment"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Committed and pushed render.yaml\n');
  } else {
    console.log('✅ render.yaml already exists\n');
  }

  // 8. Create a deploy badge for README
  console.log('8. Updating README with deploy button...');
  const readmePath = path.join(process.cwd(), 'README.md');
  if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, 'utf-8');
    
    // Add deploy button if not already present
    if (!readmeContent.includes('[![Deploy to Render]')) {
      // Add to the top of the README
      readmeContent = `[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)\n\n` + readmeContent;
      fs.writeFileSync(readmePath, readmeContent);
      console.log('✅ Added deploy button to README\n');
      
      // Commit the change
      execSync('git add README.md', { stdio: 'inherit' });
      execSync('git commit -m "Add Render deploy button to README"', { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Committed and pushed README update\n');
    } else {
      console.log('✅ Deploy button already in README\n');
    }
  }

  console.log('🎉 Repository preparation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to https://render.com and sign in');
  console.log('2. Click "New +" → "Web Service"');
  console.log('3. Connect your GitHub repository: sanikak2004/builder-quantum-den');
  console.log('4. Use these settings:');
  console.log('   - Build Command: npm run build:render');
  console.log('   - Start Command: npm run start:render');
  console.log('5. Add the environment variables from render.yaml');
  console.log('6. Click "Create Web Service"');
  console.log('\n🔗 Or use the automated deploy button in your README on GitHub');

} catch (error) {
  console.error('❌ Error during deployment preparation:', error.message);
  process.exit(1);
}