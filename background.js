chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create('html/application.html', {
        frame: 'none',
        id:'main_window',
        singleton: true,
        'bounds': {
            'width': 1280,
            'height':800
        }
    }, function (appWindow) {

    });
    
});