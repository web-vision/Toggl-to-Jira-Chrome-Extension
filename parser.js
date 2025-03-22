let logs = [];
let unloggableTogglEntries = 0;
let config = {};
let myIdentity = {};

$(document).ready(function () {
    // Retrieve the stored options
    chrome.storage.sync.get({
        url: 'https://pm.web-vision.de/',
        togglApiToken: '',
        mergeEntriesBy: 'no-merge',
        useTogglDescription: true,
        comment: '',
        jumpToToday: false,
        roundMinutes: 0,
    }, function (items) {
        config = items;

        // If this is a new user, direct them to the Options page straight away
        if(config.togglApiToken === '') window.location = "options.html";

        console.log('Fetching toggl entries for today.', 'Jira url: ', config.url, config);

        // Configure AJAX for Jira requests that we are intercepting
        $.ajaxSetup({
            contentType: 'application/json',
            headers: {
                'forgeJira': 'true',
                'X-Atlassian-Token': 'nocheck',
                'Access-Control-Allow-Origin': '*'
            },
            xhrFields: {
                withCredentials: true
            }
        });

        // The browser datepicker will display a date in UTC if given a local datetime (stupid)
        // So we need to convert the local datetime into a local date string
        let startString = localStorage.getItem('toggl-to-jira.last-date');
        let startDate = (config.jumpToToday || !startString) ? dateTimeHelpers.localDateISOString() : dateTimeHelpers.localDateISOString(new Date(startString));
        $('#start-picker').val(startDate);

        var endString = localStorage.getItem('toggl-to-jira.last-end-date');
        var endDate = (config.jumpToToday || !endString) ? dateTimeHelpers.localDateISOString(new Date(Date.now() + (3600 * 24 * 1000))) : dateTimeHelpers.localDateISOString(new Date(endString));
        $('#end-picker').val(endDate);

        // Try to connect to both services first - from Identity.js
        identity.Connect(config.url, config.togglApiToken).done(function (res) {
            myIdentity = res;
            $('#connectionDetails').addClass('success').removeClass('error')
                .html('Toggl: ' + res.togglUserName + ' (' + res.togglEmailAddress + ') << connected >> JIRA: ' + res.jiraUserName + ' (' + res.jiraEmailAddress + ')');
            // Finally fetch the Toggl entries
            fetchEntries();
        }).fail(function () {
            $('#connectionDetails').addClass('error').removeClass('success')
                .html('Connecting to Toggl or JIRA failed. Check your configuration options.');
        });

        // Add event handlers
        $('#start-picker').on('change', fetchEntries);
        $('#end-picker').on('change', fetchEntries);
        $('#submit').on('click', submitEntries);

        // Shortcut buttons for moving between days
        $('#previous-day').on('click', function () {
            $('#start-picker').val(dateTimeHelpers.localDateISOString(dateTimeHelpers.addDays(document.getElementById('start-picker').valueAsDate, -1)));
            $('#end-picker').val(dateTimeHelpers.localDateISOString(dateTimeHelpers.addDays(document.getElementById('end-picker').valueAsDate, -1)));
            fetchEntries();
        });
        $('#next-day').on('click', function () {
            $('#start-picker').val(dateTimeHelpers.localDateISOString(dateTimeHelpers.addDays(document.getElementById('start-picker').valueAsDate, 1)));
            $('#end-picker').val(dateTimeHelpers.localDateISOString(dateTimeHelpers.addDays(document.getElementById('end-picker').valueAsDate, 1)));
            fetchEntries();
        });

    });
});

