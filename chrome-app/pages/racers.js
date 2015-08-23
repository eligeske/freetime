hidriv.loadPage(function (pageContEle, app) {

    $("body").attr("data-layout", "hasmenu");

    var appComponents = app.appComponents;
    var storage = app.currentEvent.storage;
    var cache = app.currentEvent.cache;
    var fileName = app.currentEvent.fileName;


    /************************/
    /*** SAVE & NEW *********/
    /************************/

    var snBtnText = "Save & New";
    var snReopenDelay = 200;
    var getSNHtml = function (snProp) {
        var snChb = $('<input />', { type: "checkbox" })
            .prop('checked', snProp.get())
            .change(function (e) { snProp.set(e.target.checked); });
        var snText = $('<span />', { text: snBtnText });
        var snCont = $('<span />')
            .append($('<label />').append(snChb, snText))
            .addClass('flag');
        return snCont[0];
    }


    var categorySNProp = (function () {
        var snCatDefaultVal = false;
        return { get: function () { return snCatDefaultVal; }, set: function (val) { snCatDefaultVal = val; } };
    })();
    var categorySNHtml = getSNHtml(categorySNProp);

    var racerSNProp = (function () {
        var snRacerDefaultVal = false;
        return { get: function () { return snRacerDefaultVal; }, set: function (val) { snRacerDefaultVal = val; } };
    })();
    var racerSNHtml = getSNHtml(racerSNProp);


    /************************/
    /*** LAYOUT     *********/
    /************************/

    var layout = new appComponents.Layout();
    
    var leftCol = layout.addColumn();
    var categoryGridCell = leftCol.addCell();
    categoryGridCell.setHeight(275);
    var racerGridCell = leftCol.addCell();    
    pageContEle.append(layout.html);
    
    /************************/
    /*** PODIUM CAT GRID ****/
    /************************/

    var checkIfCatNameExists = function (itemId, newName) {
        for (var cid in cache.PodiumCategory.id) {
            if (cache.PodiumCategory.id[cid].id != itemId &&
                (cache.PodiumCategory.id[cid].name + "").toLowerCase() === (newName + "").toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    var categoryGrid = new appComponents.EditorGrid({
        container: categoryGridCell.pad,
        title: "Categories",
        store: storage.PodiumCategory,
        saveCallback: function(actionType){
            if (actionType == "insert" && categorySNProp.get() == true) {
                setTimeout(function () { categoryGrid.popup.open(); }, snReopenDelay);
            }
        },
        gridSettings: {
            selectable: true,
            rowKey: "id",
            name: "catGrid",
            columns: [
                { label: "Id", dataKey: "id", hidden: true },
                { label: "Name", dataKey: "name" },
                { label: "# of Laps", dataKey: "numberOfLaps" }
            ]
        },
        popupSettings: { height: 140, width: 320 },
        formSettings: {
            fields: [
                    { label: "id", dataKey: "id", readonly: true, visible: false },
                    {
                        label: "Name", dataKey: "name", required: true, valid: function (formData) {
                            if (checkIfCatNameExists(formData.id, formData.name)) {
                                return "This category name already exists.";
                            }
                            return true;
                        }
                    },
                    { label: "# of Laps", dataKey: "numberOfLaps", dataType: "int" }
            ]
        }
    }, appComponents.Toolbar, appComponents.Grid, appComponents.Popup, appComponents.Form);


    categoryGrid.popup.onOpen(function () {
        setTimeout(function () {
            var cId = getCategoryIdFormValue();
            if (cId) {
                showCategoryButton(deleteBtnName, true);
                $(categorySNHtml).hide();
            } else {
                showCategoryButton(deleteBtnName, false);
                $(categorySNHtml).show();
            }
        }, 10);
    });

    
    var deleteBtnName = "Delete";
    var deleteCategoryMsg = "This is permanent. Are you sure?";
    var deleteCategoryFailedMsg1 = "Categories with a start time cannot be deleted, a start time must be deleted first.";
    var deleteCategoryFailedMsg2 = "Categories with Racers cannot be deleted, all Racers must be moved to a different Category first.";

    var onCategoryDeleted = function () {
        categoryGrid.refreshGrid();
        categoryGrid.popup.close();
        categoryGrid.form.clear();
        categoryGrid.grid.tableBody.focus();
    }

    var checkIfCategoryStarted = function (catId) {
        return !!cache.CategoryStart.podiumCategoryId[catId];
    }

    var checkIfAnyRacerAttached = function (catId) {
        var result = false;
        $.each(cache.Racer.id, function (id, racer) {
            if (racer.podiumCategoryId == catId) {
                result = true;
            }
        });
        return result;
    }

    var deleteCategory = function (catId, callback) {
        var category = cache.PodiumCategory.id[catId];
        if (category) {
            if (!checkIfCategoryStarted(catId)) {
                if (!checkIfAnyRacerAttached(catId)) {
                    app.confirm(deleteCategoryMsg, function () {
                        storage.PodiumCategory.delete(category, callback);
                    });
                } else {
                    app.messageBox(deleteCategoryFailedMsg2, callback);
                }
            } else {
                app.messageBox(deleteCategoryFailedMsg1, callback);
            }
        } else {
            callback();
        }
    }


    categoryGrid.popup.addButton(deleteBtnName, function () {
        var catId = getCategoryIdFormValue();
        deleteCategory(catId, function () {
            onCategoryDeleted();
        });
    });

    categoryGrid.popup.addButton(snBtnText, function () { });


    var getCategoryIdFormValue = function () {
        return categoryGrid.popup.body.find("input[name='id']").val();
    }

    var getCategoryButton = function (btnName) {
        return categoryGrid.popup.html.find('.button:contains("' + btnName + '")');
    }

    var showCategoryButton = function (btnName, bShow) {
        var btn = getCategoryButton(btnName);
        (bShow != null && bShow == false) ? btn.hide() : btn.show();
    };


    (function () {

        var catSNBtn = getCategoryButton(snBtnText);
        $(catSNBtn).replaceWith(categorySNHtml);

        var deleteBtn = getCategoryButton(deleteBtnName);
        deleteBtn.parent().prepend(deleteBtn);

    })();

    /************************/
    /*** RACER GRID *********/
    /************************/
    
    var getCategoryOptions = function (callback) {
        storage.PodiumCategory.readAll(function (data) {
            var options = [];
            $.each(data, function (i, dataRow) {
                options.push(lib.mapObject(dataRow, { "label": "name", "value": "id" }));
            });
            callback(options);
        });
    }
    var racerGrid = new appComponents.EditorGrid({
        container: racerGridCell.pad,
        title: "Racers",
        store: storage.Racer,
        saveCallback: function (actionType) {
            if (actionType == "insert" && racerSNProp.get() == true) {
                setTimeout(function () { racerGrid.popup.open(); }, snReopenDelay);
            }
        },
        beforeSaveCallback: function (formData, callback) {
            formData.teamMembers = getTeamMembersData();
            if (formData.id) {
                if (formData.bib != cache.Racer.id[formData.id].bib) {
                    getRacerLaps(formData.id, function (laps) {

                        var updateRacerLap = function (i) {
                            laps[i].bib = formData.bib;
                            storage.Lap.update(laps[i], function () {
                                i++;
                                if (i >= laps.length) {
                                    callback();
                                } else {
                                    updateRacerLap(i);
                                }
                            });
                        }

                        if (laps.length) {
                            updateRacerLap(0);
                        }

                    });
                } else {
                    callback();
                }
            } else {
                callback();
            }
        },
        refreshGrid: function (store, grid) {
            store.readAll(function (data) {
                data = _.sortBy(data, function (obj) { return parseInt(obj.bib); });
                grid.loadData(data,1);
            });
        },
        gridSettings: {
            selectable: true,
            rowKey: "id",
            name: "racerGrid",
            columns: [
                { label: "Id", dataKey: "id", hidden: true },
                { label: "Bib", dataKey: "bib", width: 75 },
                {
                    label: "Category", dataKey: "podiumCategoryId", width: 250, getValue: function (podiumCategoryId) {
                        return (podiumCategoryId)?cache.PodiumCategory.id[podiumCategoryId].name:"";
                    }
                },
                {
                    label: "Team", dataKey: "id", width: 40, getValue: function (rowId) {
                        var racer = cache.Racer.id[rowId];
                        return (racer.teamMembers && racer.teamMembers.length) ? "yes" : "";
                    }
                },
                {
                    label: "Name", dataKey: "id", getValue: function (rowId) {
                        var resultName = "";
                        var racer = cache.Racer.id[rowId];
                        if (racer.teamMembers && racer.teamMembers.length) {
                            resultName += (racer.team) ? (racer.team + " ") : "";
                            resultName += "(" + racer.teamMembers.join(", ") + ")";
                        } else {
                            resultName += (racer.firstName) ? (racer.firstName + " ") : "";
                            resultName += (racer.lastName) ? (racer.lastName + " ") : "";
                            resultName += ((resultName) ? (racer.team ? "- " : "") : "") + (racer.team || "");
                        }
                        return resultName;
                    }
                }
            ],
            paging: {
                size: 50, callback: function (pageNumber, grid) {
                    storage.Racer.readAll(function (data) {
                        data = _.sortBy(data, function (obj) { return parseInt(obj.bib); });
                        grid.loadData(data, pageNumber);
                    });
                }
            },
            search: {
                title: "BIB",
                callback: function (text, grid) {
                    if (text && text != "") {
                        storage.Racer.readMany("bib", text, function (data) {
                            data = _.sortBy(data, function (obj) { return parseInt(obj.bib); });
                            grid.loadData(data, 1);
                        });
                    } else {
                        storage.Racer.readAll(function (data) {
                            data = _.sortBy(data, function (obj) { return parseInt(obj.bib); });
                            grid.loadData(data, 1);
                        });
                    }
                }
            },
        },
        popupSettings: { height: 300, width: 320 },
        formSettings: {
            fields: [
                { label: "Id", dataKey: "id", readonly: true, hidden: true },
                {
                    label: "Bib", dataKey: "bib", required: true, valid: function (formData) {
                        if (cache.Racer.bib[formData.bib] && cache.Racer.bib[formData.bib].id != formData.id &&
                            cache.Racer.id[cache.Racer.bib[formData.bib].id].bib == formData.bib) {
                            return "This bib number is already assigned to another Racer.";
                        }
                        return true;
                    }
                },
                { label: "F Name", dataKey: "firstName" },
                { label: "L Name", dataKey: "lastName" },
                { label: "Age", dataKey: "age" },
                { label: "Team", dataKey: "team" },
                { label: "Category", dataKey: "podiumCategoryId", type: "select", getOptions: getCategoryOptions, required: true }
            ]
        }
    }, appComponents.Toolbar, appComponents.Grid, appComponents.Popup, appComponents.Form);
    

    racerGrid.toolbar.addButton("Print", function () {
        printByCatPopup.open();
    });

    
    racerGrid.popup.onOpen(function () {
        setTimeout(function () {

            addTeamMembersLogic();

            var id = getRacerIdFormValue();
            if (id) {
                $(racerSNHtml).hide();
                showRacerButton(deleteBtnName, true);

                var racer = app.currentEvent.cache.Racer.id[id];
                if (racer.teamMembers &&
                    racer.teamMembers instanceof Array &&
                    racer.teamMembers.length) {
                    setFormTeamMode();
                } else {
                    setFormRacerMode();
                }
            } else {
                $(racerSNHtml).show();
                showRacerButton(deleteBtnName, false);

                if (isAddTeamMode) {
                    setFormTeamMode();
                } else {
                    setFormRacerMode();
                }
            }
        }, 10);
    });



    var deleteBtnName = "Delete";
    var deleteRacerMsg1 = "This is permanent, all laps associated with this racer will be set to blank. Are you sure?";
    var deleteRacerMsg2 = "This racer has a start time already, are you sure you want to delete this racer?";

    var onRacerDeleted = function () {
        racerGrid.refreshGrid();
        racerGrid.popup.close();
        racerGrid.form.clear();
        racerGrid.grid.tableBody.focus();
    }

    var checkIfStartTimeExists = function (racerId) {
        return !!cache.RacerStart.racerId[racerId];
    }

    var getRacerLaps = function (racerId, callback) {
        storage.Lap.readMany("racerId", racerId, function (data) {
            callback(data);
        });
    }
    var getRacerLapsByBib = function (bib, callback) {
        storage.Lap.readMany("bib", bib, function (data) {
            callback(data);
        });
    }

    var setLapsToNoRacer = function (laps, callback) {
        var updateLap = function (lap) {
            i++;
            lap.racerId = ''; lap.bib = '';
            storage.Lap.update(lap, function () {
                if (i < laps.length) {
                    updateLap(laps[i]);
                } else {
                    callback();
                }
            });
        }
        var i = 0;
        if (laps && laps.length) {
            updateLap(laps[i]);
        }
    }

    var deleteRacerStartTime = function (racerId, callback) {
        var racerStart = cache.RacerStart.racerId[racerId];
        if (racerStart) {
            storage.RacerStart.delete(racerStart, callback);
        } else {
            callback();
        }
    }

    var deleteRacer = function (racerId, callback) {
        var racer = cache.Racer.id[racerId];
        if (racer) {
            var deleteRacer = function () { storage.Racer.delete(racer, callback); };
            getRacerLaps(racer.id, function (laps) { 
                if (laps.length) {
                    setLapsToNoRacer(laps, function () {
                        deleteRacer();
                    });
                } else {
                    deleteRacer();
                }
            });
        } else {
            callback();
        }
    }

    racerGrid.popup.addButton(deleteBtnName, function () {

        app.confirm(deleteRacerMsg1, function () {
            var id = getRacerIdFormValue();
            var startTimeExists = checkIfStartTimeExists(id);
            if (startTimeExists) {
                app.confirm(deleteRacerMsg2, function () {

                    deleteRacerStartTime(id, function () {
                        deleteRacer(id, function () {
                            onRacerDeleted();
                        });
                    });

                });
            } else {

                deleteRacer(id, function () {
                    onRacerDeleted();
                });

            }
        });

    });

    racerGrid.popup.addButton(snBtnText, function () { });
    
    storage.PodiumCategory.listen(racerGrid, function () {
        racerGrid.refreshGrid();
    });

    storage.Racer.listen(racerGrid, function (data, type) {
        if (type == storage.changeTypes.insert) {
            getRacerLapsByBib(data.bib, function (laps) {
                var updateRacerLap = function (i) {
                    laps[i].racerId = data.id;
                    storage.Lap.update(laps[i], function () {
                        i++;
                        if (i < laps.length) {
                            updateRacerLap(i);
                        }
                    });
                }
                if (laps.length) {
                    updateRacerLap(0);
                }
            });
        }
    });

    
    var getRacerIdFormValue = function () {
        return racerGrid.popup.body.find("input[name='id']").val();
    }

    var getRacerButton = function (btnName) {
        return racerGrid.popup.html.find('.button:contains("' + btnName + '")');
    }

    var showRacerButton = function (btnName, bShow) {
        var btn = getRacerButton(btnName);
        (bShow != null && bShow == false) ? btn.hide() : btn.show();
    }

    var getRacerGridButton = function (btnName) {
        return racerGrid.toolbar.html.find('.button:contains("' + btnName + '")');
    }


    var getFieldByKey = function (dataKey) {
        return racerGrid.popup.body.find("input, select").filter("[name='" + dataKey + "']").parent();
    }

    var getFieldByInputDataId = function (dataId) {
        return racerGrid.popup.body.find("[data-id='" + dataId + "']").parent();
    }

    var showFields = function (keyList) {
        $.each(keyList, function (i, key) {
            getFieldByKey(key).show();
        });
    }

    var hideFields = function (keyList) {
        $.each(keyList, function (i, key) {
            getFieldByKey(key).hide();
        });
    }

    var showFieldsByDataId = function (dataIdList) {
        $.each(dataIdList, function (i, dataId) {
            getFieldByInputDataId(dataId).show();
        });
    }

    var hideFieldsByDataId = function (dataIdList) {
        $.each(dataIdList, function (i, dataId) {
            getFieldByInputDataId(dataId).hide();
        });
    }

    var getRacerFormHtml = function () {
        return racerGrid.popup.body.find('.form');
    }

    var putAdjacentFieldsInOrder = function (key1, key2) {
        var fields = getRacerFormHtml().children();
        var field1 = getFieldByKey(key1);
        var field2 = getFieldByKey(key2);
        var dif = fields.index(field1) - fields.index(field2);
        if (dif == 1) {
            field1.insertBefore(field1.prev());
        }
    }

    var changeFieldLabel = function (key, newLabelText) {
        var label = getFieldByKey(key).find('label').first();
        label.text(newLabelText);
    }

    

    var isAddTeamMode = false;

    var setFormRacerMode = function () {
        showFields(['firstName', 'lastName', 'age']);
        hideFieldsByDataId(['addMore', 'teamMembers']);
        putAdjacentFieldsInOrder('team', 'podiumCategoryId');
        changeFieldLabel('team', 'Team');
        racerGrid.popup.body.removeClass('scrollable');
    }
    var setFormTeamMode = function () {
        hideFields(['firstName', 'lastName', 'age']);
        showFieldsByDataId(['addMore', 'teamMembers']);
        putAdjacentFieldsInOrder('podiumCategoryId', 'team');
        changeFieldLabel('team', 'Team Name');
        racerGrid.popup.body.addClass('scrollable');
    }
    
    // returns array of string extracted from form
    var getTeamMembersData = function () {
        return $.makeArray(racerGrid.popup.body
            .find('[data-id="teamMembers"]')
            .map(function (i, item) { return $(item).val().trim(); })
            .filter(function (i, item) { return !!item; }));
    }

    // returns array of string from model (for edit)
    var getTeamMembersDataFromModel = function () {
        var id = getRacerIdFormValue();
        if (id) {
            return cache.Racer.id[id].teamMembers || [];
        }
        return [];
    }



    var addTeamMembersLogic = function () {

        // default number of team member fields
        var defaultTeamMembersNumber = 3;

        var teamMemberList = getTeamMembersDataFromModel();
        var teamMembersNumber = (teamMemberList.length > defaultTeamMembersNumber) ? teamMemberList.length : defaultTeamMembersNumber;


        var saveBtn = getRacerButton("Save");
        var teamMembersCount = 0;
        var createTeamMemberField = function (value) {
            var value = value || "";
            teamMembersCount++;
            var teamMemberField = $('<div />', {
                    'class': "field-row"
                }).append(
                    $('<label />', { text: "Racer " + teamMembersCount }),
                    $('<input />', { 'data-id': "teamMembers", type: "text" })
                        .val(value)
                        .keypress(function (e) { if (e.which == 13) { saveBtn.click(); } })
                );
            teamMemberField.insertBefore(addMoreLinkField);
            teamMemberField.find('input').focus();
            racerGrid.popup.body[0].scrollTop = racerGrid.popup.body[0].scrollHeight;
        }

        var addMoreLinkField = $('<div />', {
            'class': "field-row"
        }).append(
            $('<label />'),
            $('<label />', { 'data-id': "addMore", 'class': "link", text: "+ Add More" })
                .click(function () {
                    createTeamMemberField();
                })
        );

        getRacerFormHtml().append(addMoreLinkField);
        for (var i = 0; i < teamMembersNumber; i++) {
            var value = teamMemberList.length > i ? teamMemberList[i] : "";
            createTeamMemberField(value);
        }

        addMoreLinkField.hide();
        hideFieldsByDataId(['teamMembers']);
    };



    (function () {

        var addBtnText = "+Add";
        var addRacerBtnText = "+Racer";
        var addTeamBtnText = "+Team";
        
        getRacerGridButton(addBtnText).hide();

        racerGrid.toolbar.addButton(addRacerBtnText, function () {
            isAddTeamMode = false;
            racerGrid.popup.open();
        });
        racerGrid.toolbar.addButton(addTeamBtnText, function () {
            isAddTeamMode = true;
            racerGrid.popup.open();
        });


        var racerSNBtn = getRacerButton(snBtnText);
        $(racerSNBtn).replaceWith(racerSNHtml);

        var deleteBtn = getRacerButton(deleteBtnName);
        deleteBtn.parent().prepend(deleteBtn);

    })();



    /*****************************************/
    /****** PRINT BY CAT POPUP ***************/
    /*****************************************/

    var allCatsRowKey = "all-categories";

    var openEventClick = function (rowKey) {
        //printByCatPopup.close();
        var printUrl = "../html/racers-print.html?fileName=" + fileName + "&printType=";
        if (rowKey === allCatsRowKey) {
            printUrl += racersPrintType.all;
        } else {
            printUrl += racersPrintType.byCategory + "&categoryId=" + rowKey;
        }
        window.open(printUrl, "_blank");
    }

    var selectCatGrid = new app.appComponents.Grid({
        selectable: "single",
        rowKey: "id",
        columns: [
            { label: "Id", dataKey: "id", hidden: true },
            { label: "Print Racers (dbl click row)", dataKey: "name", onDblClick: openEventClick }
        ]
    });

    var printByCatPopup = new app.appComponents.Popup({
        height: 200, width: 365
    });

    var refreshCatList = function () {
        storage.PodiumCategory.readAll(function (categories) {
            selectCatGrid.clear();
            selectCatGrid.addRow({ id: allCatsRowKey, name: "All Categories" });
            $.each(categories, function (i, category) {
                selectCatGrid.addRow({ id: category.id, name: category.name });
            });
        });
    }

    selectCatGrid.divBody.height(140);
    printByCatPopup.onOpen(function () {
        refreshCatList();
    });

    printByCatPopup.body.append(selectCatGrid.html);
    printByCatPopup.addButton("Close", function () {
        printByCatPopup.close();
    });





   
    // RESIZE APP COMPONENTS
    layout.resize();
    categoryGrid.grid.size();
    racerGrid.grid.size();

});