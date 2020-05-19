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

// Test connections to both Jira and Toggl
function testConfiguration() {

    var url = $('#jira-url').val();
    var togglApiToken = $('#toggl-api-token').val();

    // From identity.js this will try to connect to both services

    // Display the Jira result
    var jiraTestResult = $('#jiraTestResult');
    identity.ConnectToJira(url).done(function (jiraResult) {
        jiraTestResult.removeClass('error').addClass('success');
        jiraTestResult.text('Connected to Jira as ' + jiraResult.displayName + ' (' + jiraResult.emailAddress + ')');
    })
    .fail(function () {
        jiraTestResult.removeClass('success').addClass('error');
        jiraTestResult.text('There was a problem with connecting to Jira. Have you got the right URL and are you logged in?');
    });

    // Display the Toggl result
    var togglTestResult = $('#togglTestResult');
    identity.ConnectToToggl(togglApiToken).done(function (togglResult) {
        togglTestResult.removeClass('error').addClass('success');
        togglTestResult.text('Connected to Toggl as ' + togglResult.data.fullname + ' (' + togglResult.data.email + ')');
    })
    .fail(function () {
        togglTestResult.removeClass('success').addClass('error');
        togglTestResult.text('There was a problem with connecting to Toggl. Have you provided the right API key?');
    });

}

// Add handlers
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('test').addEventListener('click', testConfiguration);
document.getElementById('save').addEventListener('click', saveOptions);
