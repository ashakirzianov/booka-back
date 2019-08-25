import { model, DataFromModel, ObjectId } from '../back-utils';
import { VoteKind } from 'booka-common';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    commentId: {
        type: ObjectId,
        required: true,
    },
    kind: {
        type: String,
        required: true,
        default: 'like',
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('CommentVote', schema);
type DbVote = DataFromModel<typeof docs>;

async function calculateRating(commentId: string): Promise<number> {
    const relatedVotes = await docs.find({ commentId }).exec();
    const rating = relatedVotes.reduce(
        (r, v) => v.kind === 'like' ? r + 1
            : v.kind === 'dislike' ? r - 1
                : r,
        0,
    );

    return rating;
}

async function vote(userId: string, commentId: string, kind: VoteKind): Promise<string> {
    const doc: DbVote = {
        userId,
        commentId,
        kind,
        created: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return result._id.toString();
}

export const votes = {
    calculateRating,
    vote,
};
