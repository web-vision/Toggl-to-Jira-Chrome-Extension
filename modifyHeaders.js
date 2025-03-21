async function modifyHeaders() {
    // Retrieve the configured Jira URL
    const {url: jiraUrl} = await chrome.storage.sync.get({
        url: 'https://jira.atlassian.net'
    });
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
            "id": 1,
            "priority": 1,
            "action": {
                "type": "modifyHeaders",
                "requestHeaders": [
                    { "header": "Referer", "operation": "set", "value": jiraUrl },
                    { "header": "Origin", "operation": "set", "value": jiraUrl }
                ]
            },
            "condition": {
                "urlFilter": jiraUrl + "*",
                "resourceTypes": ["xmlhttprequest"]
            }
        }],
        removeRuleIds: [1]
    })
}
