import * as Mongoose from 'mongoose';

export async function connectDb() {
    Mongoose.set('useNewUrlParser', true);
    Mongoose.set('useFindAndModify', false);
    Mongoose.set('useCreateIndex', true);

    Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booka');
}

export async function dropDb() {
    for (const [key, collection] of Object.entries(Mongoose.connection.collections)) {
        await collection.drop();
    }
}
