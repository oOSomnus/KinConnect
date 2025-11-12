#!/bin/bash

# KinConnect Development Server Shutdown Script
# This script stops both the backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Stopping KinConnect Servers${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Stop backend server
if [ -f /tmp/kinconnect-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/kinconnect-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Stopping backend server (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        sleep 2
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend server not running${NC}"
    fi
    rm /tmp/kinconnect-backend.pid
else
    echo -e "${YELLOW}⚠️  No backend PID file found${NC}"
fi

# Stop Expo server
if [ -f /tmp/kinconnect-frontend.pid ]; then
    EXPO_PID=$(cat /tmp/kinconnect-frontend.pid)
    if ps -p $EXPO_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Stopping Expo server (PID: $EXPO_PID)...${NC}"
        kill $EXPO_PID 2>/dev/null
        sleep 2
        # Force kill if still running
        if ps -p $EXPO_PID > /dev/null 2>&1; then
            kill -9 $EXPO_PID 2>/dev/null
        fi
        echo -e "${GREEN}✅ Expo server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Expo server not running${NC}"
    fi
    rm /tmp/kinconnect-frontend.pid
else
    echo -e "${YELLOW}⚠️  No Expo PID file found${NC}"
fi

# Kill any remaining processes on ports 8080 and 8081
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}🛑 Cleaning up remaining processes on port 8080...${NC}"
    lsof -ti:8080 | xargs kill -9 2>/dev/null
fi

if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}🛑 Cleaning up remaining processes on port 8081...${NC}"
    lsof -ti:8081 | xargs kill -9 2>/dev/null
fi

echo -e "\n${GREEN}✅ All servers stopped${NC}\n"
