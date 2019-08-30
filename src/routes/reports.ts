import { router } from './router';
import { authenticate } from '../auth';
import { reports } from '../db';
import { IssueReportKind } from 'booka-common';

router.post('/report', authenticate(async ctx => {
    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Comment id is not specified' };
    }

    const kind = ctx.query.kind;
    if (!kind) {
        return { fail: 'Issue kind is not specified' };
    }

    await reports.add(ctx.userId, commentId, kind as IssueReportKind);

    return { success: true };
}));
