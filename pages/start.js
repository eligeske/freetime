hidriv.loadPage(function (pageContEle, app) {

    $("body").attr("data-layout", "hasmenu");

    var timing = app.timing;
    var appComponents = app.appComponents;
    var storage = app.currentEvent.storage;
    var cache = app.currentEvent.cache;
    var model = app.currentEvent.model;


    /************************/
    /*** LAYOUT     *********/
    /************************/

    var layout = new appComponents.Layout();

    var leftCol = layout.addColumn();
    var startCell = leftCol.addCell();
    startCell.setHeight(220);
    var lapGridCell = leftCol.addCell();
    pageContEle.append(layout.html);


    /************************/
    /*** START VIEW *********/
    /************************/
    
    var singleStartView = new (function () {
        var self = this;
        var html;
        var nameDiv;
        var bibInp;
        var store = storage.RacerStart;
        var Model = function () { return $.extend(this, model.RacerStart); };

        var __construct = function () {
            createHtml();
            bindEvents();
            self.html = html;
        }
        // EVENTS
        var bindEvents = function () {
            bibInp.keyup(function (e) {
                if (isInputKey(e.which) && isUserInputValid($(this).val())) {
                    onBibKeyUp($(this).val());
                }
                if (e.which == 13) {
                    onStartClick();
                }
            });
        }
        // ACTIONS
        var onStartClick = function () {
            var bib = bibInp.val();
            if (!validateBib(bib)) { return false; }
            var data = new Model();
            data.timestamp = timing.getTimeStamp();
            lib.updateObject(data, cache.Racer.bib[bib], { "racerId" : "id" });
            store.insert(data, function () {
                bibInp.val(''); nameDiv.html('');
            });
        }
        var onBibKeyUp = function(bibNumber){
            if (bibNumber && cache.Racer.bib[bibNumber]) {

                var racer = cache.Racer.bib[bibNumber];
                var name = "";
                if (racer.firstName && racer.lastName) {
                    name = racer.firstName + " " + racer.lastName;
                } else if (racer.firstName && !racer.lastName) {
                    name = racer.firstName;
                } else if (!racer.firstName && racer.lastName) {
                    name = racer.lastName;
                }
                if (racer.team) {
                    name = (name.length) ? name + " -" : "";
                    name = name + " Team " + racer.team;
                }

                var nm = name;
                if (cache.RacerStart.racerId[cache.Racer.bib[bibNumber].id]) {
                    nameDiv.html(nm+' has already started!');
                }else{
                    nameDiv.html(nm);
                }
            } else {
                nameDiv.html('no racer found');
            }
        }
        // METHODS
        var createHtml = function () {
            html = $("<div>", { "class": "single-start grid" });
            var table = $("<table>", { "class":"head", html: "<thead><tr><th>Start Block</th></tr></thead>" });
            var body = $("<tbody>", { html: "<tr><td></td></tr>" });
            table.append(body);
            var td = body.find('td');

            nameDiv = $("<div>", { "class" : "name-display" });
            var form = $("<div>", { style: "padding: 15px 45px;" });
            bibInp = $("<input>", { "class" : "bib-input", placeholder: "Enter BIB #", type: "text" });
            var btn = $("<button>", { "class": "bib-input start-btn", html: "start", click: onStartClick });
            var instr = $("<div>", { "class": "instructions", html: "Type in the Bib # and press Enter or click the Start button." });
            form.append(instr,bibInp, btn,nameDiv);
            td.append(form);
            html.append(table);
        }
        var validateBib = function (bib) {
            if (!bib || !cache.Racer.bib[bib]) { return false; }
            if (cache.RacerStart.racerId[cache.Racer.bib[bib].id]) {
                return false;
            }
            return true;
        }

        __construct();
    })();

    startCell.pad.append(singleStartView.html);


    /************************/
    /*** LAP GRID ***********/
    /************************/

    var startGrid = new appComponents.EditorGrid({
        container: lapGridCell.pad,
        title: "Starts",
        store: storage.RacerStart,
        gridSettings: {
            selectable: true,
            rowKey: "id",
            name: "startGrid",
            columns: [
                { label: "Id", dataKey: "id", hidden: true},
                { label: "RacerId", dataKey: "racerId", hidden: true},
                {
                    label: "BIB", dataKey: "racerId", getValue: function (racerId) {
                        return (racerId && cache.Racer.id[racerId]) ? cache.Racer.id[racerId].bib : "";
                    }
                },
                 {
                     label: "Time", dataKey: "timestamp", getValue: function (timestamp) {
                         return timing.getReadableClockFromTimestamp(timestamp);
                     }
                 },
                //{ label: "Timestamp", dataKey: "timeStamp" },
                {
                    label: "F Name", dataKey: "racerId", getValue: function (racerId) {
                        return (racerId && cache.Racer.id[racerId]) ? cache.Racer.id[racerId].firstName : "";
                    }
                },
                {
                    label: "L Name", dataKey: "racerId", getValue: function (racerId) {
                        return (racerId && cache.Racer.id[racerId]) ? cache.Racer.id[racerId].lastName : "";
                    }
                },
            ]
        },
        popupSettings: { height: 170, width: 320 },
        formSettings: {
            fields: [
                    { label: "id", dataKey: "id", readonly: true, visible: false },
                    { label: "Racer Match", dataKey: "racerId", readonly: true, required: true, visible: false },
                    {
                        label: "Racer Name", dataKey: "racerName", readonly: true, customValue: function (_form) {
                            var racerId = _form.getValue("racerId");
                            if (racerId && cache.Racer.id[racerId]) {
                                return cache.Racer.id[racerId].firstName + " " + cache.Racer.id[racerId].lastName;
                            }
                        }
                    },
                    {
                        label: "Bib", dataKey: "bib",
                        required: true,
                        customValue: function(_form){
                            var racerId = _form.getValue("racerId");
                            return (racerId && cache.Racer.id[racerId]) ? cache.Racer.id[racerId].bib : "";
                        },
                        onChange: function (_form) {
                            var bib = $(this).val();
                            var r = cache.Racer.bib[bib];
                            if (r) {
                                if (cache.RacerStart.racerId[r.id] && (cache.RacerStart.racerId[r.id].id != _form.getValue("id"))) {
                                    _form.setValue("racerId", null);
                                    _form.setValue("racerName", "Racer already started");
                                } else {
                                    _form.setValue("racerId", r.id);
                                    _form.setValue("racerName", r.firstName + " " + r.lastName);
                                }
                                
                            } else {
                                _form.setValue("racerId", null);
                                _form.setValue("racerName", 'No Racer');
                            }
                        }
                    },
                    { label: "Timestamp", dataKey: "timestamp", dataType: "int", required: true }
            ]
        }
    }, appComponents.Toolbar, appComponents.Grid, appComponents.Popup, appComponents.Form);


    startGrid.popup.onOpen(function () {
        setTimeout(function () {
            var racerId = getRacerIdFormValue();
            if (racerId) {
                showButton(deleteBtnName, true);
            } else {
                showButton(deleteBtnName, false);
            }
        }, 10);
    });

    var deleteBtnName = "Delete";
    var deleteRacerStartMsg = "This is permanent. Are you sure?";

    var onRacerStartDeleted = function () {
        startGrid.refreshGrid();
        startGrid.popup.close();
        startGrid.form.clear();
        startGrid.grid.tableBody.focus();
    }

    var deleteRacerStartTime = function (racerId, callback) {
        var racerStart = cache.RacerStart.racerId[racerId];
        if (racerStart) {
            storage.RacerStart.delete(racerStart, callback);
        } else {
            callback();
        }
    }


    startGrid.popup.addButton(deleteBtnName, function () {
        app.confirm(deleteRacerStartMsg, function () {
            var racerId = getRacerIdFormValue();
            deleteRacerStartTime(racerId, function () {
                onRacerStartDeleted();
            });
        });
    });

    startGrid.toolbar.html.find(".button").hide();
    storage.RacerStart.listen(startGrid, function () {
        startGrid.refreshGrid();
    });


    var getRacerIdFormValue = function () {
        return startGrid.popup.body.find("input[name='racerId']").val();
    }

    var getButton = function (btnName) {
        return startGrid.popup.html.find('.button:contains("' + btnName + '")');
    }

    var showButton = function (btnName, bShow) {
        var btn = getButton(btnName);
        (bShow != null && bShow == false) ? btn.hide() : btn.show();
    };


    (function () {

        var deleteBtn = getButton(deleteBtnName);
        deleteBtn.parent().prepend(deleteBtn);

    })();


    // RESIZE APP COMPONENTS
    layout.resize();
    startGrid.grid.size();

});