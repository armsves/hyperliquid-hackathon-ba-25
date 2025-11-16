# Submission Instructions

## Preparing Your Project for Submission

1. **Fork the hackathon repository:**
   ```bash
   git clone https://github.com/armsves/hyperliquid-hackathon-ba-25.git
   cd hyperliquid-hackathon-ba-25
   ```

2. **Create a new branch:**
   ```bash
   git checkout -b loopdrops-bot
   ```

3. **Create submission folder:**
   ```bash
   mkdir -p submissions/loopdrops-bot
   ```

4. **Copy your project files:**
   ```bash
   # From your LoopDropsBot directory
   cp -r /home/armsve/devconnect25/hyperliquid/LoopDropsBot/* submissions/loopdrops-bot/
   
   # Exclude node_modules and other build artifacts
   cd submissions/loopdrops-bot
   rm -rf node_modules .next .vercel
   ```

5. **Rename README for submission:**
   ```bash
   mv SUBMISSION_README.md README.md
   ```

6. **Commit and push:**
   ```bash
   git add submissions/loopdrops-bot/
   git commit -m "Add LoopDrops Bot submission"
   git push origin loopdrops-bot
   ```

7. **Create Pull Request:**
   - Go to https://github.com/armsves/hyperliquid-hackathon-ba-25
   - Click "New Pull Request"
   - Select your branch
   - Submit before the deadline

## Files to Include

✅ All source code (app/, lib/, components/)  
✅ Configuration files (package.json, tsconfig.json, etc.)  
✅ README.md (SUBMISSION_README.md renamed)  
✅ LICENSE file  
✅ Smart contracts (contracts/)  
✅ Documentation files  

## Files to Exclude

❌ node_modules/  
❌ .next/ (build output)  
❌ .vercel/  
❌ .env files  
❌ Any sensitive data  

## Submission Checklist

- [ ] Fork the repository
- [ ] Create submission folder
- [ ] Copy project files
- [ ] Include README.md
- [ ] Include LICENSE file
- [ ] Remove node_modules and build artifacts
- [ ] Test that the project structure is correct
- [ ] Create Pull Request before deadline
