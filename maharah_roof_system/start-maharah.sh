#!/bin/bash

echo "════════════════════════════════════════"
echo "     Maharah Roof System - Starting     "
echo "════════════════════════════════════════"
echo ""
echo "Database: maharah_roof"
echo "Backend:  http://localhost:6000"
echo "Frontend: http://localhost:3001 (dev)"
echo ""
echo "════════════════════════════════════════"

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the maharah_roof_system directory"
    exit 1
fi

# Start Backend
echo "Starting Backend on port 6000..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo ""
echo "Backend started! PID: $BACKEND_PID"
echo ""
echo "════════════════════════════════════════"
echo "System is ready!"
echo ""
echo "Open: http://localhost:6000"
echo ""
echo "Login: admin / 123456"
echo "════════════════════════════════════════"

# Keep script running
wait $BACKEND_PID