function submitEntries() {

    // log time for each jira ticket
    var timeout = 500;
    logs.forEach(function (log) {
        if (!log.submit) return;
        $('#result-' + log.id).text('Pending...').addClass('info');
        setTimeout(() => {

            // comment to go with work log (this is called Work Description in Jira UI)
            var comment = $("#comment-" + log.id).val() || '';
            var workDescription = "";
            if(config.useTogglDescription) {
                workDescription = (comment.length > 0) ? (log.description + ' - ' + comment) : log.description;
            } else {
                workDescription = comment;
            }

            // Api body to send
            var body = JSON.stringify({
                timeSpent: log.timeSpent,
                comment: workDescription,
                started: log.started
            });

            // Post to the Api
            $.post(config.url + '/rest/api/latest/issue/' + log.issue + '/worklog', body,
                function success(response) {
                    console.log('success', response);
                    log.submit = false;
                    $('#result-' + log.id).text('OK').addClass('success').removeClass('info');
                    $('#input-' + log.id).removeAttr('checked').attr('disabled', 'disabled');
                    $("#comment-" + log.id).attr('disabled', 'disabled');

                }).fail(function error(error, message) {
                    console.log(error, message);
                    var e = error.responseText || JSON.stringify(error);
                    console.log(e);
                    $('p#error').text(e + "\n" + message).addClass('error');
                })
        }, timeout);
        timeout += 500;
    });
}

// log entry checkbox toggled
function selectEntry() {
    var id = this.id.split('input-')[1];

    logs.forEach(function (log) {
        if (log.id === id) {
            log.submit = this.checked;
        }
    }.bind(this));
}

function fetchEntries() {
    // toISOString gives us UTC midnight of the selected date
    // eg; "2020-05-19T00:00:00.000Z" 
    var startDate = document.getElementById('start-picker').valueAsDate.toISOString();
    var endDate = document.getElementById('end-picker').valueAsDate.toISOString();
    // We will store these as simple ISO dates to easily retrieve and set
    localStorage.setItem('toggl-to-jira.last-date', startDate);
    localStorage.setItem('toggl-to-jira.last-end-date', endDate);

    // Toggl is expecting dates in ISO 8601 https://en.wikipedia.org/wiki/ISO_8601 with timezone offset
    // eg; "2020-05-20T04:51:50+00:00"
    // Because of timezones we want to slice off the Z from the ISO string and add the local offset
    // This gives us an offset from midnight of the date (eg in NZ a date of 20/05/20 should actually be to 12pm on the 19th UTC)
    var startDateWithTimezoneOffset = startDate.slice(0, -1) + dateTimeHelpers.timeZoneOffset();
    var endDateWithTimezoneOffset = endDate.slice(0, -1) + dateTimeHelpers.timeZoneOffset();
    $('p#error').text("").removeClass('error');

    // Encode the start and end times
    var dateQuery = '?start_date=' + encodeURIComponent(startDateWithTimezoneOffset) + '&end_date=' + encodeURIComponent(endDateWithTimezoneOffset);

    // Toggl API call with token authorisation header
    // https://github.com/toggl/toggl_api_docs/blob/master/chapters/time_entries.md
    $.get({
        url: 'https://api.track.toggl.com/api/v9/me/time_entries' + dateQuery,
        headers: {
            "Authorization": "Basic " + btoa(config.togglApiToken + ':api_token')
        }
    }, function (entries) {
        // Reset on each fetch
        logs = [];
        unloggableTogglEntries = 0;

        entries.forEach(function (entry) {
            entry.description = entry.description || 'no-description';
            var issue = entry.description.split(' ')[0];
            // Validate the issue, if it's not in correct format, don't add to the table should be LETTERS-NUMBERS (XX-##)
            if(!issue.includes('-') || !(Number(issue.split('-')[1]) > 0)) {
                unloggableTogglEntries++;
                return;
            }

            entry.description = entry.description.slice(issue.length + 1); // slice off the JIRA issue identifier
            // from dateTimeHelpers.js
            var togglTime = dateTimeHelpers.roundUpTogglDuration(entry.duration, config.roundMinutes);
            var dateString = dateTimeHelpers.toJiraWhateverDateTime(entry.start); // this means the Jira work log entry will have a matching start time to the Toggl entry
            var dateKey = dateTimeHelpers.createDateKey(entry.start);

            var log = _.find(logs, function (log) {
                if (config.mergeEntriesBy === 'issue-and-date') {
                    return log.issue === issue && log.dateKey === dateKey;
                } else {
                    return log.issue === issue;
                }
            });

            // merge toggl entries by ticket ?
            if (log && config.mergeEntriesBy !== 'no-merge') {
                log.timeSpentInt = log.timeSpentInt + togglTime;
                log.timeSpent = log.timeSpentInt > 0 ? log.timeSpentInt.toString().toHHMM() : 'still running...';
            } else {
                log = {
                    id: entry.id.toString(),
                    issue: issue,
                    description: entry.description,
                    submit: (togglTime > 0),
                    timeSpentInt: togglTime,
                    timeSpent: togglTime > 0 ? togglTime.toString().toHHMM() : 'still running...',
                    comment: config.comment, // default comment
                    started: dateString,
                    dateKey: dateKey,
                };

                logs.push(log);
            }
        });

        renderList();
    });
}

