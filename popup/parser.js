window.addEventListener('load', () => {
    document.querySelector('#openOptions').addEventListener('click', function() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
    chrome.storage.sync
        .get({
            url: 'https://pm.web-vision.de',
            togglApiToken: '',
            mergeEntriesBy: 'no-merge',
            useTogglDescription: true,
            comment: '',
            jumpToToday: false,
            roundMinutes: 0,
        })
        .then(async (items) => {
            if(items.togglApiToken === '') {
                window.location = 'options.html';
            }
            const dateTime = new DateService();
            const main = new Main(items, dateTime);
            main.changeDateInputs();
            let jiraEntries = await main.loadJira();
            let togglEntries = await main.loadToggl();
            main.triggerDateChange();
            await main.toggl.writeRunnerInfo();
            main.addTogglEventListener();
            main.addTogglDescriptionListener();
            return {jira: jiraEntries, toggl: togglEntries};
        })
        .then((entries) => {
        const table = new Table(entries.jira, entries.toggl);
        let tableBody = document.getElementById('toggle-entries');
        table.writeTable(tableBody);
    });
});
