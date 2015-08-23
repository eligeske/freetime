



var logoSrc = "../imgs/hidriv_logo.png";
$(document).ready(function () {
   
    var lib = new Lib();
    var timing = new Timing();
    var appComponents = new AppComponents();
    var fileName = lib.getURLParam("fileName");
    var categoryId = lib.getURLParam("categoryId");
    var cache = DataTemplate.cacheTemplate;
    var eventTemplate = DataTemplate.eventTemplate;
    var storage;

    var domFileStorage = new DOMFileStorageExt(function (storage) {
        domFileStorage = storage;
        domFileStorage.readEvent(fileName, function (fileContents) {
            var ev = JSON.parse(fileContents);
            storage = new MemoryStorage(ev.storage, ev.model, ev.primaryKey, cache, function () { });
            var obj = cache.PodiumCategory.id[categoryId];


            var currentEvent = new Event(ev, cache, domFileStorage, eventTemplate);

            var ResultsByCategoryGrid = views.ResultsByCategoryGrid;
            var grid = new ResultsByCategoryGrid(obj, currentEvent, timing, appComponents.Toolbar, appComponents.Grid, function () {
                var head = grid.html.find(".head");
                head.remove();
                var tr = head.find("tr");
                setTimeout(function () {
                    grid.html.find("table").prepend($("<thead>", { html: tr }));

                    $("#print_btn").click(function () {
                        window.print();
                    });
                    $("#close_btn").click(function () {
                        chrome.app.window.current().close();
                    });
                }, 900);
                $("title").html(obj.name + " results - hidriv timing");

                $("#print_cont").append(grid.html);
                $(".toolbar").append($("<img>", { src: logoSrc, "class": "print-logo" }));
            });
            
        });
    });

});