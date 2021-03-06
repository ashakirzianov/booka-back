import { IssueReportKind } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../utils';

const schema = {
    accountId: {
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

async function add(accountId: string, commentId: string, kind: IssueReportKind): Promise<boolean> {
    const doc: DbReport = {
        accountId,
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
