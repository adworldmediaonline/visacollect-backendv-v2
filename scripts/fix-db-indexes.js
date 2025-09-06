import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const fixDatabaseIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the payments collection
    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    // Drop the problematic index
    try {
      await collection.dropIndex('webhookEvents.eventId_1');
      console.log('✅ Dropped problematic webhookEvents.eventId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log(
          'ℹ️ Index webhookEvents.eventId_1 does not exist, skipping...'
        );
      } else {
        console.log('⚠️ Error dropping index:', error.message);
      }
    }

    // List current indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes on payments collection:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Database index fix completed!');
  } catch (error) {
    console.error('❌ Error fixing database indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix
fixDatabaseIndexes();
