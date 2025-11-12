#!/bin/bash

# KinConnect Development Server Startup Script
# This script starts both the backend Spring Boot server and the Expo frontend

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR/server"
CLIENT_DIR="$SCRIPT_DIR/client"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   KinConnect Development Servers${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if port 8080 is already in use
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use. Killing existing process...${NC}"
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Set up Java 17 environment
echo -e "${GREEN}📦 Configuring Java 17 environment...${NC}"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$JAVA_HOME/bin:$PATH

# Verify Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" != "17" ]; then
    echo -e "${RED}❌ Java 17 not found. Please install it with: brew install openjdk@17${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Java 17 configured${NC}\n"

# Start backend server
echo -e "${GREEN}🚀 Starting Spring Boot backend server...${NC}"
cd "$SERVER_DIR"
./mvnw spring-boot:run > /tmp/kinconnect-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}   Backend PID: $BACKEND_PID${NC}"
echo -e "${GREEN}   Backend logs: /tmp/kinconnect-backend.log${NC}"

# Wait a moment for backend to initialize
sleep 3

# Start Expo frontend in Go mode (shows QR code)
echo -e "\n${GREEN}🚀 Starting Expo development server...${NC}"
cd "$CLIENT_DIR"
# Start Expo in the foreground without redirecting output so QR code is visible
npx expo start --go &
EXPO_PID=$!
echo -e "${GREEN}   Expo PID: $EXPO_PID${NC}"

# Save PIDs to file for easy shutdown
echo "$BACKEND_PID" > /tmp/kinconnect-backend.pid
echo "$EXPO_PID" > /tmp/kinconnect-frontend.pid

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Both servers are starting up!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📍 Server URLs:${NC}"
echo -e "   Backend: ${GREEN}http://10.0.0.143:8080${NC}"
echo -e "   Expo:    ${GREEN}exp://10.0.0.143:8081${NC}\n"

echo -e "${YELLOW}📋 Useful commands:${NC}"
echo -e "   View backend logs:  ${BLUE}tail -f /tmp/kinconnect-backend.log${NC}"
echo -e "   Stop servers:       ${BLUE}$SCRIPT_DIR/stop-dev.sh${NC}\n"

echo -e "${YELLOW}⏳ Waiting for servers to be ready...${NC}"
sleep 5

# Check if backend started successfully
if ! lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ Backend failed to start. Check logs: tail -f /tmp/kinconnect-backend.log${NC}"
else
    echo -e "${GREEN}✅ Backend is running on port 8080${NC}"
fi

# Check if Expo started successfully
if ! lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Expo may still be starting. Check logs: tail -f /tmp/kinconnect-frontend.log${NC}"
else
    echo -e "${GREEN}✅ Expo is running on port 8081${NC}"
fi

echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${YELLOW}   Scan the QR code in the Expo terminal or view logs above${NC}\n"
