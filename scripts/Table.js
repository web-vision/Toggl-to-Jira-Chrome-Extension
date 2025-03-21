class Table {
    #entries = {};

    constructor(jira, toggl) {
        let entries = {};
        for (const jiraEntry of jira) {
            const started = new Date(jiraEntry.started);
            entries[started.getTime()] = {
                jira: jiraEntry
            };
        }
        for (const togglEntry of toggl) {
            const started = new Date(togglEntry.start);
            entries[started.getTime()] ??= {};
            entries[started.getTime()]['toggl'] = togglEntry;
        }

        const keysSorted = Object.keys(entries).sort((a,b) => {return a-b;});
        for (const key of keysSorted) {
            this.#entries[key] = entries[key];
        }
    }

    writeTable(element) {
        element.innerText = '';
        for (const timestamp in this.#entries) {
            const entry = this.#entries[timestamp];
            const line = document.createElement('tr');
            element.append(line);
            let logged = true;
            if (typeof entry.jira === 'undefined') {
                logged = false;
            }
            const statusCell = document.createElement('td');
            statusCell.classList.add('status', logged ? 'status-ok' : 'status-fail');
            statusCell.innerText = logged ? '\u2714' : '\u2718';
            const issueCell = document.createElement('td');
            const editIssue = document.createElement('input');
            editIssue.classList.add('issue', 'form-control');
            editIssue.value = entry?.jira?.issue?.key ?? entry.toggl.issue.issue;
            issueCell.append(editIssue);

            const commentCell = document.createElement('td');
            const editComment = document.createElement('input');
            editComment.value = entry?.jira?.issue?.comment ?? entry.toggl.issue.comment;
            editComment.classList.add('form-control')
            commentCell.append(editComment);
            const dateCell = document.createElement('td');

            const startedDate = new Date(entry?.jira?.issue?.started ?? entry.toggl.start);
            dateCell.innerText = startedDate.toLocaleDateString();

            const durationCell = document.createElement('td');
            if (!logged) {
                if (entry.toggl.duration < 0) {
                    durationCell.innerText = 'running';
                } else {
                    const minuteDifference = entry.toggl.duration % 60;
                    let roundedDuration = entry.toggl.duration - minuteDifference;
                    if (minuteDifference < 30) {
                        roundedDuration = roundedDuration + 60;
                    }
                    let hours = 0;
                    let realMinutes = roundedDuration / 60;
                    if (realMinutes > 60) {
                        let minutes = realMinutes;
                        realMinutes = minutes % 60;
                        hours = (minutes - realMinutes) / 60;
                    }
                    durationCell.innerText = ((hours > 0) ? hours + 'h ' : '') + realMinutes + 'm';
                }
            } else {
                durationCell.innerText = entry.jira.timeSpent;
            }

            line.append(statusCell);
            line.append(issueCell);
            line.append(commentCell);
            line.append(dateCell);
            line.append(durationCell);
        }
    }
}