function renderList() {
    var list = $('#toggle-entries');
    list.children().remove();
    var totalTime = 0;

    logs.forEach(function (log) {
        var url = config.url + '/browse/' + log.issue;
        var dom = '<tr><td>';

        // checkbox
        if (log.timeSpentInt > 0) dom += '<input id="input-' + log.id + '"  type="checkbox" checked/>';

        dom += '</td>';

        // link to jira ticket
        dom += '<td><a href="' + url + '" target="_blank">' + log.issue + '</a></td>';

        dom += '<td>' + log.description.limit(35) + '</td>';
        dom += '<td>' + log.started.toMMMDD() + '</td>';

        if (log.timeSpentInt > 0) {
            dom += '<td>' + log.timeSpentInt.toString().toHH_MM() + '</td>';
            dom += '<td><input id="comment-' + log.id + '" type="text" value="' + log.comment + '" /></td>';
            dom += '<td  id="result-' + log.id + '"></td>';
        } else {
            dom += '<td colspan="3" style="text-align:center;">still running...</td>'
        }
        dom += '</tr>';

        totalTime += (log.timeSpentInt > 0 && log.timeSpentInt) || 0;

        list.append(dom);

        if (log.timeSpentInt > 0) {
            $('#input-' + log.id).on('click', selectEntry);
        }

    })
    // Total Time for displayed tickets and count of unloggable Toggl entries
    var totalRow = '<tr><td></td><td></td><td>';
    if(unloggableTogglEntries > 0) totalRow += '<i class="warning">+' + unloggableTogglEntries + ' Toggl entries with no valid Jira issues</i>';
    totalRow += '</td><td><b>TOTAL</b></td><td>' + totalTime.toString().toHHMM() + '</td></tr>';
    list.append(totalRow);

    // check if entry was already logged
    logs.forEach(function (log) {
        $.get(config.url + '/rest/api/latest/issue/' + log.issue + '/worklog',
            function success(response) {
                var worklogs = response.worklogs;
                worklogs.forEach(function (worklog) {
                    // If the entry isn't for us we can skip it
                    if (!!myIdentity.jiraEmailAddress && !!worklog.author && worklog.author.emailAddress !== myIdentity.jiraEmailAddress) { return; }

                    // Try to match on worklog start date time
                    var dateTimeMatch = false;
                    if(config.mergeEntriesBy == 'no-merge') { // we need to match on each specific entry by day/month/start time
                        dateTimeMatch = (worklog.started.toMMMDDHHMM() === log.started.toMMMDDHHMM());
                    } else { // we can match on just day/month
                        dateTimeMatch = (worklog.started.toMMMDD() === log.started.toMMMDD());
                    }

                    // Try to match on worklog duration
                    var diff = Math.floor(worklog.timeSpentSeconds / 60) - Math.floor(log.timeSpentInt / 60);
                    // if duration is within 4 minutes because JIRA is rounding worklog minutes :facepalm:
                    var durationMatch = (diff < 4 && diff > -4);

                    // Matching entries are not able to be logged again
                    if (dateTimeMatch && durationMatch) {
                        $('#result-' + log.id).text('OK').addClass('success').removeClass('info');
                        $('#input-' + log.id).removeAttr('checked').attr('disabled', 'disabled');
                        $("#comment-" + log.id).val(worklog.comment || '').attr('disabled', 'disabled');
                        log.submit = false;
                    }
                })
            });
    });

}
