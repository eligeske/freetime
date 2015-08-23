var views = {
    ResultsByCategoryGrid: function (podiumCategoryObj, currentEvent, timing, Toolbar, Grid, callback) {
        var self = this;

        var Toolbar = Toolbar;
        var Grid = Grid;

        var timing = timing;
        var storage = currentEvent.storage;
        var cache = currentEvent.cache;
        var eventSettings = currentEvent.settings;

        var callback = callback;

        var podiumCategoryObj = podiumCategoryObj;
        var noLapCap = (!podiumCategoryObj.numberOfLaps || podiumCategoryObj.numberOfLaps == "");
        var mostLaps = (noLapCap) ? 0 : podiumCategoryObj.numberOfLaps;
        var html;
        var toolbar;
        var grid;
        var category;

        var ResultModel = function () {
            this.bib = "";
            this.rank = "";
            this.firstName = "";
            this.lastName = "";
            this.completedLaps = 0;
            this.overallHumanTime = "";
        };

        var __construct = function () {
            createHtml();
            createToolbar();
            
            addLaps();
            self.html = html;
            self.toolbar = toolbar;
            self.grid = grid;
        }

        var createHtml = function () {
            html = $("<div>");
        }

        var createToolbar = function () {
            toolbar = new Toolbar(podiumCategoryObj.name);
            html.append(toolbar.html);
        }

        var createGrid = function () {
            var gridSettings = {
                //selectable: true,
                rowKey: "racerId",
                name: podiumCategoryObj.name + "Grid",
                columns: [
                    { label: "Place", dataKey: "rank", width: 45, "class": "place-column" },
                    { label: "Bib", dataKey: "bib", width: 75, "class": "bib-column" },
                    //{ label: "F Name", dataKey: "firstName", "class": "fname-column" },
                    //{ label: "L Name", dataKey: "lastName", "class": "lname-column" },
                    //{ label: "Age", dataKey: "age", "class": "age-column" },
                    //{ label: "Team", dataKey: "team", "class": "team-column" }
                    {
                        label: "Team", dataKey: "racerId", width: 40, getValue: function (racerId) {
                            var racer = cache.Racer.id[racerId];
                            return (racer.teamMembers && racer.teamMembers.length) ? "yes" : "";
                        }
                    },
                    {
                        label: "Racer Name", dataKey: "racerId", getValue: function (racerId) {
                            var resultName = "";
                            var racer = cache.Racer.id[racerId];
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
                ]
            }

            for (var i = 1; i <= mostLaps; i++) {
                ResultModel.prototype["lap" + i] = "";
                gridSettings.columns.push({ dataKey: "lap" + i, label: "Lap " + i, "class": "lap-column" });
            }
            gridSettings.columns.push({ dataKey: "overallHumanTime", label: "total", "class": "total-column" });
            gridSettings.columns.push({ dataKey: "completedLaps", label: "#laps", "class": "laps-column" });
            grid = new Grid(gridSettings);
            html.append(grid.html);
        }

        var addLaps = function () {
            
            getResults(function (results) {
                createGrid();
                grid.loadData(results);
                callback();
            });
            
        }

        var getResults = function (callback) {
            var results = [];
            
            getLapAndRacerData(function (laps, racers) {
                new Promise(function (resolve, reject) {
                    try {
                        $.each(racers, function (i, racer) {
                            if (eventSettings.timingType == "single-start" && !cache.RacerStart.racerId[racer.id]) { return; }
                            var startTimestamp = (eventSettings.timingType == "single-start") ?
                                cache.RacerStart.racerId[racer.id].timestamp : cache.CategoryStart.podiumCategoryId[racer.podiumCategoryId].timestamp;
                            var res = new ResultModel();
                            res.racerId = racer.id;
                            res.bib = racer.bib;
                            res.firstName = racer.firstName;
                            res.lastName = racer.lastName;
                            res.age = racer.age;
                            res.team = racer.team;
                            var racerLaps = [];

                        

                            $.each(laps, function (ii, lap) {
                                if (lap.racerId == racer.id) {
                                    lap.lapNumber = (racerLaps.length) ? racerLaps.length + 1 : 1;                                
                                    if (!noLapCap && (lap.lapNumber > podiumCategoryObj.numberOfLaps)) { return; }
                                    var prevTimestamp = (lap.lapNumber == 1) ? startTimestamp : racerLaps[lap.lapNumber - 2].timestamp;
                                    lap.lapMS = lap.timestamp - prevTimestamp;

                                    res["lap" + lap.lapNumber] = timing.getReadableTime(lap.lapMS);
                                    racerLaps.push(lap);
                                    res.completedLaps++;
                                    //if (lap.lapNumber == podiumCategoryObj.numberOfLaps) {
                                    res["overallMS"] = lap.timestamp - startTimestamp;
                                    res["overallHumanTime"] = timing.getReadableTime(res["overallMS"]);
                                    //}
                                }
                            });

                            if (mostLaps < res.completedLaps) { mostLaps = res.completedLaps; }

                            results.push(res);
                        });
                    } catch (e) {
                        console.log(e);
                    }
                    // sort results
                    results.sort(function (a, b) {
                        var n = b.completedLaps - a.completedLaps;
                        if (n) {
                            return n;
                        }
                        return a.overallMS - b.overallMS
                    });

                    $.each(results, function (i, res) {
                        res.rank = (res.overallHumanTime != "DNF") ? i + 1 : "";
                    });

                    resolve(results);
                }).then(function (results) {
                    callback(results);
                });
            });
        }

        var getLapAndRacerData = function (callback) {
            storage.Racer.readMany("podiumCategoryId", podiumCategoryObj.id, function (racers) {
                var bibArray = lib.arrayOfValues(racers, "bib");
                storage.Lap.readMany("bib", bibArray, function (laps) {
                    callback(laps, racers);
                });
            });
        }


        __construct();

    }
}