/*
    Date time helpers.
    
    Some string extensions.
    Some functions.
*/

String.prototype.limit = function (limit) {
    return this.length > limit ? this.substr(0, limit) + '...' : this;
}

String.prototype.toHHMMSS = function () {
    // don't forget the second param
    var secNum = parseInt(this, 10);
    var hours = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);
    var seconds = secNum - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    var time = hours + 'h ' + minutes + 'm ' + seconds + 's';
    return time;
}

String.prototype.toHHMM = function () {
    // don't forget the second param
    var secNum = parseInt(this, 10);
    var hours = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);

    // set minimum as 1 minute
    if (hours + minutes === 0) minutes = 1;

    // pad zero
    if (hours < 10) {
        hours = '0' + hours;
    }
    // pad zero
    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    var time = hours + 'h ' + minutes + 'm';
    return time;
}
String.prototype.toHH_MM = function () {
    // don't forget the second param
    var secNum = parseInt(this, 10);
    var hours = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);

    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    var time = hours + ':' + minutes;
    return time;
}

String.prototype.toDDMM = function () {
    // don't forget the second param
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var d = new Date(this);
    return monthNames[d.getMonth()] + ' ' + d.getDate();
}

var dateTimeHelpers = {

    // Creates a key in ISO date format (0 padded) eg; 20200518 (18th May 2020)
    createDateKey: function (date) {
        var concatZero = (value) => {
            if (value < 10) {
                return '0' + value;
            } else {
                return '' + value;
            }
        }

        var d = new Date(date);
        return '' + d.getFullYear() + concatZero(d.getMonth() + 1) + concatZero(d.getDate());
    },

    /*
    * Round duration up to next `minutes`.
    * No rounding will be applied if minutes is zero.
    * 
    * Example: round to next quater:
    * roundUpTogglDuration(22, 15) = 30 // rounded to the next quarter
    * roundUpTogglDuration(35, 60) = 60 // round to full hour
    * roundUpTogglDuration(11, 0) = 11  // ignored rounding
    */
    roundUpTogglDuration: function (initialDurationSeconds, roundingMinutes) {
        var minutesDuration = initialDurationSeconds / 60 // initialDuration is in seconds
        if (minutesDuration == 0 || roundingMinutes == 0) { // no rounding required
            return initialDurationSeconds;
        } else { // make sure minium `minutes` are tracked
            var roundedDuration = (Math.floor(minutesDuration / roundingMinutes) + 1) * roundingMinutes;
            return roundedDuration * 60; // convert back to seconds
        }
    },

    // toggl time should look like jira time (otherwise 500 Server Error is raised)
    toJiraWhateverDateTime: function (date) {
        // TOGGL:           at: "2016-03-14T11:02:55+00:00"
        // JIRA:     "started": "2012-02-15T17:34:37.937-0600"

        var parsedDate = Date.parse(date);
        var jiraDate = Date.now();

        if (parsedDate) {
            jiraDate = new Date(parsedDate);
        }

        var dateString = jiraDate.toISOString();

        // timezone is something fucked up with minus and in minutes
        // thatswhy divide it by -60 to get a positive value in numbers
        // example -60 -> +1 (to convert it to GMT+0100)
        var timeZone = jiraDate.getTimezoneOffset() / (-60);
        var absTimeZone = Math.abs(timeZone);
        var timeZoneString;
        var sign = timeZone > 0 ? '+' : '-';

        // take absolute because it can also be minus
        if (absTimeZone < 10) {
            timeZoneString = sign + '0' + absTimeZone + '00'
        } else {
            timeZoneString = sign + absTimeZone + '00'
        }

        dateString = dateString.replace('Z', timeZoneString);

        return dateString;
    }

}