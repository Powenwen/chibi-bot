// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the bot database
db = db.getSiblingDB('chibibase');

// Create collections with validation if needed
db.createCollection('welcomesystems');
db.createCollection('stickymessages');
db.createCollection('autoreactions');
db.createCollection('suggestions');
db.createCollection('suggestionchannels');

// Create indexes for better performance
db.welcomesystems.createIndex({ "guildId": 1 }, { unique: true });
db.stickymessages.createIndex({ "guildId": 1, "channelId": 1 });
db.autoreactions.createIndex({ "guildId": 1, "channelId": 1 });
db.suggestions.createIndex({ "guildId": 1, "status": 1 });
db.suggestionchannels.createIndex({ "guildId": 1 }, { unique: true });

print('Database initialized successfully for Chibi Bot');
