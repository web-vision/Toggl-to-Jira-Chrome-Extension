// Saves options to chrome.storage
function saveOptions() {
    // Required config
    var url = document.getElementById('jira-url').value;
    var togglApiToken = document.getElementById('toggl-api-token').value;
    // Optional settings
    var comment = document.getElementById('log-comment').value;
    var mergeEntriesBy = document.getElementById('merge-entries-by').value;
    var jumpToToday = document.getElementById('jump-to-today').checked;
    var roundMinutes = document.getElementById('round_minutes').value;
    chrome.storage.sync.set({
        url: url,
        togglApiToken: togglApiToken,
        comment: comment,
        mergeEntriesBy: mergeEntriesBy,
        jumpToToday: jumpToToday,
        roundMinutes: roundMinutes
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    // Use default values
    chrome.storage.sync.get({
        url: 'https://jira.atlassian.net',
        comment: 'Updated via toggl-to-jira https://chrome.google.com/webstore/detail/toggl-to-jira/anbbcnldaagfjlhbfddpjlndmjcgkdpf',
        mergeEntriesBy: 'no-merge',
        jumpToToday: false,
        togglApiToken: '',
        roundMinutes: 0,
    }, function (items) {
        document.getElementById('jira-url').value = items.url;
        document.getElementById('toggl-api-token').value = items.togglApiToken;
        document.getElementById('log-comment').value = items.comment;
        document.getElementById('merge-entries-by').value = items.mergeEntriesBy;
        document.getElementById('jump-to-today').checked = items.jumpToToday;
        document.getElementById('round_minutes').value = items.roundMinutes;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
