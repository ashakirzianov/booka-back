import { VoteKind, Vote, filterUndefined } from 'booka-common';
import { model, DataFromModel, ObjectId, HasId } from '../utils';
import { comments } from './comments';

const schema = {
    accountId: {
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

async function vote(accountId: string, data: Vote): Promise<Vote> {
    const doc: DbVote = {
        accountId,
        commentId: data.commentId,
        kind: data.kind,
        created: new Date(),
    };

    const result = await docs.updateOne(
        { accountId, commentId: data.commentId },
        { kind: data.kind, created: new Date() },
        { upsert: true, new: true },
    ).exec();

    return {
        kind: result.kind as VoteKind,
        commentId: result.commentId,
    };
}

async function remove(accountId: string, voteId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ _id: voteId, accountId })
        .exec();
    return result ? true : false;
}

async function all(accountId: string, page: number, bookId?: string): Promise<Vote[]> {
    const votesPageSize = 100;
    const allVoteDocs = await docs
        .find({ accountId })
        .skip(page * votesPageSize)
        .limit(votesPageSize)
        .exec();
    const allVotes = filterUndefined(
        await Promise.all(allVoteDocs.map(buildVote))
    );

    // TODO: implement filtering by book id
    return allVotes;
}

async function buildVote(doc: DbVote & HasId): Promise<Vote | undefined> {
    const preview = await comments.preview(doc.commentId);
    if (!preview) {
        return undefined;
    }

    const result: Vote = {
        kind: doc.kind as VoteKind,
        commentId: doc.commentId,
    };

    return result;
}

export const votes = {
    all,
    calculateRating,
    vote,
    remove,
};
