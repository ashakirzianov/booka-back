import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';
import * as Contracts from '../contracts';
import { assertNever } from '../bookConverter/utils';
import { addUnique } from '../utils';

const schema = {
    facebookId: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    pictureUrl: {
        type: String,
    },
    uploadedBooks: {
        type: Array,
    },
};

export type User = TypeFromSchema<typeof schema>;
type UserDocument = User & Document;

const UserSchema = new Schema(schema, { timestamps: true });
const UserCollection: Model<UserDocument> = model<UserDocument>('User', UserSchema);

export type IdProvider = 'facebook';
export type ExternalId = {
    provider: IdProvider,
    id: string,
};
async function byId(id: string): Promise<Contracts.UserInfo | undefined> {
    const user = await UserCollection.findById(id).exec();
    return user
        ? {
            name: user.name,
            pictureUrl: user.pictureUrl,
        }
        : undefined;
}

async function updateOrCreate(externalId: ExternalId, userInfo: Contracts.UserInfo) {
    if (externalId.provider === 'facebook') {
        return updateOrCreateWithCond({ facebookId: externalId.id }, userInfo);
    } else {
        return assertNever(externalId.provider);
    }
}
async function addUploadedBook(userId: string, bookId: string) {
    const user = await UserCollection.findById(userId).exec();
    if (user) {
        const books = user.uploadedBooks || [];
        const updated = addUnique(books, bookId);
        user.uploadedBooks = updated;
        await user.save();
        return { success: true as const };
    } else {
        return {
            success: false as const,
            reason: `Can't find user by id: '${userId}'`,
        };
    }
}

export const users = {
    byId,
    updateOrCreate,
    addUploadedBook,
};

async function updateOrCreateWithCond(condition: Partial<User>, userInfo: Contracts.UserInfo): Promise<User> {
    const existing = await UserCollection.findOne(condition).exec();
    if (existing) {
        existing.name = userInfo.name;
        existing.pictureUrl = userInfo.pictureUrl;
        await existing.save();
        return existing;
    } else {
        const created = await UserCollection.insertMany({
            ...condition,
            name: userInfo.name,
            pictureUrl: userInfo.pictureUrl,
        });
        return created;
    }
}
