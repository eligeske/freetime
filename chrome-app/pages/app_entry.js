hidriv.loadPage(function (pageContEle, app) {

    $("body").attr("data-layout", "nomenu");
   
    var app = app;
    var pageContEle = pageContEle;

    var appComponents = app.appComponents;

    // container
    var cont = $("<div>", { "class": "centered", style: "height: 210px; width: 620px" });
    var btnCreate = $("<div>", { "class": "entry-button", html: "Create a New Event" });
    btnCreate.click(function () {
        newPopup.open();
    });

    var btnOpen = $("<div>", { "class": "entry-button", html: "Open an existing Event" });
    btnOpen.click(function () {
        existingPopup.open();
    });

    cont.append(btnCreate, btnOpen);

    pageContEle.append(cont);



    /*****************************************/
    /****** CREATE NEW ***********************/
    /*****************************************/

    var newForm = new app.appComponents.Form({
        labelWidth: 85,
        inputWidth: 240,
        fields: [
            { label: "Event Name", dataKey: "name", required: true },
            {
                label: "Timing Type", dataKey: "timingType", type: "select", getOptions: function (callback) {
                    var opts = [];
                    $.each(app.eventTypes, function (i,obj) {
                        opts.push(lib.mapObject(obj, {"label":"name", "value":"id"}));
                    });
                    callback(opts);
                }, required: true
            },
            { label: "Date", dataKey: "date", type: "date", required: true }
        ]
    });
    var newPopup = new app.appComponents.Popup({
        height: 160, width: 365
    });
    newPopup.body.append(newForm.html);
    newPopup.addButton("Cancel", function () {
        newPopup.close();
    });
    newPopup.addButton("Create",function(){
        if (newForm.validate()) {
            var fields = lib.objectifyFields(newForm.html);
            app.eventNameExists(fields.name, function (exists) {
                if (!exists) {
                    app.createEvent(fields.name, fields.date, fields.timingType, function () {
                        newForm.clear();
                        newPopup.close();
                        openEvent(fields.name);
                    });
                } else {
                    lib.alert("A Race with name already exists");
                    newForm.showRed("name");
                }
            });
        }
    });
    

    /*****************************************/
    /****** OPEN EXISTING  *******************/
    /*****************************************/

    var buttonNames = {
        'cancel': "Cancel",
        'open': "Open",
        'export': "Export",
        'import': "Import"
    }
    var onEventClick = function () {
        setButtonsState();
    }
    var openEventClick = function (rowKey) {
        openEvent(rowKey);
    }

    var existingGrid = new app.appComponents.Grid({
        selectable: "single",
        rowKey: "name",
        name: "eventGrid",
        columns: [
            {
                label: "Choose Event", dataKey: "name", onClick: onEventClick, onDblClick: openEventClick
            },
            {
                label: "", width: 10, "class":"pointer",
                html: '<span class="icon-remove"></span>',
                onClick: function (rowKey) {
                    app.confirm("Deleting an Event is Permanent. Are you sure?", function () {
                        app.deleteEvent(rowKey, function () {
                            existingGrid.tableBody.find("[data-id='" + rowKey + "']").remove();
                        });
                    });
                },
                hoverText: "Permanently delete this race file"
            },
        ]
    });

    var existingPopup = new app.appComponents.Popup({
        height: 200, width: 365
    });
    var refreshFileList = function () {
        app.listEvents(function (fileEntries) {
            existingGrid.clear();
            $.each(fileEntries, function (i, fileEntry) {
                existingGrid.addRow({ name: fileEntry.name });
            });
        });
    }
    existingGrid.divBody.height(140);
    existingPopup.onOpen(function () {
        refreshFileList();
        setButtonsState();
    });

    existingPopup.body.append(existingGrid.html);
    existingPopup.addButton(buttonNames.cancel, function () {
        existingPopup.close();
    });

    existingPopup.addButton(buttonNames.open, function () {
        var sel = existingGrid.getSelected();
        if (!sel.length) {
            return false;
        }
        openEventClick(sel[0]);
    });
    existingPopup.addButton(buttonNames.export, function () {
        var sel = existingGrid.getSelected();
        if (!sel.length) {
            return false;
        }
        app.exportEvent(sel[0], function () {});
    }, "Save a race file to your computer (select one from the list)");
    existingPopup.addButton(buttonNames.import, function () {        
        app.importEvent(function () {
            refreshFileList();
        });
    }, "Import a race file from your computer");


    var openEvent = function (eventName) {
        existingPopup.remove();
        app.openEvent(eventName, function () {
            app.routing.loadEntry();
            app.topBar.title.html(app.currentEvent.fileName);
        });
    }

    var enableButton = function (btnName, enable) {
        var btn = existingPopup.html.find('.button:contains("' + btnName + '")');
        (enable) ? btn.removeClass("inactive") : (btn.hasClass("inactive") ? false : btn.addClass("inactive"));
    }
    var setButtonsState = function () {
        setTimeout(function () {
            var sel = existingGrid.getSelected();
            enableButton(buttonNames.export, !!sel.length);
            enableButton(buttonNames.open, !!sel.length);
        }, 200);
    }

});