// Development Configuration
// Update this file with your computer's IP address for team testing

export const DEV_CONFIG = {
  // Your computer's IP address for mobile testing
  // Find it by running: ifconfig | grep "inet " | grep -v 127.0.0.1
  COMPUTER_IP: '35.3.222.26', // Change this to your IP address
  
  // Backend port
  BACKEND_PORT: '8080',
} as const;
