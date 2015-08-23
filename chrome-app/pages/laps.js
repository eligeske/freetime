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


    /****************************/
    /*** LAP ENTRY VIEW *********/
    /****************************/
    
    var lapEntryView = new (function () {
        var self = this;
        var html;
        var nameDiv;
        var bibInp;
        var store = storage.Lap;
        var Model = function () { return $.extend(this, model.Lap); };

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
                    onAddLapClick();
                }
            });
        }
        // ACTIONS
        var onAddLapClick = function () {
            var bib = bibInp.val();
           
            var data = new Model();
            data.timestamp = timing.getTimeStamp();

            if (cache.Racer.bib[bib]) {
                lib.updateObject(data, cache.Racer.bib[bib], { "racerId": "id" });
            } else {
                data.bib = bib;
            }

            store.insert(data, function () {
                bibInp.val(''); nameDiv.html('');
            });

            lapGrid.grid.clearSearch();
        }
        var onBibKeyUp = function (bibNumber) {
            if (bibNumber && cache.Racer.bib[bibNumber]) {
                var racer = cache.Racer.bib[bibNumber];
                var name = "";
                if (racer.firstName && racer.lastName) {
                    name = racer.firstName+" "+racer.lastName;
                } else if (racer.firstName && !racer.lastName) {
                    name = racer.firstName;
                } else if (!racer.firstName && racer.lastName) {
                    name = racer.lastName;
                }
                if (racer.team) {
                    name = (name.length)?name+" -":"";
                    name = name + " Team " + racer.team;
                }
                nameDiv.html(name);
            } else {
                nameDiv.html('no racer found');
            }
        }
        // METHODS
        var createHtml = function () {
            html = $("<div>", { "class": "single-start grid" });
            var table = $("<table>", { "class": "head", html: "<thead><tr><th>Lap Entry</th></tr></thead>" });
            var body = $("<tbody>", { html: "<tr><td></td></tr>" });
            table.append(body);
            var td = body.find('td');

            nameDiv = $("<div>", { "class": "name-display" });
            var form = $("<div>", { style: "padding: 15px 45px;" });
            bibInp = $("<input>", { "class": "bib-input", placeholder: "Enter BIB #", type: "text" });
            var btn = $("<button>", { "class": "bib-input start-btn", html: "add lap", click: onAddLapClick });
            var instr = $("<div>", { "class": "instructions", html: "Type in the Bib # and press Enter or click the Start button." });
            form.append(instr, bibInp, btn, nameDiv);
            td.append(form);
            html.append(table);
        }


        __construct();
    })();

    startCell.pad.append(lapEntryView.html);


    /************************/
    /*** LAP GRID ***********/
    /************************/

    var getRacerNameById = function (racerId) {
        var resultName = "";
        if (racerId) {
            var racer = cache.Racer.id[racerId];
            if (racer.teamMembers && racer.teamMembers.length) {
                resultName += (racer.team) ? (racer.team + " ") : "";
                resultName += "(" + racer.teamMembers.join(", ") + ")";
            } else {
                resultName += (racer.firstName) ? (racer.firstName + " ") : "";
                resultName += (racer.lastName) ? (racer.lastName + " ") : "";
                resultName += ((resultName) ? (racer.team ? "- " : "") : "") + (racer.team || "");
            }
        }
        return resultName;
    }


    var lapGrid = new appComponents.EditorGrid({
        container: lapGridCell.pad,
        title: "Laps",
        store: storage.Lap,
        noRefreshOnSave: true,
        refreshGrid: function(store,grid){
            store.readAll(function (data) {
                data = _.sortBy(data, function (obj) { return obj.timestamp; });
                data.reverse();
                grid.loadData(data,1);
            });
        },
        gridSettings: {
            selectable: true,
            rowKey: "id",
            name: "lapsGrid",
            paging: {
                size: 100, callback: function (pageNumber,grid) {
                    storage.Lap.readAll(function (data) {
                        data = _.sortBy(data, function (obj) { return obj.timestamp; });
                        data.reverse();
                        grid.loadData(data, pageNumber);
                    });
                }
            },
            search: {
                title: "BIB",
                callback: function(text,grid){
                    if (text && text != "") {
                        storage.Lap.readMany("bib", text, function (data) {
                            data = _.sortBy(data, function (obj) { return obj.timestamp; });
                            data.reverse();
                            grid.loadData(data, 1);
                        });
                    } else {
                        storage.Lap.readAll(function (data) {
                            data = _.sortBy(data, function (obj) { return obj.timestamp; });
                            data.reverse();
                            grid.loadData(data, 1);
                        });
                    }
                }
            },
            rowRule: function(rowData, rowEle){
                if (!(rowData.id && rowData.id == "no-records") && !rowData.racerId) {
                    if (!rowEle.hasClass('warning')) {
                        rowEle.addClass('warning');
                    }
                } else {
                    rowEle.removeClass('warning');
                }
            },
            columns: [
                { label: "Id", dataKey: "id", hidden: true },
                { label: "RacerId", dataKey: "racerId", hidden: true },
                { label: "BIB", dataKey: "bib", width: 75 },
                //{ label: "Timestamp", dataKey: "timestamp" },
                {
                    label: "Time", dataKey: "timestamp", width: 100, getValue: function (timestamp) {
                        return timing.getReadableClockFromTimestamp(timestamp);
                    }
                },
                {
                    label: "Team", dataKey: "racerId", width: 40, getValue: function (racerId) {
                        if (racerId) {
                            var racer = cache.Racer.id[racerId];
                            if (racer.teamMembers && racer.teamMembers.length) {
                                return "yes";
                            }
                        }
                        return "";
                    }
                },
                {
                    label: "Racer Name", dataKey: "racerId", getValue: function (racerId) {
                        return getRacerNameById(racerId);
                    }
                }
            ]
        },
        popupSettings: { height: 170, width: 320 },
        formSettings: {
            fields: [
                    { label: "id", dataKey: "id", readonly: true, visible: false },
                    { label: "RacerId", dataKey: "racerId", readonly: true, visible: false },
                    {
                        label: "Racer Name", dataKey: "racerName", readonly: true, customValue: function (_form) {
                            var racerId = _form.getValue("racerId");
                            return getRacerNameById(racerId);
                        }
                    },
                    {
                        label: "Bib", dataKey: "bib", onChange: function (_form) {
                            var bib = $(this).val();
                            var r = cache.Racer.bib[bib];
                            if (r) {
                                
                                _form.setValue("racerId", r.id);
                                _form.setValue("racerName", getRacerNameById(r.id));
                            } else {
                                _form.setValue("racerId", null);
                                _form.setValue("racerName", 'No Racer');
                            }
                        }
                    },
                    { label: "Timestamp", dataKey: "timestamp", dataType: "int" },
            ]
        }
    }, appComponents.Toolbar, appComponents.Grid, appComponents.Popup, appComponents.Form);

    lapGrid.toolbar.html.find(".button").hide();
    
    storage.Lap.listen(lapGrid, function (data, type) {
        
        if (type == storage.changeTypes.update) {
            lapGrid.grid.updateRow(data.id,data);
        } else if (type == storage.changeTypes.insert) {
            lapGrid.grid.addRow(data, true);
            lapGrid.grid.popRow();
        }else{
            lapGrid.refreshGrid();
        }
    });

    // RESIZE APP COMPONENTS
    layout.resize();
    lapGrid.grid.size();

});