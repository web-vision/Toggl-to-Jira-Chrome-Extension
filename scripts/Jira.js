'use strict';

class Jira {
    #jiraServer = 'https://pm.web-vision.de';
    static #workLog = '/rest/api/2/issue/{issue}/worklog';
    static #userInformation = '/rest/api/2/myself';
    static #search = '/rest/api/2/search';
    static #worklogSearch = '/rest/api/2/worklog/updated';
    static #worklogList = '/rest/api/2/worklog/list';
    static #issue = '/rest/api/2/issue/'
    static #issueKey = /([A-Z]+-\d+)([:| ]){0,2}(.*)/;


    constructor(jiraServer) {
        this.#jiraServer = jiraServer;
    }

    async logWork() {

    }

    async getUserInformation() {
        return await fetch(this.#jiraServer + Jira.#userInformation)
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Cannot connect to JIRA!');
                }
                return response.json();
            })
            .then((result) => {
                // save time sone for further calculation
                chrome.storage.sync.set({
                    jiraTimezone: result.timeZone,
                    jiraUserId: result.key
                });
                return {
                    jiraUserName: result.displayName,
                    jiraEmailAddress: result.emailAddress
                }
            });
    }

    /**
     * @param dateService
     * @returns {Promise<JiraWorklog[]>}
     */
    async getWorkLogForUserAndDay(dateService) {
        let queryParams = new URLSearchParams({
            since: dateService.getStartDate().getTime(),
            // until: dateService.getEndDate().getTime(),
            expand: "properties",
        });
        return await fetch(
            this.#jiraServer + Jira.#worklogSearch + '?' + queryParams.toString(),
            {
                method:'GET'
            })
            .then((response) => {
                if (response.status !== 200) {
                    console.log(response);
                }
                return response.json();
            })
            .then(async (data) => {
                let worklogIds = [];
                data.values.forEach((worklogEntry) => {
                    worklogIds.push(worklogEntry.worklogId);
                });
                return await fetch(
                    this.#jiraServer + Jira.#worklogList,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            ids: worklogIds
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then(async (data) => {
                        let jiraWorklog = [];
                        const settings = await chrome.storage.sync.get({jiraUserId: ''});
                        for (const worklog of data) {
                            if (worklog.author.key !== settings.jiraUserId) {
                                continue;
                            }
                            const started = new Date(worklog.started);
                            if (started < dateService.getStartDate() || started > dateService.getEndDate()) {
                                continue;
                            }
                            const issue = await this.getIssueById(worklog.issueId);

                            jiraWorklog.push(new JiraWorklog(worklog, issue));
                        }
                        return jiraWorklog;
                    })
            });
    }

    async getIssueById(issueId) {
        return await fetch(this.#jiraServer + Jira.#issue + issueId)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                return data;
            });
    }

    /**
     *
     * @param togglComment
     * @returns {Issue}
     */
    static splitTogglCommentToJiraIssueAndComment(togglComment) {
        let found = togglComment.match(Jira.#issueKey);
        if (found === null) {
            return new Issue('', togglComment, false);
        }
        return new Issue(found[1], found[3], true);
    }
}
