window.addEventListener('load', () => {
    let form = document.getElementById('options');
    chrome.storage.sync
        .get({
            url: '',
            togglApiToken: '',
            jumpToToday: false,
        })
        .then((items) => {
            document.getElementById('jira-url').value = items.url;
            document.getElementById('toggl-token').value = items.togglApiToken;
            document.getElementById('jump-to-today').checked = items.jumpToToday;
        });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        let rawUrl = formData.get('url');
        rawUrl = rawUrl.trim();
        let url = rawUrl.replace('//$/');
        chrome.storage.sync.set({
            url: url,
            togglApiToken: formData.get('togglApiToken'),
            jumpToToday: formData.get('jumpToToday'),
        })
            .then(() => {
                let status = document.getElementById('status');
                status.innerText = 'Saved successful!';
                status.classList.add('status-ok');
            })
            .catch(() => {
                let status = document.getElementById('status');
                status.innerText = 'Saving failed!';
                status.classList.add('status-fail');
            });
        return false;
    });
});
