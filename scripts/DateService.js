class DateService {
    #startDate = new Date();
    #endDate = new Date();
    static #startDateIdentifier = 'toggl2jira.startDate';
    static #endDateIdentifier = 'toggl2jira.endDate';
    constructor() {
        if (localStorage.getItem(DateService.#startDateIdentifier) !== null) {
            this.#startDate = new Date(localStorage.getItem(DateService.#startDateIdentifier) ?? null);
        } else {
            this.#startDate = new Date();
        }
        this.#startDate.setHours(0,0,0,0);
        if (localStorage.getItem(DateService.#endDateIdentifier) !== null) {
            this.#endDate = new Date(localStorage.getItem(DateService.#endDateIdentifier) ?? null);
        } else {
            this.#endDate = DateService.addOneDayToDate(this.#startDate);
        }
        this.#endDate.setHours(0, 0, 0, 0);
    }

    /**
     * @returns string
     */
    static toDateInputValue(date) {
        const currentYear = date.getFullYear().toString();
        let currentMonth = (date.getMonth() + 1).toString();
        let currentDay = date.getDate().toString();
        if (currentDay.length === 1) {
            currentDay = '0' + currentDay;
        }
        if (currentMonth.length === 1) {
            currentMonth = '0' + currentMonth;
        }
        return currentYear + '-' + currentMonth + '-' + currentDay;
    }

    /**
     * @returns Date
     */
    getStartDate() {
        return this.#startDate;
    }

    /**
     * @returns Date
     */
    getEndDate() {
        return this.#endDate;
    }

    /**
     * @param startDate Date
     * @returns void
     */
    setNewStartDate(startDate) {
        if (startDate instanceof Date) {
            startDate.setHours(0, 0, 0, 0);
            this.#startDate = startDate;
            localStorage.setItem(DateService.#startDateIdentifier, startDate.toUTCString());
        }
    }

    /**
     *
     * @param endDate
     * @returns void
     */
    setNewEndDate(endDate) {
        if (endDate instanceof Date) {
            endDate.setHours(0, 0, 0, 0);
            this.#endDate = endDate;
            localStorage.setItem(DateService.#endDateIdentifier, endDate.toUTCString());
        }
    }

    static addOneDayToDate(currentDate) {
        const calculatedDate = currentDate.getTime() + (60 * 60 * 24 * 1000);
        return new Date(calculatedDate);
    }

    static removeOneDayFromDate(currentDate) {
        const calculatedDate = currentDate.getTime() - (60 * 60 * 24 * 1000);
        return new Date(calculatedDate);
    }

    static secondsToReadableTime(seconds) {
        let secondsInMinute = (Math.trunc(seconds % 60)).toString();
        if (secondsInMinute.length === 1) {
            secondsInMinute = '0' + secondsInMinute;
        }
        let minutes = Math.trunc(seconds / 60);
        let minuteInHour = (minutes % 60).toString();
        if (minuteInHour.length === 1) {
            minuteInHour = '0' + minuteInHour;
        }
        let hour = Math.trunc(minutes / 60);
        return hour + ':' + minuteInHour + ':' + secondsInMinute;
    }
}
