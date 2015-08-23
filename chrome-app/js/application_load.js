var hidriv;

window.open = function (url) {
    chrome.app.window.create(url, {
        frame: "none",
        'bounds': {
            'width': 900,
            'height': 800
        }
    }, function (appWindow) {

    });
}

$(document).ready(function () {
    hidriv = new Application();
});