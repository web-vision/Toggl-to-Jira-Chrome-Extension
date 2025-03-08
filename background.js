/*
 *  Copyright (c) 2016 Frank Trigub. All rights reserved.*
    frankyyyy at live com

    Background process that intercepts all web requests.
    Jira requests that we make are then forged as if coming from Jira.
*/

console.log('Starting extension');

// Modify HTTP headers on Jira requests
importScripts('modifyHeaders.js');
modifyHeaders()

// Called when the user clicks on the browser action.
chrome.action.onClicked.addListener(function () {
    // No tabs or host permissions needed!
    chrome.scripting.executeScript({
        files: ['parser.js']
    });
});
