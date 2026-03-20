import { connect } from 'mongoose';
import { Redis } from 'ioredis';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

interface HealthStatus {
    service: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    error?: string;
}

class HealthChecker {
    private results: HealthStatus[] = [];

    async checkMongoDB(): Promise<HealthStatus> {
        const start = Date.now();
        try {
            if (!process.env.MONGO_URI) {
                throw new Error('MONGO_URI environment variable not set');
            }            await connect(process.env.MONGO_URI, {
                dbName: "chibibase",
                serverSelectionTimeoutMS: 5000,
                bufferCommands: false
            });

            const responseTime = Date.now() - start;
            console.log('✅ MongoDB connection successful');
            
            return {
                service: 'MongoDB',
                status: 'healthy',
                responseTime
            };
        } catch (error) {
            console.log('❌ MongoDB connection failed:', error);
            return {
                service: 'MongoDB',
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async checkRedis(): Promise<HealthStatus> {
        const start = Date.now();
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            connectTimeout: 5000,
            lazyConnect: true
        });

        try {
            await redis.connect();
            await redis.ping();
            
            const responseTime = Date.now() - start;
            console.log('✅ Redis connection successful');
            
            await redis.disconnect();
            
            return {
                service: 'Redis',
                status: 'healthy',
                responseTime
            };
        } catch (error) {
            console.log('❌ Redis connection failed:', error);
            return {
                service: 'Redis',
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async checkDiscord(): Promise<HealthStatus> {
        const start = Date.now();
        try {
            if (!process.env.TOKEN) {
                throw new Error('TOKEN environment variable not set');
            }

            const client = new Client({
                intents: [GatewayIntentBits.Guilds]
            });

            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Discord login timeout'));
                }, 10000);

                client.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                client.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });

                client.login(process.env.TOKEN).catch(reject);
            });

            const responseTime = Date.now() - start;
            console.log('✅ Discord connection successful');
            
            client.destroy();
            
            return {
                service: 'Discord',
                status: 'healthy',
                responseTime
            };
        } catch (error) {
            console.log('❌ Discord connection failed:', error);
            return {
                service: 'Discord',
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async runHealthChecks(): Promise<void> {
        console.log('🔍 Running health checks...\n');

        this.results = await Promise.all([
            this.checkMongoDB(),
            this.checkRedis(),
            this.checkDiscord()
        ]);

        console.log('\n📊 Health Check Summary:');
        console.log('========================');

        let allHealthy = true;
        for (const result of this.results) {
            const statusIcon = result.status === 'healthy' ? '✅' : '❌';
            const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
            
            console.log(`${statusIcon} ${result.service}: ${result.status}${responseTime}`);
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.status !== 'healthy') {
                allHealthy = false;
            }
        }

        console.log('\n' + (allHealthy ? '🎉 All services are healthy!' : '⚠️  Some services are unhealthy'));
        
        process.exit(allHealthy ? 0 : 1);
    }
}

// Run health checks if this script is executed directly
if (require.main === module) {
    const checker = new HealthChecker();
    checker.runHealthChecks().catch((error) => {
        console.error('Health check failed:', error);
        process.exit(1);
    });
}
