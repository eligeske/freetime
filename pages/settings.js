hidriv.loadPage(function (pageContEle, app) {

    $("body").attr("data-layout", "hasmenu");

    var app = app;
    var timing = app.timing;
    var pageContEle = pageContEle;
    var appComponents = app.appComponents;
    var storage = app.currentEvent.storage;
    var cache = app.currentEvent.cache;
    var fileName = app.currentEvent.fileName;
    var appThemes = app.appThemes;
    var applyAppTheme = app.applyAppTheme;
    var loadAppThemeById = app.loadAppThemeById;
    var appThemeId = app.currentTheme.id;

    /************************/
    /*** LAYOUT     *********/
    /************************/

    var layout = new appComponents.Layout({
        resize: false
    });

    var leftCol = layout.addColumn({ scrollable: true });
    var settingsCell = leftCol.addCell();

    pageContEle.append(layout.html);

    /************************/
    /*** APP SETTINGS *******/
    /************************/

    var title = new appComponents.Toolbar("App Settings");
    var section = new appComponents.Section();
    

    var form = new appComponents.Form({
        //labelWidth: int, 
        //inputWidth: int,
        fields: [
            {
                label: "Theme", dataKey: "appThemeCss", type: "select", required: true,
                getOptions: function (callback) {
                    var opts = [];
                    $.each(appThemes, function (i, obj) {
                        opts.push(lib.mapObject(obj, { "label": "name", "value": "id" }));
                    });
                    callback(opts);
                },
                //onChange: function () {
                //    var values = form.getValues();
                //    loadAppThemeById(values["appThemeCss"]);
                //}
            }
        ]
    });

    var setThemeSelectValue = function () {
        form.setValue("appThemeCss", appThemeId);
    }
    

    var buttons = new appComponents.Toolbar();
    buttons.html.attr("style", "max-width: 250px;");
    //buttons.addButton("Clear Changes", function () {
    //    setThemeSelectValue();
    //    applyAppTheme(appThemeId);
    //});
    buttons.addButton("Apply Theme", function () {
        var values = form.getValues();
        loadAppThemeById(values["appThemeCss"]);
        applyAppTheme(values["appThemeCss"]);
    });
    

    settingsCell.pad.append(title.html, section.html);
    section.pad.append(form.html);
    section.pad.append(buttons.html);

    setThemeSelectValue();


    /************************/
    /*** IMPORT/EXPORT ******/
    /************************/

    var title = new appComponents.Toolbar("Import/Export");
    var section = new appComponents.Section();
    var instructions = $("<p>", { style: "display: inline-block; max-width: 300px", html: "Here you can import a CSV list of Racers and Categories. <br/>" });
    section.pad.append(instructions);

    var buttons = new appComponents.Toolbar();
    buttons.html.attr("style", "max-width: 250px;");
    buttons.addButton("Import Racers", function () {
        importRacers();
    });
    buttons.addButton("Import Categories", function () {
        importCategories();
    });

    settingsCell.pad.append(title.html, section.html);
    section.pad.append(buttons.html);
   
    var importCategories = function () {
        app.importCategoriesCSV(function () {
            self.lib.alertSuccess("File imported successfully.");
        });
    }

    var importRacers = function () {
        app.importRacersCSV(function () {
            self.lib.alertSuccess("File imported successfully.");
        });
    }

    
});