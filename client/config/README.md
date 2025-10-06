# Configuration Setup

## For Team Members

### Setting up your development environment:

1. **Find your computer's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Update the IP address:**
   - Open `client/config/development.ts`
   - Change `COMPUTER_IP: '35.3.222.26'` to your IP address
   - Save the file

3. **That's it!** The app will automatically use:
   - `localhost:8080` when testing in web browser
   - `YOUR_IP:8080` when testing on mobile device

### Example:
If your IP is `192.168.1.100`, change:
```typescript
COMPUTER_IP: '192.168.1.100',
```

### Testing:
- **Web browser**: Uses localhost automatically
- **Mobile device**: Uses your configured IP automatically
- **No more hardcoded URLs!** 🎉
