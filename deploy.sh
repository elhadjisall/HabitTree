#!/bin/bash

# HabitTree Deployment Helper Script

echo "🚀 HabitTree Deployment Helper"
echo "================================"
echo ""
echo "Choose an option:"
echo "1. Start ngrok (Quick public URL for testing)"
echo "2. Build frontend for production"
echo "3. Show deployment instructions"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📡 Starting ngrok..."
    echo "Note: You need to authenticate ngrok first:"
    echo "  1. Sign up at https://dashboard.ngrok.com/signup"
    echo "  2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    read -p "Press Enter to start ngrok (or Ctrl+C to cancel)..."
    ngrok http 5173
    ;;
  2)
    echo ""
    echo "🔨 Building frontend for production..."
    npm run build
    echo ""
    echo "✅ Build complete! Output in 'dist' folder"
    echo "You can now deploy the 'dist' folder to Netlify or any static hosting"
    ;;
  3)
    echo ""
    cat DEPLOYMENT.md
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

