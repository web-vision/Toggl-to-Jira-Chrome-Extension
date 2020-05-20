var logs = [];
var config = {};
var myIdentity = {};

$(document).ready(function () {
    // Retrieve the stored options
    chrome.storage.sync.get({
        url: 'https://jira.atlassian.net',
        togglApiToken: '',
        mergeEntriesBy: 'no-merge',
        useTogglDescription: true,
        comment: 'Updated via toggl-to-jira http://tiny.cc/t2j',
        jumpToToday: false,
        roundMinutes: 0,
    }, function (items) {
        config = items;
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

        var startString = localStorage.getItem('toggl-to-jira.last-date');
        var startDate = config.jumpToToday || !startString ? new Date() : new Date(startString);
        document.getElementById('start-picker').valueAsDate = startDate;

        var endString = localStorage.getItem('toggl-to-jira.last-end-date');
        var endDate = config.jumpToToday || !endString ? new Date(Date.now() + (3600 * 24 * 1000)) : new Date(endString);
        document.getElementById('end-picker').valueAsDate = endDate;

        $('#start-picker').on('change', fetchEntries);
        $('#end-picker').on('change', fetchEntries);
        $('#submit').on('click', submitEntries);

        // Try to connect to both services first - from identity.js
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
    var startDate = document.getElementById('start-picker').valueAsDate.toISOString();
    var endDate = document.getElementById('end-picker').valueAsDate.toISOString();
    localStorage.setItem('toggl-to-jira.last-date', startDate);
    localStorage.setItem('toggl-to-jira.last-end-date', endDate);
    $('p#error').text("").removeClass('error');

    var dateQuery = '?start_date=' + startDate + '&end_date=' + endDate;

    // Toggl API call with token authorisation header
    $.get({
        url: 'https://www.toggl.com/api/v8/time_entries' + dateQuery,
        headers: {
            "Authorization": "Basic " + btoa(config.togglApiToken + ':api_token')
        }
    }, function (entries) {
        logs = [];
        entries.reverse();

        entries.forEach(function (entry) {
            entry.description = entry.description || 'no-description';
            var issue = entry.description.split(' ')[0];
            entry.description = entry.description.slice(issue.length + 1); // slice off the JIRA issue identifier
            // from dateTimeHelpers.js
            var togglTime = dateTimeHelpers.roundUpTogglDuration(entry.duration, config.roundMinutes);
            var dateString = dateTimeHelpers.toJiraWhateverDateTime(entry.start);
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
                    comment: config.comment,
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
        dom += '<td>' + log.started.toDDMM() + '</td>';

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
    // total time for displayed tickets
    list.append('<tr><td></td><td></td><td></td><td><b>TOTAL</b></td><td>' + totalTime.toString().toHHMM() + '</td></tr>');

    // check if entry was already logged
    logs.forEach(function (log) {
        $.get(config.url + '/rest/api/latest/issue/' + log.issue + '/worklog',
            function success(response) {
                var worklogs = response.worklogs;
                worklogs.forEach(function (worklog) {
                    if (!!myIdentity.jiraEmailAddress && !!worklog.author && worklog.author.emailAddress !== myIdentity.jiraEmailAddress) { return; }

                    var diff = Math.floor(worklog.timeSpentSeconds / 60) - Math.floor(log.timeSpentInt / 60);
                    if (
                        // if date and month matches
                        worklog.started.toDDMM() === log.started.toDDMM() &&
                        // if duration is within 4 minutes because JIRA is rounding worklog minutes :facepalm:
                        diff < 4 && diff > -4
                    ) {
                        $('#result-' + log.id).text('OK').addClass('success').removeClass('info');
                        $('#input-' + log.id).removeAttr('checked').attr('disabled', 'disabled');
                        $("#comment-" + log.id).val(worklog.comment || '').attr('disabled', 'disabled');
                        log.submit = false;
                    }
                })
            });
    });

}
