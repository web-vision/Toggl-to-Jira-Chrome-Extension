class TogglWorklog {
    id = 0;
    start = new Date();
    end = new Date();
    issue = new Issue();
    duration = 0;

    constructor(entry) {
        this.id = entry.id;
        this.start = new Date(entry.start)
        this.end = new Date(entry.stop);
        this.issue = entry.description !== null ? Jira.splitTogglCommentToJiraIssueAndComment(entry.description) : '';
        this.duration = entry.duration;
    }
}
