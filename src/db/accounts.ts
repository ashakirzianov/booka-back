import { AccountInfo } from 'booka-common';
import { model, DataFromModel } from '../utils';
import { FacebookUserInfo } from '../auth';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true,
    },
    pictureUrl: String,
    joined: {
        type: Date,
        required: true,
    },
} as const;
const docs = model('AccountInfo', schema);
type DbAccountInfo = DataFromModel<typeof docs>;

async function info(id: string): Promise<AccountInfo | undefined> {
    const result = await docs.findById(id).exec();
    if (!result) {
        return undefined;
    }

    return {
        _id: result._id,
        name: result.name,
        joined: result.joined,
        pictureUrl: result.pictureUrl,
    };
}

async function forFacebook(facebookInfo: FacebookUserInfo): Promise<AccountInfo> {
    const result = await docs
        .findOne({ facebookId: facebookInfo.id })
        .exec();

    let doc: typeof result;
    if (result) {
        result.name = facebookInfo.name;
        result.pictureUrl = facebookInfo.profilePicture;
        await result.save();
        doc = result;
    } else {
        const toAdd: DbAccountInfo = {
            facebookId: facebookInfo.id,
            name: facebookInfo.name,
            pictureUrl: facebookInfo.profilePicture,
            joined: new Date(),
        };
        const [insertResult] = await docs.insertMany([toAdd]);
        doc = insertResult;
    }

    return {
        _id: doc._id.toString(),
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        joined: doc.joined,
    };
}

export const accounts = {
    info,
    forFacebook,
};
