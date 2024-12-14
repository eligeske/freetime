hidriv.loadPage(function (pageContEle, app) {

    $("body").attr("data-layout", "hasmenu");

    var app = app;
    var timing = app.timing;
    var pageContEle = pageContEle;
    var appComponents = app.appComponents;
    var storage = app.currentEvent.storage;
    var cache = app.currentEvent.cache;
    var fileName = app.currentEvent.fileName;

    /************************/
    /*** LAYOUT     *********/
    /************************/

    var layout = new appComponents.Layout({
        resize: false
    });

    var leftCol = layout.addColumn({ scrollable: true });
    pageContEle.append(layout.html);


    /************************/
    /*** RESULTS GRIDs ******/
    /************************/

    var checkIfCategoryStarted = function (categoryId) {
        if (app.currentEvent.settings.timingType == "multi-group-start" &&
            !cache.CategoryStart.podiumCategoryId[categoryId]) {
            return false;
        }
        // for "single-start" event type a category is always started by default
        return true;
    }
    

    var topToolbar = new appComponents.Toolbar();
    topToolbar.addButton("Show Refresh Window", function () {
        window.open("../html/results-refresh.html?fileName=" + fileName, "_blank");
    });
    var topCell = leftCol.addCell();
    topCell.pad.append(topToolbar.html);

    (function () {
        var catIdList = Object.keys(cache.PodiumCategory.id);
        if (catIdList.length) {
            var anyMatch = $(catIdList).is(function (i, catId) { return checkIfCategoryStarted(catId); });
            if (anyMatch) {
                $(topToolbar.html).show();
                return;
            }
        }
        $(topToolbar.html).hide();
    })();
    
    var ResultsByCategoryGrid = views.ResultsByCategoryGrid; 
    $.each(cache.PodiumCategory.id, function (id, obj) {

        if (checkIfCategoryStarted(obj.id)) {
            var resultsGrid = new ResultsByCategoryGrid(obj, app.currentEvent, timing, appComponents.Toolbar, appComponents.Grid,
                function () {
                    var resultsGridCell = leftCol.addCell();
                    resultsGrid.toolbar.addButton("Print", function () {
                        window.open("../html/results-print.html?fileName=" + fileName + "&categoryId=" + obj.id, "_blank");
                    });
                    resultsGridCell.pad.append(resultsGrid.html);
                });
        }
        
    });
    
});