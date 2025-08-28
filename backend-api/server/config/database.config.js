"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = exports.getDatabaseConfig = void 0;
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
// Default MongoDB connection options
const defaultOptions = {
    // Connection settings
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    // Additional options for stability
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    retryWrites: true, // Retry failed writes
};
// Get database configuration from environment or defaults
const getDatabaseConfig = () => {
    const uri = process.env['MONGODB_URI'] ||
        process.env['DATABASE_URL'] ||
        'mongodb://localhost:27017/valeda-treatments';
    return {
        uri,
        options: {
            ...defaultOptions,
            dbName: process.env['MONGODB_DB_NAME'] || 'valeda-treatments'
        }
    };
};
exports.getDatabaseConfig = getDatabaseConfig;
// Database connection class
class DatabaseService {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('🔗 Database already connected');
            return;
        }
        try {
            const config = (0, exports.getDatabaseConfig)();
            console.log('🔌 Connecting to MongoDB...');
            console.log(`📍 Database URI: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`);
            await mongoose_1.default.connect(config.uri, config.options);
            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');
            // Handle connection events
            this.setupEventHandlers();
        }
        catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('📴 MongoDB disconnected');
        }
        catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'error',
                    message: 'Database not connected'
                };
            }
            // Ping the database
            await mongoose_1.default.connection.db.admin().ping();
            const dbStats = await mongoose_1.default.connection.db.stats();
            return {
                status: 'healthy',
                message: 'Database connection is healthy',
                details: {
                    readyState: mongoose_1.default.connection.readyState,
                    host: mongoose_1.default.connection.host,
                    port: mongoose_1.default.connection.port,
                    name: mongoose_1.default.connection.name,
                    collections: dbStats['collections'],
                    dataSize: `${(dbStats['dataSize'] / 1024 / 1024).toFixed(2)} MB`
                }
            };
        }
        catch (error) {
            return {
                status: 'error',
                message: `Database health check failed: ${error}`,
                details: {
                    readyState: mongoose_1.default.connection.readyState,
                    error: error
                }
            };
        }
    }
    setupEventHandlers() {
        mongoose_1.default.connection.on('connected', () => {
            console.log('🔗 Mongoose connected to MongoDB');
        });
        mongoose_1.default.connection.on('error', (error) => {
            console.error('❌ Mongoose connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('📴 Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconnected to MongoDB');
            this.isConnected = true;
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            console.log('🛑 Received SIGINT, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('🛑 Received SIGTERM, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });
    }
}
exports.DatabaseService = DatabaseService;
// Export singleton instance
exports.databaseService = DatabaseService.getInstance();
//# sourceMappingURL=database.config.js.map