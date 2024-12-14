var Application = function () {
  var self = this; // exposed to external pages
  var _self = {}; // exposed to inner pages
  var pageCont = $("#page_cont");
  var topBar = {
    min: $("#window_minimize"),
    max: $("#window_maximize"),
    close: $("#window_close"),
    title: $("#event_name"),
  };
  var startMenu = {
    single: $("#menu_single_start"),
    category: $("#menu_category_start"),
  };
  var userSettingsFileName = "hidriv_user.settings";
  var applicationSettings;
  var appComponents = new AppComponents();
  var routing;
  var domFileStorage;
  var Storage = MemoryStorage;
  var timing = new Timing();
  var notifications;
  var importFileTypes = {
    json: ".json",
    csv: ".csv",
  };

  _self.eventTypes = [
    // do not reorder, used in setMenu
    {
      name: "Wave Start | One or More Podiums",
      id: "multi-group-start",
      description:
        "Racers start and tracked by podium category. You can start one podium category or choose how many will start at the same time. Overall results and individual podium category results are tracked.",
    },
    {
      name: "Time Trial | One or More Podiums",
      id: "single-start",
      description:
        "One racer starts at a time. Results are tracked either by podium category and overall.",
    },
  ];
  _self.appThemes = [
    { id: "dark-css", name: "Dark" },
    { id: "light-css", name: "Light" },
  ];
  var dataTemplate = DataTemplate;
  var eventTemplate = dataTemplate.eventTemplate;
  var eventCacheTemplate = dataTemplate.cacheTemplate;

  var __construct = function () {
    createDOMFileStorage(function () {
      createRouting();

      _self.getCurrentEvent = getCurrentEvent;
      _self.ApplicationSettings = ApplicationSettings;
      _self.loadAppThemeById = loadAppThemeById;
      _self.applyAppTheme = applyAppTheme;
      _self.appComponents = appComponents;
      _self.createEvent = createEvent;
      _self.listEvents = listEvents;
      _self.openEvent = openEvent;
      _self.closeEvent = closeEvent;
      _self.exportEvent = exportEvent;
      _self.importEvent = importEvent;
      _self.deleteEvent = deleteEvent;
      _self.eventNameExists = eventNameExists;
      _self.importCategoriesCSV = importCategoriesCSV;
      _self.importRacersCSV = importRacersCSV;
      _self.timing = timing;
      _self.topBar = topBar;
      _self.routing = routing;

      self.openEvent = openEvent;
      self.closeEvent = closeEvent;
      self.currentEvent = _self.currentEvent;
      self.appComponents = appComponents;
      self.lib = lib;
      self.timing = timing;
      self.domFileStorage = domFileStorage;
      self.loadPage = loadPage;

      notifications = new Notifications(self);

      routing.loadEntry();

      loadAppTheme();
    });
  };

  /********************************/
  /***** EVENTS  ******************/
  /********************************/

  /********************************/
  /***** ACTIONS  *****************/
  /********************************/

  /********************************/
  /***** METHODS  *****************/
  /********************************/

  // storage
  var createDOMFileStorage = function (callback) {
    domFileStorage = new DOMFileStorageExt(function (storage) {
      domFileStorage = storage;
      callback();
    });
  };

  // user settings
  var loadUserSettings = function (callback) {
    domFileStorage.checkIfSettingsFileExists(
      userSettingsFileName,
      function (exists) {
        var us = new UserSettings();
        if (exists) {
          domFileStorage.readUserSettings(
            userSettingsFileName,
            function (fileContents) {
              $.extend(us, JSON.parse(fileContents));
              callback(us);
            }
          );
        } else {
          callback(us);
        }
      }
    );
  };
  var loadAppThemeById = function (appThemeId) {
    var themes = $.grep(_self.appThemes, function (item) {
      return item.id == appThemeId;
    });
    _self.currentTheme = themes.length ? themes[0] : {};
    self.lib.loadCss("../css/" + appThemeId + ".css", "cssTheme");
  };
  var loadAppTheme = function () {
    loadUserSettings(function (us) {
      var id = us && us.appThemeId ? us.appThemeId : _self.appThemes[0].id;
      loadAppThemeById(id);
    });
  };
  var applyAppTheme = function (appThemeId) {
    loadUserSettings(function (us) {
      us.appThemeId = appThemeId;
      domFileStorage.writeUserSettings(
        userSettingsFileName,
        JSON.stringify(us),
        function () {
          loadAppThemeById(appThemeId);
        }
      );
    });
  };
  // routing
  var createRouting = function () {
    routing = new Routing(_self);
  };
  var loadPage = function (callback) {
    pageCont.html("");
    callback(pageCont, _self);
  };
  // events
  var createEvent = function (name, date, timingType, callback) {
    var callback = callback ? callback : function () {};
    var ev = {};
    $.extend(ev, eventTemplate);
    ev.settings.name = name;
    ev.settings.date = date;
    ev.settings.timingType = timingType;

    domFileStorage.writeEvent(name, JSON.stringify(ev), function () {
      callback();
    });
  };
  var openEvent = function (name, callback) {
    var callback = callback ? callback : function () {};
    var fileName = name;
    domFileStorage.readEvent(
      fileName,
      function (fileContents) {
        _self.currentEvent = new Event(
          JSON.parse(fileContents),
          eventCacheTemplate,
          domFileStorage,
          eventTemplate
        );
        self.currentEvent = _self.currentEvent;

        //var ev = JSON.parse(fileContents);
        //var c = {}; $.extend(c, eventCacheTemplate);
        //_self.currentEvent.fileName = fileName;
        //_self.currentEvent.cache = c;
        //_self.currentEvent.settings = ev.settings;
        //_self.currentEvent.storage = new Storage(ev.storage, ev.model, ev.primaryKey, c, function () {
        //    domFileStorage.writeFile(fileName, JSON.stringify(ev), function (data) {
        //        //console.log(JSON.parse(data));
        //    });
        //});
        callback();
        setStartMenu();
      },
      function () {}
    );
  };
  var closeEvent = function () {
    _self.currentEvent = null;

    routing.loadEntry();
    topBar.title.html("");
  };
  var deleteEvent = function (name, callback) {
    domFileStorage.removeEvent(name, function () {
      callback();
    });
  };
  var listEvents = function (callback) {
    domFileStorage.listEvents(callback);
  };
  var eventNameExists = function (name, callback) {
    var exists = false;
    listEvents(function (fileEntryList) {
      $.each(fileEntryList, function (i, fileEntry) {
        if (name == fileEntry.name) {
          exists = true;
        }
      });
      callback(exists);
    });
  };
  var getCurrentEvent = function () {
    return _self.currentEvent;
  };
  var exportEvent = function (fileName, callback) {
    var fileName = fileName;
    domFileStorage.readEvent(
      fileName,
      function (fileContents) {
        var mimeType = "application/json";
        var link = document.createElement("a");
        link.setAttribute("download", fileName + ".json");
        link.setAttribute(
          "href",
          "data:" +
            mimeType +
            ";charset=utf-8," +
            encodeURIComponent(fileContents)
        );
        link.click();
        callback();
      },
      function () {}
    );
  };
  var importEvent = function (callback) {
    importFileAsString(importFileTypes.json, function (fileInfo) {
      try {
        var json = JSON.parse(fileInfo.content);
        var name = json.settings.name;
        eventNameExists(name, function (bool) {
          if (bool) {
            self.lib.confirm(
              "READ CAREFULLY!!!! An event with the name of " +
                name +
                " already exists. If you import this file the existing event will be overwritten. <br/> Do you want to overwrite?",
              function (confirmBool) {
                if (confirmBool) {
                  domFileStorage.writeEvent(
                    name,
                    fileInfo.content,
                    function () {
                      callback();
                    }
                  );
                } else {
                  self.lib.alert("File did not import.");
                  callback();
                }
              },
              { height: 200, width: 350 }
            );
          } else {
            domFileStorage.writeEvent(name, fileInfo.content, function () {
              callback();
            });
          }
        });
      } catch (Exception) {
        self.lib.alert(
          "File did not load. Check to make sure this is a race file and try again. If not, then the file may be corrupted. No worries though, shoot us a message on Facebook we will recover the file for you :)",
          15000
        );
        callback();
      }
    });
  };

  // CSV import
  var importCategoriesCSV = function (callback) {
    var categoryModelTemplate = _self.currentEvent.model.PodiumCategory;
    var categoriesCache = _self.currentEvent.cache.PodiumCategory.id;
    var insertAction = _self.currentEvent.storage.PodiumCategory.insert;

    var existentCategories = [];
    $.each(categoriesCache, function (key, category) {
      existentCategories.push(category);
    });

    var categoryImportKeys = {
      Name: {
        dataKey: "name",
        displayName: "Category Name",
        required: true,
        unique: true,
      },
      Laps: { dataKey: "numberOfLaps", displayName: "Number of Laps" },
    };

    var instructionTextHtml =
      "Upload instructions:<br/>" +
      "- Required fields will fail the import<br/>" +
      "- Duplicate records will fail the import<br/><br/>" +
      "Continue?";

    var validationCallback = function (model) {
      return null;
    };

    var exampleImageSrc = "../imgs/import/categories_csv_screen.png";
    var imageText = "Categories import CSV file example";
    openImagePreviewPopup(exampleImageSrc, imageText, function () {
      importCSV(
        instructionTextHtml,
        categoryImportKeys,
        categoryModelTemplate,
        existentCategories,
        validationCallback,
        insertAction,
        callback
      );
    });
  };

  var importRacersCSV = function (callback) {
    var racerModelTemplate = _self.currentEvent.model.Racer;
    var racersCache = _self.currentEvent.cache.Racer.id;
    var insertAction = _self.currentEvent.storage.Racer.insert;

    var existentRacers = [];
    $.each(racersCache, function (key, racer) {
      existentRacers.push(racer);
    });

    var categoriesCache = _self.currentEvent.cache.PodiumCategory.id;
    var existentCategoryHt = {};
    $.each(categoriesCache, function (key, category) {
      existentCategoryHt[(category.name + "").toLowerCase()] = category.id;
    });

    var racerImportKeys = {
      Bib: { dataKey: "bib", displayName: "Bib", required: true, unique: true },
      "First Name": { dataKey: "firstName", displayName: "First Name" },
      "Last Name": { dataKey: "lastName", displayName: "Last Name" },
      Category: {
        dataKey: "categoryName",
        displayName: "Category Name",
        required: true,
      },
      Age: { dataKey: "age", displayName: "Age" },
      Team: { dataKey: "team", displayName: "Team" },
    };

    var instructionTextHtml =
      "Upload instructions:<br/>" +
      "- Recommend uploading categories first<br/>" +
      "- Required fields will fail the import<br/>" +
      "- Duplicate records will fail the import<br/>" +
      "- Unknown categories will fail the import.<br/><br/>" +
      "Continue?";

    var validationCallback = function (model) {
      if (model.categoryName != null) {
        var key = (model.categoryName + "").toLowerCase();
        if (existentCategoryHt[key] == null) {
          return { categoryName: "Category does not exists." };
        }
        model["podiumCategoryId"] = existentCategoryHt[key];
      }
      delete model["categoryName"];
      delete model["gender"]; // TODO: gender is not used. correct dataTemplate.js
      return null;
    };

    var exampleImageSrc = "../imgs/import/racers_csv_screen.png";
    var imageText = "Racers import CSV file example";
    openImagePreviewPopup(exampleImageSrc, imageText, function () {
      importCSV(
        instructionTextHtml,
        racerImportKeys,
        racerModelTemplate,
        existentRacers,
        validationCallback,
        insertAction,
        callback
      );
    });
  };

  var importCSV = function (
    instructionTextHtml,
    importKeys,
    modelTemplate,
    existentJsonList,
    validationCallback,
    insertAction,
    callback
  ) {
    var removeQuotes = function (val) {
      var quotedRE = /^"(.*)"$/gi;
      if (quotedRE.test(val)) {
        val = val.substr(1, val.length - 2);
        val = val.replace(/""/gi, '"');
      }
      return val;
    };

    var getValuesFromLine = function (line) {
      var resultList = [];
      line = (line + "").trim();
      var values = line.split(",");
      for (var i = 0; i < values.length; i++) {
        var getValRE = function () {
          return /^[^"]*("(([^"]?)|("")){1,}")*$/gi;
        };
        if (getValRE().test(values[i])) {
          resultList.push(removeQuotes(values[i]));
        } else {
          var isStrValid = false;
          var str = values[i];
          var j = i + 1;
          while (j < values.length) {
            str += "," + values[j];
            if (getValRE().test(str)) {
              isStrValid = true;
              resultList.push(removeQuotes(str));
              i = j;
              break;
            }
            j++;
          }
          if (!isStrValid) {
            return null;
          }
        }
      }
      return resultList;
    };

    var errorMsgEnum = {
      duplicateValues: "There are duplicate values.",
      malformattedFile: "Malformatted CSV file.",
      malformattedRow: "Malformatted CSV row.",
      invalidRow: "One of the rows is invalid.",
      unknownError: "Cannot handle the file.",
      noRecords: "File has no records.",
    };
    var getMissingHeadersErrorMsg = function (mhStr) {
      return mhStr + " missing or incorrectly spelled.";
    };
    var getDuplicatedValueErrorMsg = function (label) {
      return "Duplicated " + (label + "").toLowerCase() + ".";
    };
    var getMissingValueErrorMsg = function (label) {
      var result = label + "";
      return result[0]
        ? result[0].toUpperCase() +
            result.toLowerCase().substr(1, result.length - 1) +
            " is missing."
        : "";
    };

    var convertToJsonAndSave = function (fileInfo) {
      var fileName = fileInfo.name;
      var csvString = fileInfo.content;

      if (!csvString) {
        self.lib.alert(errorMsgEnum.malformattedFile);
        return;
      }

      var lines = (csvString + "").split("\n");
      if (!lines.length) {
        self.lib.alert(errorMsgEnum.malformattedFile);
        return;
      }

      var headers = getValuesFromLine(lines[0]);
      if (!headers) {
        self.lib.alert(errorMsgEnum.malformattedFile);
        return;
      }

      var isTotallyValid = true;
      var itemList = [];
      var headerKeys = [];
      var missingHeaders = [];
      var missingRequiredFields = [];
      var uniquePropHt = {};
      var importKeysLCase = {};

      // check for missing headers and init the unique property hash table
      $.each(importKeys, function (key, columnSettings) {
        importKeysLCase[(key + "").toLowerCase()] = columnSettings;

        var matches = $.grep(headers, function (header) {
          return (header + "").toLowerCase() === (key + "").toLowerCase();
        });
        var keyInd =
          matches && matches instanceof Array && matches.length
            ? headers.indexOf(matches[0])
            : -1;

        if (keyInd < 0) {
          missingHeaders.push(key);
          if (columnSettings.required) {
            isTotallyValid = false;
            missingRequiredFields.push(columnSettings.displayName);
          }
        } else {
          headerKeys[keyInd] = columnSettings.dataKey;
          if (columnSettings.unique) {
            uniquePropHt[columnSettings.dataKey] = {};
          }
        }
      });
      var missingHeadersErrorStr = "";
      if (missingHeaders.length) {
        missingHeaders = $.makeArray(
          $(missingHeaders).map(function (i, item) {
            return '"' + item + '"';
          })
        );
        var mhStr = missingHeaders.join(", ");
        missingHeadersErrorStr = getMissingHeadersErrorMsg(mhStr);
      }
      var missingRequiredFieldsErrorStr = "";
      if (missingRequiredFields.length) {
        missingRequiredFields = $.makeArray(
          $(missingRequiredFields).map(function (i, item) {
            return getMissingValueErrorMsg(item);
          })
        );
        missingRequiredFieldsErrorStr = missingRequiredFields.join(" ");
      }

      // create grid and fill its header
      var csvRowValueKey = "csvRow";
      var csvRowValidationMsgKey = "csvValidation";
      var gridHeaderRowData = $.makeArray(
        $(headers).map(function (i, item) {
          var key = headerKeys[i] ? headerKeys[i] : headers[i];
          return { value: headers[i], dataKey: key };
        })
      );

      var grid = (function (headerRowDataArray, headerErrorMsg) {
        // headerRowDataArray: [{value:"",dataKey:""},]
        var gridSettings = {
          selectable: false,
          rowKey: "id",
          columns: [
            {
              label: fileName,
              dataKey: csvRowValueKey,
              class: "csv-row-value",
            },
          ],
        };
        $.each(headerRowDataArray, function (i, headerRowData) {
          gridSettings.columns.push({
            label: headerRowData.value,
            dataKey: headerRowData.dataKey,
            class: "json-value",
          });
        });
        gridSettings.columns.push({
          label: headerErrorMsg || "",
          dataKey: csvRowValidationMsgKey,
          class: "csv-row-validation",
        });
        return new appComponents.Grid(gridSettings);
      })(gridHeaderRowData, missingHeadersErrorStr);

      var addRow = function (csvRowValue, rowDataArray, rowErrorMessage) {
        // rowDataArray: [{value:"",dataKey:"",errorMsg:""},]
        if (
          rowErrorMessage ||
          $.grep(rowDataArray, function (rowData) {
            return !!rowData.errorMsg;
          }).length > 0
        ) {
          isTotallyValid = false;
        }
        var row = {};
        var errorMsg = "";
        var invalidCellIndices = [];
        $.each(rowDataArray, function (i, rowData) {
          row[rowData.dataKey] = rowData.value;
          if (rowData.errorMsg) {
            errorMsg += rowData.errorMsg + " ";
            invalidCellIndices.push(i + 1); // consider csvRowValue column
          }
        });
        row[csvRowValueKey] = csvRowValue;
        row[csvRowValidationMsgKey] =
          errorMsg +
          (rowErrorMessage ? " " + rowErrorMessage : "") +
          missingRequiredFieldsErrorStr;
        grid.addRow(row);

        var cellsHtml = grid.tableBody.find("tr").last().find("td");
        $.each(invalidCellIndices, function (i, cellIndex) {
          var cell = cellsHtml.eq(cellIndex);
          if (!cell.hasClass("invalid")) {
            cell.addClass("invalid");
          }
        });
      };

      var removeRows = function () {
        grid.clear();
      };

      // fill unique property hash table with existent data values
      $.each(existentJsonList, function (i, json) {
        $.each(uniquePropHt, function (key, htProp) {
          if (json[key]) {
            htProp[(json[key] + "").toLowerCase()] = i;
          }
        });
      });

      // parse file lines, convert to json; data validation; fill grid
      if (lines.length > 1) {
        removeRows();
      }
      for (var j = 1; j < lines.length; j++) {
        var item = $.extend(true, {}, modelTemplate);
        var values = getValuesFromLine(lines[j]);
        if (values && values.length == headers.length) {
          var gridRowData = [];
          var isRowValid = true;
          for (var i = 0; i < values.length; i++) {
            var gridCellData = { value: values[i], dataKey: "", errorMsg: "" };
            if (headerKeys[i]) {
              var columnSettings =
                importKeysLCase[(headers[i] + "").toLowerCase()];
              if (columnSettings.required && !values[i]) {
                isRowValid = false;
                gridCellData.errorMsg = getMissingValueErrorMsg(
                  columnSettings.displayName
                );
              } else {
                if (columnSettings.unique) {
                  if (
                    uniquePropHt[headerKeys[i]][
                      (values[i] + "").toLowerCase()
                    ] == null
                  ) {
                    uniquePropHt[headerKeys[i]][
                      (values[i] + "").toLowerCase()
                    ] = i;
                  } else {
                    isRowValid = false;
                    gridCellData.errorMsg = getDuplicatedValueErrorMsg(
                      columnSettings.displayName
                    );
                  }
                }
                item[headerKeys[i]] = values[i];
              }
              gridCellData.dataKey = headerKeys[i];
            } else {
              gridCellData.dataKey = gridHeaderRowData[i].dataKey;
            }
            gridRowData.push(gridCellData);
          }

          var errorMsgs = validationCallback(item); // validation callback can take item as out-parameter
          if (errorMsgs) {
            $.each(gridRowData, function (i, cellData) {
              if (errorMsgs[cellData.dataKey]) {
                cellData.errorMsg +=
                  (cellData.errorMsg ? " " : "") + errorMsgs[cellData.dataKey];
                isRowValid = false;
              }
            });
          }

          if (isRowValid) {
            itemList.push(item);
          }
          addRow(lines[j], gridRowData, "");
        } else {
          addRow(lines[j], [], errorMsgEnum.malformattedRow);
        }
      }

      // save json array to storage callback
      var saveCallback = function () {
        if (itemList.length) {
          var ind = 0;
          var insertItem = function (item) {
            insertAction(item, function () {
              ind++;
              if (ind < itemList.length) {
                insertItem(itemList[ind]);
              } else {
                callback();
              }
            });
          };
          insertItem(itemList[ind]);
        }
      };

      // open import preiew popup
      var buttonNames = {
        import: "Import",
        cancel: "Cancel",
      };
      var popup = new appComponents.Popup({
        height: 500,
        width: 600,
      });

      popup.body.append(grid.html);
      grid.divBody.height(438);
      popup.onOpen(function () {
        setTimeout(function () {
          grid.size();
          if (grid.html.height() > popup.body.height()) {
            grid.divBody.height(
              grid.divBody.height() - grid.html.height() + popup.body.height()
            );
          }
        }, 200);
      });
      popup.addButton(buttonNames.cancel, function () {
        popup.close();
      });
      popup.addButton(buttonNames.import, function () {
        if (isTotallyValid) {
          saveCallback();
          popup.close();
        }
      });

      var enableButton = function (btnName, enable) {
        var btn = popup.html.find('.button:contains("' + btnName + '")');
        enable
          ? btn.removeClass("inactive")
          : btn.hasClass("inactive")
          ? false
          : btn.addClass("inactive");
      };

      popup.open();
      enableButton(buttonNames.import, isTotallyValid && itemList.length);
    };

    self.lib.confirm(
      instructionTextHtml,
      function (confirmed) {
        if (confirmed) {
          importFileAsString(importFileTypes.csv, function (fileInfo) {
            try {
              convertToJsonAndSave(fileInfo);
            } catch (exception) {
              console.log(exception);
              self.lib.alert(errorMsgEnum.unknownError);
            }
          });
        }
      },
      { width: 300, height: 200 }
    );
  };

  // file import
  var importFileAsString = function (fileType, callback) {
    var fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.setAttribute("accept", fileType);
    fileInput.addEventListener("change", function (e) {
      // Put the rest of the demo code here.
      var file = fileInput.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        var fileInfo = {
          name: file.name,
          content: reader.result,
        };
        callback(fileInfo);
      };
      reader.readAsText(file);
    });
    fileInput.click();
  };

  // image preview
  var openImagePreviewPopup = function (imageSrc, imageText, callback) {
    var openPopup = function (bodyWidth, bodyHeight) {
      var popup = new appComponents.Popup({
        width: bodyWidth,
        height: bodyHeight,
      });
      popup.body.append(previewCont);
      popup.addButton("Ok", function () {
        callback();
        popup.close();
      });
      popup.onOpen(function () {
        var pH = popup.html.height();
        var pbH = popup.body.height();
        var dif = pH - pbH;
        popup.html.height(pH + dif);
        popup.body.height(pbH + dif);
      });
      popup.open();
    };
    var img = $("<img />", {
      src: imageSrc,
      style: "width:auto;height:auto;",
    }).load(function () {
      var scrollW = 18;
      var bordersH = 5;
      var imgW = this.width;
      var imgH = this.height;
      var imgMaxW = imgW + (imgH > 500 ? scrollW : 0);
      var imgMaxH = (imgH < 500 ? imgH : 500) + bordersH;
      var imgTextTopPad = 10;
      var imgTextH = 15 + imgTextTopPad;
      var contPad = 15;
      var pbW = imgMaxW + contPad * 2;
      var pbH = imgMaxH + imgTextH + contPad * 2;
      previewCont.css({ padding: contPad + "px" });
      text.css({ paddingTop: imgTextTopPad + "px" });
      imgCont.css({ maxHeight: imgMaxH, height: imgMaxH });
      openPopup(pbW, pbH);
    });
    var imgCont = $("<div />", { class: "img-cont", html: img });
    var text = $("<div />", { html: imageText });
    var previewCont = $("<div />", {
      class: "image-preview-cont",
      html: [imgCont, text],
    });
  };

  // layout
  var setStartMenu = function () {
    if (_self.currentEvent.settings.timingType == _self.eventTypes[0].id) {
      startMenu.category.show();
      startMenu.single.hide();
    } else {
      startMenu.single.show();
      startMenu.category.hide();
    }
  };

  /********************************/
  /***** CLASSES  *****************/
  /********************************/

  var Routing = function (_app) {
    var self_routing = this;
    var allViews = [
      "app_entry",
      "category_start",
      "laps",
      "racers",
      "results",
      "settings",
      "start",
    ];
    var noEventEntryPageName = allViews[0]; // default when event is not loaded
    var entryPageName = allViews[3]; // default when event is loaded
    var firstLoaded = true;

    var isEventLoaded = function () {
      return _app.getCurrentEvent() != null;
    };
    var onHashChange = function () {
      var h = (location.hash + "").trim();
      if (h.length && h[0] == "#") {
        h = h.split("#")[1];
      }
      if (
        !h ||
        allViews.indexOf(h) == -1 ||
        (h == noEventEntryPageName && isEventLoaded()) ||
        (h != noEventEntryPageName && !isEventLoaded())
      ) {
        self_routing.loadEntry();
        return;
      }
      lib.getJS("../pages/" + h + ".js", function () {
        $(".menu-item").removeClass("active");
        $("[href='#" + h + "']").addClass("active");
      });
    };
    var bindEvents = function () {
      $(window).on("hashchange", function () {
        onHashChange();
      });
    };
    var loadRoute = function (pageName) {
      // no needed as public yet
      if (firstLoaded) {
        firstLoaded = false;
        if (location.hash == "#" + pageName || location.hash == pageName) {
          onHashChange();
          return;
        }
      }
      location.hash = "#" + pageName;
    };
    this.loadEntry = function () {
      isEventLoaded()
        ? loadRoute(entryPageName)
        : loadRoute(noEventEntryPageName);
    };
    bindEvents();
  };

  /********************************/
  /***** MODELS   *****************/
  /********************************/

  var ApplicationSettings = function () {
    this.directoryRestoreId; // chrome directory entry id, used to restore connection to directory
    this.displayPath; // users path to directory
  };

  var UserSettings = function () {
    this.appThemeId = "";
  };

  this.onlineHandler = (function () {
    var stateChangeHandlers = [];
    this.onStateChanged = function (func) {
      stateChangeHandlers.push(func);
    };
    this.isOnline = function () {
      return navigator.onLine;
    };

    window.addEventListener("online", function () {
      $.each(stateChangeHandlers, function (i, f) {
        setCss(true);
        f(true);
      });
    });
    window.addEventListener("offline", function () {
      $.each(stateChangeHandlers, function (i, f) {
        setCss(false);
        f(false);
      });
    });
    var setCss = function (state) {
      $("body").removeClass("online offline");
      $("body").addClass(state ? "online" : "offline");
    };
    setCss(this.isOnline());

    return this;
  })();

  __construct();
};

var Event = function (
  eventJSON,
  eventCacheTemplate,
  domFileStorage,
  eventTemplate
) {
  var self = this;

  var ev = eventJSON;
  var c = $.extend(true, {}, eventCacheTemplate);
  this.cache = c;

  var fileName = ev.settings.name;
  this.fileName = ev.settings.name;

  this.settings = ev.settings;
  this.storage = new MemoryStorage(
    ev.storage,
    ev.model,
    ev.primaryKey,
    c,
    function () {
      writeToFile();
    }
  );

  var model = $.extend(true, {}, eventTemplate.model);
  this.model = model;

  // file write queue
  var states = { idle: 0, writing: 1, waiting: 2 };
  var writeState = states.idle;
  var writeToFile = function () {
    writeState =
      writeState == states.writing || writeState == states.waiting
        ? states.waiting
        : states.writing;
    domFileStorage.writeEvent(fileName, JSON.stringify(ev), function (data) {
      if (writeState == states.waiting) {
        writeState = states.idle;
        writeToFile();
      } else {
        writeState == states.idle;
      }
    });
  };
};
Application.prototype.Event = Event;

var Notifications = function (app) {
  var self = this;
  var app = app;
  var toolbarBtn = $("#notification_button");
  var flyOutCont = $("#notifications");
  var messageCont = flyOutCont.find(".message-list");
  var closeBtn = $("#notifCloseBtn");

  var __construct = function () {
    flyOutCont.hide();
    if (app.onlineHandler.isOnline()) {
      updateMessages();
    }
  };

  // Events
  app.onlineHandler.onStateChanged(function (state) {
    if (state) {
      setTimeout(function () {
        updateMessages();
      }, 20000);
    }
  });

  // Methods
  var updateMessages = function () {
    messageCont.html("");
  };

  var Item = function (dataObj) {
    var div = $("<div>", { class: "notification-item" });
    var title = $("<div>", { class: "title", html: dataObj.title });
    var message = $("<div>", { class: "message", html: " " + dataObj.message });
    var date = $("<div>", {
      class: "date",
      html: convertToLocaleDateString(dataObj.date) || dataObj.date,
    });

    div.append(title, date, message);
    this.html = div;
  };

  // end
  __construct();
};
