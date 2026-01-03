# Node.js Version Upgrade Required

## Problem
Backstage requires Node.js 22 or 24, but you're running Node.js v18.20.8.

The error `toSorted is not a function` occurs because this method requires Node.js 20+.

## Solution: Upgrade Node.js

### Option 1: Install nvm (Recommended)
nvm (Node Version Manager) makes it easy to switch between Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.zshrc  # or ~/.bashrc

# Install Node.js 22
nvm install 22

# Use Node.js 22
nvm use 22

# Verify version
node --version  # Should show v22.x.x

# Set as default (optional)
nvm alias default 22
```

### Option 2: Using Homebrew (macOS)
```bash
# Install Node.js 22
brew install node@22

# Link it
brew link node@22 --force

# Verify
node --version
```

### Option 3: Direct Download
Visit https://nodejs.org/ and download Node.js 22 LTS installer for macOS.

## After Upgrading

1. **Restart your terminal** (to pick up the new Node.js version)
2. **Verify the version:**
   ```bash
   node --version  # Should show v22.x.x or v24.x.x
   ```
3. **Restart Backstage:**
   ```bash
   cd backstage
   yarn start
   ```

## Troubleshooting

If you still see the error after upgrading:
- Make sure you restarted your terminal
- Check `node --version` in the same terminal where you run `yarn start`
- If using nvm, make sure `nvm use 22` is run in the same terminal
