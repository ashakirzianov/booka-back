import { IssueReportKind } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    commentId: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('CommentReport', schema);
type DbReport = DataFromModel<typeof docs>;

async function add(userId: string, commentId: string, kind: IssueReportKind): Promise<boolean> {
    const doc: DbReport = {
        userId,
        commentId,
        kind,
        date: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return result ? true : false;
}

export const reports = {
    add,
};
