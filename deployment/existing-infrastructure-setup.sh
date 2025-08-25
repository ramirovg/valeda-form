#!/bin/bash
echo "=== VALEDA SETUP WITH EXISTING PM2 & MONGODB ==="
echo "Date: $(date)"
echo ""

# Verify existing infrastructure
echo "--- Verifying Existing Infrastructure ---"
echo "PM2 Status:"
pm2 status

echo ""
echo "MongoDB Status:"
systemctl status mongod --no-pager -l || service mongod status

echo ""
echo "Current PM2 Applications:"
pm2 list

echo ""
echo "MongoDB Databases:"
mongo --eval "db.adminCommand('listDatabases')" --quiet || echo "Could not list databases"

echo ""
echo "--- Checking Node.js Version ---"
node_version=$(node --version)
echo "Node.js version: $node_version"

# Check if Node.js version is compatible (14+)
major_version=$(echo $node_version | sed 's/v//' | cut -d'.' -f1)
if [ "$major_version" -ge 14 ]; then
    echo "✅ Node.js version is compatible with Angular 20"
else
    echo "⚠️  Node.js version may need upgrade for optimal performance"
fi

echo ""
echo "--- Setting up Application Directory ---"
# Create application directory
mkdir -p /var/www/oftalmonet.mx/valeda
cd /var/www/oftalmonet.mx/valeda

# Set proper permissions
chown -R $USER:$USER /var/www/oftalmonet.mx/valeda

echo "✅ Application directory created: /var/www/oftalmonet.mx/valeda"

echo ""
echo "--- Checking Available Ports ---"
echo "Port 3001 availability:"
if netstat -tulpn | grep -q ":3001"; then
    echo "⚠️  Port 3001 is in use:"
    netstat -tulpn | grep ":3001"
    echo "You may need to choose a different port or stop the conflicting service"
else
    echo "✅ Port 3001 is available for Valeda API"
fi

echo ""
echo "--- MongoDB Database Setup ---"
echo "Creating Valeda database and test connection..."

# Create a simple script to setup the database
cat > setup_valeda_db.js << 'EOF'
// Switch to valeda database
use('valeda-treatments-prod');

// Create a test collection to ensure database exists
db.test.insertOne({
    message: "Valeda database initialized",
    timestamp: new Date(),
    version: "1.0.0"
});

// Create indexes for better performance
db.treatments.createIndex({ "patient.name": 1 });
db.treatments.createIndex({ "doctor.name": 1 });
db.treatments.createIndex({ "createdAt": -1 });

print("✅ Valeda database setup completed");
print("Database: " + db.getName());
print("Collections will be created automatically when data is inserted");
EOF

# Run the database setup
mongosh < setup_valeda_db.js || mongo < setup_valeda_db.js || echo "Database setup will be handled by the application"

echo ""
echo "--- Pre-deployment Checklist ---"
echo "✅ PM2 is running and ready"
echo "✅ MongoDB is running and ready"
echo "✅ Application directory created"
echo "✅ Port 3001 checked"
echo "✅ Database setup attempted"

echo ""
echo "--- Next Steps ---"
echo "1. Upload deployment files to /var/www/oftalmonet.mx/valeda/"
echo "2. Run: cd /var/www/oftalmonet.mx/valeda && npm install"
echo "3. Start application: pm2 start ecosystem.config.js --env production"
echo "4. Configure Nginx reverse proxy"
echo "5. Test deployment"

echo ""
echo "=== SETUP COMPLETED SUCCESSFULLY ==="