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
    startCell.setHeight(300);
    var lapGridCell = leftCol.addCell();
    pageContEle.append(layout.html);


    /************************/
    /*** START VIEW *********/
    /************************/
    
    var startView = new (function () {
        var self = this;
        var html;
        var nameDiv;
        var inner;
        var startingDiv;
        var allDiv;
        var store = storage.CategoryStart;
        var Model = function () { return $.extend(this, model.CategoryStart); };

        var __construct = function () {
            createHtml();
            createStartHtml();
            bindEvents();
            self.html = html;
            self.refresh = refresh;
        }
        // EVENTS
        var bindEvents = function () {
            
        }
        // ACTIONS
        var onStartClick = function () {
            var startingIds = getStartingIds();
            if (!startingIds.length) { lib.alert("You didn't select a Category."); return; };
            var ts = timing.getTimeStamp();
            $.each(startingIds, function (i,id) {
                var data = new Model();
                data.timestamp = ts;
                data.podiumCategoryId = id;
                store.insert(data, function () { });
            });
            startingDiv.html('');
        }
       
        // METHODS
        var createHtml = function () {
            html = $("<div>", { "class": "single-start grid" });
            var gridTable = $("<table>", { "class":"head", html: "<thead><tr><th>Start Block</th></tr></thead>" });
            var gridBody = $("<tbody>", { html: "<tr><td></td></tr>" });
            gridTable.append(gridBody);
            inner = gridBody.find('td');            
            html.append(gridTable);
        }
        var createStartHtml = function () {
            inner.css("padding","15px");
            var table = $("<table>", { style: "position: relative; top:0px; left: 0px; bottom: 0px; right: 0px; border-collapse: collapse", html: "<tr><td valign='top'></td><td valign='top'></td></tr>" });
            var tds = table.find("td"); var td1 = $(tds[0]); var td2 = $(tds[1]);

            var form = $("<div>");
            var btn = $("<button>", { "class": "bib-input start-btn", html: "start", click: onStartClick });
            var instr = $("<div>", { "class": "instructions", html: "Add Categories and press the Start Button." });
            form.append(instr, btn);
            td1.append(form); td1.css("padding-left", "0");
            inner.append(table);

            // left side
            startingDiv = $("<div>", { "class": "scroller-container", style: "height: 116px; margin-top: 10px" });
            td1.append(startingDiv);

            var addItem = function (ele,obj) {
                startingDiv.append(new Option(obj, removeItem).html);
                ele.addClass("added");
            }
            var removeItem = function (ele,obj) {
                td2.find("[data-id='" + obj.id + "']").removeClass("added");
                ele.remove();
            }

            // right side
            var Option = function (obj,callback) {
                var html = $("<div>", {
                    "class": "toggle-button", "data-id": obj.id, html: obj.name, click: function () {
                        if (!$(this).hasClass("added")) {
                            callback($(this), obj);
                        }                        
                    }
                });
                var span = $("<span>", {  html: " - " + ((obj.numberOfLaps != null)?obj.numberOfLaps:"Many ")+ " Laps" });
                html.append(span);
                this.html = html;
            }
            allDiv = $("<div>", { "class": "scroller-container", style: "height: 205px;" });
            td2.append(allDiv); td2.css("padding", "0");
            $.each(cache.PodiumCategory.id, function (id, obj) {
                var opt = new Option(obj, addItem);
                if (cache.CategoryStart.podiumCategoryId[obj.id]) {
                    opt.html.addClass("added");
                }
                allDiv.append(opt.html);
            });
        }

        var getStartingIds = function () {
            var starting = startingDiv.find("[data-id]");
            var ids = [];
            if (starting.length) {
                $.each(starting, function () {
                    ids.push($(this).attr("data-id"));
                });
            }
            return ids;
        }

        var refresh = function () {
            $.each(cache.PodiumCategory.id, function (id, obj) {
                if (!cache.CategoryStart.podiumCategoryId[obj.id] && !startingDiv.find('[data-id="' + obj.id + '"]').length) {
                    allDiv.find('[data-id="' + obj.id + '"]').removeClass("added");
                }
            });
        }

        __construct();

    })();

    startCell.pad.append(startView.html);


    /************************/
    /*** LAP GRID ***********/
    /************************/

    var startGrid = new appComponents.EditorGrid({
        container: lapGridCell.pad,
        title: "Starts",
        store: storage.CategoryStart,
        gridSettings: {
            selectable: true,
            rowKey: "id",
            name: "startGrid",
            columns: [
                { label: "Id", dataKey: "id" },
                { label: "Cat Id", dataKey: "podiumCategoryId" },
                {
                    label: "Cat", dataKey: "podiumCategoryId", getValue: function (podiumCategoryId) {
                        return (podiumCategoryId && cache.PodiumCategory.id[podiumCategoryId]) ? cache.PodiumCategory.id[podiumCategoryId].name : "";
                    }
                },
                 {
                     label: "Time", dataKey: "timestamp", getValue: function (timestamp) {
                         return timing.getReadableClockFromTimestamp(timestamp);
                     }
                 },
                //{ label: "Timestamp", dataKey: "timeStamp" },                
            ]
        },
        popupSettings: { height: 140, width: 320 },
        formSettings: {
            fields: [
                    { label: "id", dataKey: "id", readonly: true, visible: false },
                    { label: "Cat Id", dataKey: "podiumCategoryId", readonly: true, visible: false },
                    {
                        label: "Category", dataKey: "podiumCategoryName", readonly: true, customValue: function (_form) {
                            var podiumCategoryId = _form.getValue("podiumCategoryId");
                            return (podiumCategoryId && cache.PodiumCategory.id[podiumCategoryId]) ? cache.PodiumCategory.id[podiumCategoryId].name : "";
                        }
                    },
                    { label: "Timestamp", dataKey: "timestamp", dataType: "int" }
            ]
        }
    }, appComponents.Toolbar, appComponents.Grid, appComponents.Popup, appComponents.Form);


    startGrid.popup.onOpen(function () {
        setTimeout(function () {
            var catId = getCategoryIdFormValue();
            if (catId) {
                showButton(deleteBtnName, true);
            } else {
                showButton(deleteBtnName, false);
            }
        }, 10);
    });


    var deleteBtnName = "Delete";
    var deleteCategoryStartMsg = "This is permanent. Are you sure?";

    var onCategoryStartDeleted = function () {
        startGrid.refreshGrid();
        startGrid.popup.close();
        startGrid.form.clear();
        startGrid.grid.tableBody.focus();
        startView.refresh();
    }

    var deleteCategoryStartTime = function (catId, callback) {
        var categoryStart = cache.CategoryStart.podiumCategoryId[catId];
        if (categoryStart) {
            storage.CategoryStart.delete(categoryStart, callback);
        } else {
            callback();
        }
    }


    startGrid.popup.addButton(deleteBtnName, function () {
        app.confirm(deleteCategoryStartMsg, function () {
            var catId = getCategoryIdFormValue();
            deleteCategoryStartTime(catId, function () {
                onCategoryStartDeleted();
            });
        });
    });

    startGrid.toolbar.html.find(".button").hide();
    storage.CategoryStart.listen(startGrid, function () {
        startGrid.refreshGrid();
    });


    var getCategoryIdFormValue = function () {
        return startGrid.popup.body.find("input[name='podiumCategoryId']").val();
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