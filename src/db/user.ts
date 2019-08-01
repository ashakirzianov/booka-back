import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';
import * as Contracts from '../contracts';

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

async function byExternalId(id: string): Promise<User | null> {
    return UserCollection.findOne({ externalId: id }).exec();
}

async function byId(id: string): Promise<User | null> {
    return UserCollection.findById(id).exec();
}

async function insert(user: User) {
    await UserCollection.insertMany(user);
}

export type IdProvider = 'facebook';
export type ExternalId = {
    provider: IdProvider,
    id: string,
};
export const users = {
    async byId(id: string): Promise<Contracts.UserInfo | undefined> {
        const user = await byId(id);
        // TODO: create user here
        return user
            ? {
                name: user.name,
                pictureUrl: user.pictureUrl,
            }
            : undefined;
    },
};
