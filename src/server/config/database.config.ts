import mongoose from 'mongoose';

// Database configuration interface
export interface IDatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

// Default MongoDB connection options
const defaultOptions: mongoose.ConnectOptions = {
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
export const getDatabaseConfig = (): IDatabaseConfig => {
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

// Database connection class
export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('🔗 Database already connected');
      return;
    }

    try {
      const config = getDatabaseConfig();
      console.log('🔌 Connecting to MongoDB...');
      console.log(`📍 Database URI: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`);

      await mongoose.connect(config.uri, config.options);

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📴 MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'error',
          message: 'Database not connected'
        };
      }

      // Ping the database
      await mongoose.connection.db!.admin().ping();

      const dbStats = await mongoose.connection.db!.stats();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          collections: dbStats['collections'],
          dataSize: `${(dbStats['dataSize'] / 1024 / 1024).toFixed(2)} MB`
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database health check failed: ${error}`,
        details: {
          readyState: mongoose.connection.readyState,
          error: error
        }
      };
    }
  }

  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
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

// Export singleton instance
export const databaseService = DatabaseService.getInstance();