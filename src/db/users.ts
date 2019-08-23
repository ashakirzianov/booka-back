import { addUnique, assertNever } from '../utils';
import { model, TypeFromSchema } from '../back-utils';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true as const,
    },
    pictureUrl: String,
    uploadedBooks: [String],
};
export type User = TypeFromSchema<typeof schema>;
const UserCollection = model('User', schema);

export type IdProvider = 'facebook';
export type ExternalId = {
    provider: IdProvider,
    id: string,
};
async function byId(id: string) {
    const user = await UserCollection.findById(id).exec();
    return user || undefined;
}

async function updateOrCreate(externalId: ExternalId, user: Omit<User, '_id'>) {
    if (externalId.provider === 'facebook') {
        return updateOrCreateWithCond({ facebookId: externalId.id }, user);
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

async function updateOrCreateWithCond(condition: Partial<User>, user: Omit<User, '_id'>) {
    const existing = await UserCollection.findOne(condition).exec();
    if (existing) {
        existing.name = user.name || existing.name;
        existing.pictureUrl = user.pictureUrl;
        await existing.save();
        return existing;
    } else {
        const created = await UserCollection.insertMany({
            ...condition,
            name: user.name,
            pictureUrl: user.pictureUrl,
        });
        return created;
    }
}
