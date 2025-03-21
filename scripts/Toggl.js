class Toggl {
    #apiToken = '';

    static #workspace = '';

    static #url = 'https://api.track.toggl.com';
    static #user = '/api/v9/me';
    static #workspaces = '/api/v9/me/workspaces';
    static #fetchEntries = '/api/v9/me/time_entries';
    static #currentEntry = '/api/v9/me/time_entries/current';
    static #stopRunner = [
        '/api/v9/workspaces/',
        '/time_entries/',
        '/stop'
    ];
    static #startRunner = [
        '/api/v9/workspaces/',
        '/time_entries'
    ];

    static #updateEntry = [
        '/api/v9/workspaces/',
        '/time_entries/'
    ];

    constructor(apiToken) {
        this.#apiToken = apiToken;
    }

    async getUserInformation(){
        return await fetch(
            Toggl.#url + Toggl.#user,
            {
                headers: {
                    'Authorization': this.#buildAuthToken(),
                    'Accept': 'application/json',
                }
            }
        )
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Cannot connect to Toggl!');
                }
                return response.json();
            })
            .then((result) => {
                // save toggl timezone. Required for further calculation
                chrome.storage.sync.set({
                    togglTimezone: result.timezone
                })
                return {
                    togglUser: result.fullname,
                    togglMail: result.email
                }
            });
    }

    async getWorkspaces() {
        return await fetch(
            Toggl.#url + Toggl.#workspaces,
            {
                headers: {
                    'Authorization': this.#buildAuthToken(),
                    'Accept': 'application/json',
                }
            }
        )
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Cannot connect to Toggl!');
                }
                return response.json();
            })
            .then((result) => {
                // save toggl timezone. Required for further calculation
                chrome.storage.sync.set({
                    workspaces: result[0].id
                });
                Toggl.#workspace = result[0].id;
                return {
                    workspace: result[0].id
                }
            });
    }

    /**
     *
     * @param start
     * @param end
     * @returns {Promise<TogglWorklog[]>}
     */
    async fetchEntries(start, end) {
        let url = Toggl.#url + Toggl.#fetchEntries;
        if (start !== null && end !== null) {
            let queryParams = new URLSearchParams({
                start_date: DateService.toDateInputValue(start),
                end_date: DateService.toDateInputValue(end)
            });
            url = url + '?' + queryParams.toString();
        }
        return await fetch(
            url,
            {
                headers: {
                    'Authorization': this.#buildAuthToken(),
                    'Accept': 'application/json',
                }
            })
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error('Cannot fetch entries from Toggl!');
                }
                return response.json();
            })
            .then((data) => {
                let togglEntries = [];
                for (const entry of data) {
                    togglEntries.push(new TogglWorklog(entry));
                }
                return togglEntries;
            });
    }

    async currentRunningEntry() {
        let url = Toggl.#url + Toggl.#currentEntry;
        return await fetch(
            url,
            {
                headers: {
                    'Authorization': this.#buildAuthToken(),
                    'Accept': 'application/json',
                }
            })
            .then((response) => {
                return response.json();
            });
    }

    async toggleTogglRunner() {
        const currentRunningEntry = await this.currentRunningEntry();
        if (currentRunningEntry === null) {
            const url = Toggl.#url + Toggl.#startRunner[0] + Toggl.#workspace + Toggl.#startRunner[1];
            let body = {
                created_with: 'web-vision/Toggl2Jira-Plugin',
                billable: false,
                duration: -1,
                start: (new Date()).toISOString(),
                workspace_id: Toggl.#workspace
            };
            const descriptionText = document.getElementById('togglDescription');
            if (descriptionText.value) {
                body.description = descriptionText.value;
            }
            return await fetch(
                url,
                {
                    method: "POST",
                    headers: {
                        'Authorization': this.#buildAuthToken(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(body)
                })
                .then((response) => {
                    console.log(response);
                    console.log(response.json());
                    return response.json();
                });
        } else {
            const url = Toggl.#url + Toggl.#stopRunner[0] + currentRunningEntry.workspace_id + Toggl.#stopRunner[1] + currentRunningEntry.id + Toggl.#stopRunner[2];
            return await fetch(
                url,
                {
                    method: "PATCH",
                    headers: {
                        'Authorization': this.#buildAuthToken(),
                        'Accept': 'application/json',
                    }
                })
                .then((response) => {
                    return response.json();
                });
        }
    }

    #buildAuthToken() {
        return 'Basic: ' + btoa(this.#apiToken + ':api_token');
    }

    async writeRunnerInfo() {
        const currentRunner = await this.currentRunningEntry();
        if (currentRunner === null) {
            document.getElementById('togglDescription').value = '';
            document.getElementById('currentTogglTime').innerText = '0:00:00';
            document.getElementById('togglTime').innerText = '\u25B8';
            Main.stopTogglUpdate();
            return;
        }
        document.getElementById('togglDescription').value = currentRunner.description;
        const togglTimer = document.getElementById('currentTogglTime');
        const started = (new Date(currentRunner.start)).getTime() / 1000;
        const current = (new Date()).getTime() / 1000;
        togglTimer.dataset.start = started.toString();
        togglTimer.innerText = DateService.secondsToReadableTime(current - started);
        document.getElementById('togglTime').innerText = '\u23F9';
        Main.setTogglUpdate();
    }

    async updateCurrentEntryDescription(entry, description) {
        const url = Toggl.#url + Toggl.#updateEntry[0] + entry.workspace_id + Toggl.#updateEntry[1] + entry.id;
        let body = {
            duration: -1,
            description: description,
            workspace_id: entry.workspace_id
        };
        await fetch(
            url,
            {
                method: "PUT",
                headers: {
                    'Authorization': this.#buildAuthToken(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(body)
            }
        )
    }
}
