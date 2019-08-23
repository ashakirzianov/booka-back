import { UserInfo } from 'booka-common';
import { addUnique, assertNever } from '../utils';
import { model } from '../back-utils';

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
async function getInfo(id: string): Promise<UserInfo> {
    const user = await byId(id);
    return {
        name: user.name,
        pictureUrl: user.pictureUrl,
    };
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
async function addUploadedBook(userId: string, bookId: string) {
    const user = await byId(userId);
    const books = user.uploadedBooks;
    const updated = addUnique(books, bookId.toString());
    user.uploadedBooks = updated;
    await user.save();
    return true;
}

async function getUploadedBooks(userId: string) {
    const user = await byId(userId);
    return user.uploadedBooks;
}

async function byId(userId: string) {
    const result = await User.findById(userId).exec();
    if (!result) {
        throw new Error(`Couldn't find user by id: '${userId}'`);
    }

    return result;
}

export const users = {
    getInfo,
    updateOrCreate,
    addUploadedBook,
    getUploadedBooks,
};
