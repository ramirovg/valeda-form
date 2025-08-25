#!/bin/bash
echo "=== CURRENT SERVER STATE CHECK ==="
echo "Date: $(date)"
echo ""

echo "--- Current Node.js Processes ---"
ps aux | grep -E 'node' | grep -v grep || echo "No Node.js processes found"
echo ""

echo "--- Current MongoDB Processes ---"
ps aux | grep -E 'mongod' | grep -v grep || echo "No MongoDB processes found"
echo ""

echo "--- PM2 Status ---"
pm2 status 2>/dev/null || echo "PM2 not installed or no processes"
echo ""

echo "--- Port Usage (3000, 8080, 27017, 3001) ---"
netstat -tulpn 2>/dev/null | grep -E ':(3000|8080|27017|3001)' || echo "No processes on these ports"
echo ""

echo "--- Current Node.js Version ---"
node --version 2>/dev/null || echo "Node.js not installed"
echo ""

echo "--- Current MongoDB Version ---"
mongod --version 2>/dev/null | head -1 || echo "MongoDB not installed"
echo ""

echo "--- System Info ---"
cat /etc/os-release | grep "PRETTY_NAME"
uname -r
echo ""

echo "--- Available Disk Space ---"
df -h /var/www 2>/dev/null || df -h /
echo ""

echo "=== END SERVER STATE CHECK ==="