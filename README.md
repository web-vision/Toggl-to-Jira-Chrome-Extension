# Toggl-to-Jira-Chrome-Extension
Sync toggl time entries with Jira work log


Converts Toggl time entries to *Work Log* entries on corresponding Jira tasks where Time Tracking has been enabled.
If your Project requires you to log work on Jira tasks and issues, it is not possible to import from Toggl. Server side Toggl-Jira integrations cost money or won't work in the cloud. This extension bridges the gap.

This simple extension allows you to post your Toggl entries to the corresponding Jira tasks automatically. All you need to do is include the Jira issue identifier at the beginning of your Toggl descriptions, eg; "ABC-123 I did some work".

You need to be logged in to your Jira board, so the cookies are available in the browser, and provide your Toggl User API Key which is available here; https://toggl.com/app/profile

Configure your Jira server URL and Toggl API Key in the extension Options once installed.

# Installation

1 - Get the extension here;
https://chrome.google.com/webstore/detail/toggl-to-jira/anbbcnldaagfjlhbfddpjlndmjcgkdpf

2 - Installing manually from source;

- Use the Clone or Download option and choose ZIP
- Copy the folder that's inside the ZIP file to somewhere on your PC
- Visit chrome://extensions/ in your browser to manage Chrome Extensions
- Turn on "Developer Mode" in the top right
- This will allow you to click on "Load Unpacked"
- And browse inside the folder you created earlier and click "Select Folder"
- You should now see the Extension installed.
- You can now disable Developer Mode (if you do not you will be prompted to next time you restart Chrome)
- You should now also see an additional Toggl to Jira icon in the top right of your browser window
- Clicking this icon will bring up the tool
