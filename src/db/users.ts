import { UserInfo } from 'booka-common';
import { addUnique, assertNever } from '../utils';
import { model, updateOrCreateWithCond } from '../back-utils';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true as const,
    },
    pictureUrl: String,
    uploadedBooks: {
        type: [String],
        required: true as const,
        default: [],
    },
};
const User = model('User', schema);

export type IdProvider = 'facebook';
export type ExternalId = {
    provider: IdProvider,
    id: string,
};
async function getInfo(id?: string): Promise<UserInfo | undefined> {
    const user = await byId(id);
    return user && {
        name: user.name,
        pictureUrl: user.pictureUrl,
    } || undefined;
}

async function updateOrCreate(externalId: ExternalId, user: UserInfo) {
    if (externalId.provider === 'facebook') {
        return updateOrCreateWithCond(User, { facebookId: externalId.id }, user);
    } else {
        return assertNever(externalId.provider);
    }
}
async function addUploadedBook(userId: string, bookId: string) {
    const user = await User.findById(userId).exec();
    if (user) {
        const books = user.uploadedBooks;
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

async function getUploadedBooks(userId?: string) {
    const user = await byId(userId);
    return user
        ? user.uploadedBooks
        : undefined;
}

async function byId(userId: string | undefined) {
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
