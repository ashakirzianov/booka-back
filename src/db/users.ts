import { UserInfo } from 'booka-common';
import { addUnique, assertNever } from '../utils';
import { model, ObjectId } from '../back-utils';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true,
    },
    pictureUrl: String,
    uploadedBooks: {
        type: [String],
        required: true,
        default: [],
    },
} as const;
const User = model('User', schema);

export type IdProvider = 'facebook';
export type ExternalId = {
    provider: IdProvider,
    id: string,
};
async function getInfo(id?: ObjectId): Promise<UserInfo | undefined> {
    const user = await byId(id);
    return user
        ? {
            name: user.name,
            pictureUrl: user.pictureUrl,
        }
        : undefined;
}

async function updateOrCreate(externalId: ExternalId, user: UserInfo) {
    if (externalId.provider === 'facebook') {
        return User.updateOne(
            { facebookId: externalId },
            user,
            { upsert: true, setDefaultsOnInsert: true }
        ).exec();
    } else {
        return assertNever(externalId.provider);
    }
}
async function addUploadedBook(userId: ObjectId, bookId: ObjectId) {
    const user = await User.findById(userId).exec();
    if (user) {
        const books = user.uploadedBooks;
        const updated = addUnique(books, bookId.toString());
        user.uploadedBooks = updated;
        await user.save();
        return true;
    } else {
        return false;
    }
}

async function getUploadedBooks(userId?: ObjectId) {
    const user = await byId(userId);
    return user
        ? user.uploadedBooks
        : undefined;
}

async function byId(userId: ObjectId | undefined) {
    if (!userId) {
        return undefined;
    }
    return User.findById(userId).exec();
}

export const users = {
    getInfo,
    updateOrCreate,
    addUploadedBook,
    getUploadedBooks,
};
