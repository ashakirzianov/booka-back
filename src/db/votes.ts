import { VoteKind, HasId, Vote, CommentDescription } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';
import { comments } from './comments';
import { filterUndefined } from '../utils';
import { pick } from 'lodash';

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

async function vote(accountId: string, commentId: string, kind: VoteKind): Promise<HasId> {
    const doc: DbVote = {
        accountId,
        commentId,
        kind,
        created: new Date(),
    };

    const result = await docs.update(
        { accountId, commentId },
        { kind, created: new Date() },
        { upsert: true, new: true },
    ).exec();

    return pick(result, ['_id']);
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

    const filtered = bookId
        ? allVotes.filter(
            v =>
                v.comment.location && v.comment.location.bookId === bookId
        )
        : allVotes;

    return filtered;
}

async function buildVote(doc: DbVote & HasId): Promise<Vote | undefined> {
    const description = await comments.description(doc.commentId);
    if (!description) {
        return undefined;
    }

    const result: Vote = {
        _id: doc._id.toString(),
        kind: doc.kind as VoteKind,
        comment: description,
    };

    return result;
}

export const votes = {
    all,
    calculateRating,
    vote,
    remove,
};
