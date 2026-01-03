# Quick Fix for Console/Network Errors

## Immediate Steps

### 1. Stop and Restart Backstage

```bash
# In the terminal where Backstage is running, press Ctrl+C to stop

# Then restart:
cd backstage
yarn start
```

### 2. Wait for Full Startup

Backstage needs to:
- Compile TypeScript
- Build frontend bundle
- Start backend server
- Process catalog entries

**Wait 2-3 minutes** for the first startup. Look for:
- "webpack compiled successfully"
- "Listening on port 7007"
- "Catalog processing completed"

### 3. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for specific error messages
- **Network tab**: See which requests are failing

### 4. Common Fixes Applied

I've updated the configuration to:
- ✅ Changed TechDocs generator from 'docker' to 'local'
- ✅ Added example entities so catalog has content
- ✅ Fixed CORS configuration
- ✅ Added support section

### 5. Verify Backend is Running

```bash
# Test backend health
curl http://localhost:7007/api/catalog/health

# Should return: {"status":"ok"}
```

### 6. If Still Not Working

**Check the terminal output** where `yarn start` is running. Look for:
- Compilation errors
- Port conflicts
- File not found errors
- Database errors

**Common issues:**
- Port 3000 or 7007 already in use → Kill the process
- Catalog file paths wrong → Check paths in app-config.yaml
- Missing dependencies → Run `yarn install`

## Restart Process

1. **Stop Backstage**: Ctrl+C
2. **Clear cache** (optional): `rm -rf node_modules/.cache`
3. **Restart**: `yarn start`
4. **Wait 2-3 minutes** for full startup
5. **Check browser**: http://localhost:3000

## Still Having Issues?

Check `TROUBLESHOOTING.md` for detailed solutions.

