class JiraWorklog {
    worklogId = 0;
    issue = new Issue('', '', false);
    started = new Date();
    timeSpent = '';
    seconds = 0;
    comment = '';

    constructor(worklog, issue) {
        this.worklogId = worklog.id;
        this.issue = {
            key: issue.key,
            link: issue.self
        };
        this.started = worklog.started;
        this.timeSpent = worklog.timeSpent;
        this.seconds = worklog.timeSpentSeconds;
        this.comment = worklog.comment;
    }
}
