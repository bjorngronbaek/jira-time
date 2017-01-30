import { setIssueRefreshing, refreshIssue } from 'store/reducers/tasks';
import { getIssue, setIssueRemaining } from 'shared/jiraClient';

export function updateRemainingEstimate ({ taskCuid, taskIssueKey, remainingEstimate }) {

    store.dispatch(setIssueRefreshing({
        cuid: taskCuid,
        refreshing: true
    }));

    /**
    * We need to send the original estimate along due to a bug in the JIRA REST API,
    * so lets get the latest issue info so that we have the correct original estimate
    * https://jira.atlassian.com/browse/JRA-30459
    **/
    return getIssue({
        key: taskIssueKey
    })
    .then((issue) => {

        // Ensure that our remaining estimate gets persisted
        issue.fields.timetracking.remainingEstimate = remainingEstimate;

        store.dispatch(refreshIssue({
            cuid: taskCuid,
            issue
        }));

        setIssueRemaining({
            id: taskIssueKey,
            remainingEstimate,
            originalEstimate: issue.fields.timetracking.originalEstimate
        });
    })
    .catch(() => {
        store.dispatch(setIssueRefreshing({
            cuid: taskCuid,
            refreshing: true
        }));
    });
}

export function refreshJiraIssue ({ taskCuid, taskIssueKey }) {

    store.dispatch(setIssueRefreshing({
        cuid: taskCuid,
        refreshing: true
    }));

    return getIssue({
        key: taskIssueKey
    })
    .then((issue) => {

        store.dispatch(refreshIssue({
            cuid: taskCuid,
            issue
        }));

        return issue;
    })
    .catch(() => {
        store.dispatch(setIssueRefreshing({
            cuid: taskCuid,
            refreshing: false
        }));
    });
}