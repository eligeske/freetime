




var logoSrc = "../imgs/hidriv_logo.png";
$(document).ready(function () {
   
    var lib = new Lib();
    var timing = new Timing();
    var appComponents = new AppComponents();
    var fileName = lib.getURLParam("fileName");
    //var printByEnum = lib.getURLParam("printByEnum");
    var printType = lib.getURLParam("printType");
    var printAll = printType == racersPrintType.all;
    var categoryId = printType == racersPrintType.byCategory ? (lib.getURLParam("categoryId") + "") : null;
    var cache = DataTemplate.cacheTemplate;
    var eventTemplate = DataTemplate.eventTemplate;
    var storage;

    var domFileStorage = new DOMFileStorageExt(function (storage) {
        domFileStorage = storage;
        domFileStorage.readEvent(fileName, function (fileContents) {
            var ev = JSON.parse(fileContents);
            storage = new MemoryStorage(ev.storage, ev.model, ev.primaryKey, cache, function () { });
            
            var currentEvent = new Event(ev, cache, domFileStorage, eventTemplate);
            
            var getCategoryName = function (cid) { return currentEvent.cache.PodiumCategory.id[cid].name; };

            var toolbarTitle = (categoryId) ? getCategoryName(categoryId) : "All Categories";
            var toolbar = new appComponents.Toolbar(toolbarTitle);

            var grid = new appComponents.Grid({
                selectable: true,
                rowKey: "id",
                columns: [
                    { label: "Bib", dataKey: "bib", width: 75 },
                    {
                        label: "Category", dataKey: "podiumCategoryId", width: 250, getValue: function (podiumCategoryId) {
                            return (podiumCategoryId) ? getCategoryName(podiumCategoryId) : "";
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
                            var racer = currentEvent.cache.Racer.id[rowId];
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
            });

            var addGridRow = (categoryId !== null) ?
                function (racer) {
                    if (categoryId === (racer.podiumCategoryId + "")) {
                        grid.addRow(racer);
                    }
                } : function (racer) {
                    grid.addRow(racer);
                };
            grid.clear();
            $.each(currentEvent.cache.Racer.bib, function (i, racer) {
                addGridRow(racer);
            });
            

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
            $("title").html("Racer List - hidriv timing");

            $("#print_cont").append(toolbar.html);
            $("#print_cont").append(grid.html);
            $(".toolbar").append($("<img>", { src: logoSrc, "class": "print-logo" }));
        });
    });

});