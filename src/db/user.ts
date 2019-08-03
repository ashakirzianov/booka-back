import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';
import * as Contracts from '../contracts';
import { assertNever } from '../bookConverter/utils';

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
export const users = {
    async byId(id: string): Promise<Contracts.UserInfo | undefined> {
        const user = await UserCollection.findById(id).exec();
        return user
            ? {
                name: user.name,
                pictureUrl: user.pictureUrl,
            }
            : undefined;
    },
    async updateOrCreate(externalId: ExternalId, userInfo: Contracts.UserInfo) {
        if (externalId.provider === 'facebook') {
            return updateOrCreate({ facebookId: externalId.id }, userInfo);
        } else {
            return assertNever(externalId.provider);
        }
    },
};

async function updateOrCreate(condition: Partial<User>, userInfo: Contracts.UserInfo): Promise<User> {
    try {
        const existing = await UserCollection.findOne(
            condition,
            (err, doc) => {
                if (doc) {
                    doc.name = userInfo.name;
                    doc.pictureUrl = userInfo.pictureUrl;
                    doc.save();
                }
            })
            .exec();

        if (existing) {
            return existing;
        } else {
            const created = await UserCollection.insertMany({
                ...condition,
                name: userInfo.name,
                pictureUrl: userInfo.pictureUrl,
            });
            return created;
        }
    } catch (e) {
        throw e;
    }
}
