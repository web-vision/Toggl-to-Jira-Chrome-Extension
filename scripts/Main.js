class Main {
    settings = {};
    static dateService = new DateService();
    toggl;
    jira;
    static togglTimer;

    constructor(settings, dateService) {
        this.settings = settings;
        this.jira = new Jira(settings.url);
        this.toggl = new Toggl(settings.togglApiToken);
        Main.dateService = dateService;
    }

    /**
     *
     * @returns {Promise<JiraWorklog[]>}
     */
    async loadJira() {
        let jiraStatus = document.getElementById('jira-status');
        try {
            const jiraIdentity = await this.jira.getUserInformation();
            document.getElementById('jiraUser').innerText = jiraIdentity.jiraUserName;
            document.getElementById('jiraEmail').innerText = jiraIdentity.jiraEmailAddress;
            jiraStatus.innerText = '\u2714';
            jiraStatus.classList.add('status-ok');
        } catch (e) {
            jiraStatus.innerText = '\u2718';
            jiraStatus.classList.add('status-fail');
        }
        return await this.jira.getWorkLogForUserAndDay(Main.dateService);
    }

    /**
     *
     * @returns {Promise<TogglWorklog[]>}
     */
    async loadToggl() {
        let togglStatus = document.getElementById('toggl-status');
        try {
            const togglIdent = await this.toggl.getUserInformation();
            await this.toggl.getWorkspaces();
            document.getElementById('togglUser').innerText = togglIdent.togglUser;
            document.getElementById('togglMail').innerText = togglIdent.togglMail;
            togglStatus.innerText = '\u2714';
            togglStatus.classList.add('status-ok');
        } catch (e) {
            togglStatus.innerText = '\u2718';
            togglStatus.classList.add('status-fail');
        }
        return await this.toggl.fetchEntries(Main.dateService.getStartDate(), Main.dateService.getEndDate());
    }

    triggerDateChange() {
        const dayFilter = document.getElementById('filter');
        dayFilter.addEventListener('click', (event) => {
            this.#dayChangeButtonClick(event, this);
        });
        dayFilter.addEventListener('change', this.#daySelectChange);
    }

    #dayChangeButtonClick(event, main) {
        if (event.target.nodeName === 'BUTTON') {
            event.preventDefault();
            event.stopPropagation();
            switch (event.target.id) {
                case 'previous-day':
                    Main.dateService.setNewStartDate(DateService.removeOneDayFromDate(Main.dateService.getStartDate()));
                    Main.dateService.setNewEndDate(DateService.addOneDayToDate(Main.dateService.getStartDate()));
                    break;
                case 'next-day':
                    Main.dateService.setNewStartDate(DateService.addOneDayToDate(Main.dateService.getStartDate()));
                    Main.dateService.setNewEndDate(DateService.addOneDayToDate(Main.dateService.getStartDate()));
                    break;
                default:
                    break;
            }
            main.changeDateInputs();
            main.loadEntries(main.writeTable, main);
            return false;
        }
    }

    #daySelectChange(event) {
        if (event.target.nodeName === 'INPUT' && event.target.type === 'date') {
            event.preventDefault();
            event.stopPropagation();
            console.log(event.target)
            return false;
        }
    }

    async loadEntries(callback, main) {
        const togglEntries = await main.toggl.fetchEntries(Main.dateService.getStartDate(), Main.dateService.getEndDate());
        const jiraEntries = await main.jira.getWorkLogForUserAndDay(Main.dateService);
        callback({jira: jiraEntries, toggl: togglEntries});
    }

    writeTable(entries) {
        const table = new Table(entries.jira, entries.toggl);
        let tableBody = document.getElementById('toggle-entries');
        table.writeTable(tableBody);
    }

    changeDateInputs() {
        document.getElementById('start-date').value = DateService.toDateInputValue(Main.dateService.getStartDate());
        document.getElementById('end-date').value = DateService.toDateInputValue(Main.dateService.getEndDate());
    }

    static stopTogglUpdate() {
        window.clearInterval(Main.togglTimer);
    }

    static setTogglUpdate() {
        Main.togglTimer = window.setInterval(Main.#updateTogglTime, 500);
    }

    static #updateTogglTime() {
        const togglTimer = document.getElementById('currentTogglTime');
        const started = parseInt(togglTimer.dataset.start);
        const current = (new Date()).getTime() / 1000;
        togglTimer.innerText = DateService.secondsToReadableTime(current - started);
    }

    addTogglEventListener() {
        const togglButton = document.getElementById('togglTime');
        togglButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggl.toggleTogglRunner();
        });
    }

    addTogglDescriptionListener() {
        const togglDescription = document.getElementById('togglDescription');
        togglDescription.addEventListener('focusout', async (event) => {
            const currentRunningEntry = await this.toggl.currentRunningEntry();
            if (currentRunningEntry !== null) {
                this.toggl.updateCurrentEntryDescription(
                    currentRunningEntry,
                    togglDescription.value
                );
            }
        });
    }
}
