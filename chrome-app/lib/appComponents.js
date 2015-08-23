var AppComponents = function () {
    
}

AppComponents.prototype.Layout = function (settings) {
    var self = this;
    var settings = (settings) ? settings : {
        resize: true
    }

    this.html = $("<div>", { "class": "layout" });

    var columns = [];

    this.addColumn = function (colSettings) {
        var _colSettings = { scrollable: false }
        if (colSettings && colSettings instanceof Object) {
            $.extend(_colSettings, colSettings);
        }
        
        var c = new Column();
        self.html.append(c.html);
        if (_colSettings.scrollable) {
            c.html.attr("style", "overflow-y: auto");
        }
        return c;
    }

    var Cell = function () {
        var d = $("<div>", { "class": "cell" });
        var pad = $("<div>", { "class": "pad" });
        d.append(pad);
        this.html = d;
        this.pad = pad;
        this.setHeight = function (height) {
            d.attr("data-height", height);
            self.resize();
        }
    }
    var Column = function () {
        var _self = this;
        columns.push(_self);
        this.addCell = function () {
            var c = new Cell();
            _self.html.append(c.html);
            return c;
        }
        this.html = $("<div>", { "class": "column" });
        var resizeCells = function () {
            var pad = _self.html.css("padding").split("px")[0];
            var ht = _self.html.height();
            var fixedCells = _self.html.find(".cell[data-height]");
            if (fixedCells.length) {
                fixedCells.each(function () {
                    var _ht = $(this).attr("data-height");
                    ht = ht - _ht;
                    $(this).height(_ht);
                    sizeCell($(this));
                });
            }

            var cells = _self.html.find(".cell:not([data-height])");
            var nCells = cells.length;
            var cellHt = (ht / nCells) - pad;
            cells.each(function () {
                $(this).height(cellHt);
                sizeCell($(this));
            });

        }
        this.resizeCells = resizeCells;
    }
    var sizeCell = function (cellHtml) {
        var padEle = cellHtml.find(".pad");
        var padTop = +(padEle.css("paddingTop").split("px")[0]);
        var padBottom = +(padEle.css("paddingBottom").split("px")[0]);
        var cellInnerHt = cellHtml.height();
        var toolbarHt = (cellHtml.find(".toolbar")) ? cellHtml.find(".toolbar").outerHeight() : 0;
        var grid = cellHtml.find(".grid");
        if (grid.length) {
            var gridHt = cellInnerHt - toolbarHt - (padTop + padBottom);
            grid.height(gridHt);
            var head = grid.find(".div-head");
            var body = grid.find(".div-body");
            var footer = grid.find(".footer");
            if (footer.length) {
                body.height(gridHt - head.height() - footer.height());
            } else {
                body.height(gridHt - head.height());
            }
            
        }
    }

    var resize = function () {
        if (settings.resize) {
            $.each(columns, function (i, col) {
                col.resizeCells();
            });
        }
    }
    this.resize = resize;
    if (settings.resize) {
        $(window).on("resize", function () {
            resize();
        });
    }
}


AppComponents.prototype.Section = function () {
    var self = this;


    this.html = $("<div>", { "class": "section" });
    this.pad = $("<div>", { "class": "pad" });
    this.html.append(self.pad);

}

AppComponents.prototype.Toolbar = function (title) {
    var self = this;
    var title = (title)?title:false;


    this.html = $("<div>", { "class": "toolbar" });

    if (title) {
        this.html.append($("<span>", { html: title }));
    }

    this.addButton = function (text, callback) {
        self.html.append(new Button(text, callback).html)
    }

    var Button = function (text, onclick) {
        this.html = $("<span>", { "class": "button", html: text, click: onclick });
    }

}

AppComponents.prototype.Grid = function (settings) {
    /**
        settings: {
            name: "", // identifier for grid and named events, should be unique to prevent unbinding
            selectable: "bool|many",
            paging: {
                size: int, 
                callback: function(pageNumber,grid,store){  // do a refresh data here  }            
            },
             search: {
                title: "BIB",
                callback: function(text){
                   // do refresh of grid data here
                }
            },
            onRowClick: function(callback){ callback() },
            onRowDblClick: func,
            onRowEnter: func,
            rowKey: "",
            rowRule: function(rowData,rowEle){ },
            columns: [
                {  label: "", dataKey: "", width: "optional", "class":"somecss", getValue: function(dataKey){ return myCustomGetValue(); } },
                { type: "img", img: "trash|more??",  onClick: function(rowKey){  }, onDblClick: function(rowKey){ } }
            ]
        }

    **/
    var self = this;
    var gridName = settings.name;
    var settings = settings;
    var selectable = (settings.selectable) ? settings.selectable : false;
    var html;
    var tableHeader;
    var tableBody;
    var tableFooter;
    var paging = (settings.paging) ? settings.paging : false;
    var search = (settings.search) ? settings.search : false;
    var rowClickListeners = [];
    var rowDblClickListeners = [];
    var rowEnterListeners = [];
    var rowEnterStore = {}; //  by rowId
    var loadedData;
    var inner;
    var d1, d2;
    var trCloner = $("<tr>", { "data-id":"" });
    var pagingDiv;
    var searchDiv;

    var __construct = function () {
        createHtml();
        createHeader();
        self.loadData = loadData;
        self.onRowClick = addRowClickListener;
        self.onRowDblClick = addRowDblClickListener;
        self.onRowEnter = addRowEnterListener;
        self.clear = clear;
        self.size = setColumnWidths;
        self.addRow = addRow;
        self.popRow = popRow;
        self.updateRow = updateRow;
        self.divBody = d2;
        self.tableBody = tableBody;
        self.html = html;
        self.getSelected = getSelected;
        self.setSelected = setSelected;
        self.clearSearch = clearSearch;

        if (selectable) {
            bindKeyboardNavigation();
        }

        loadData([]);
    }

    /** Events **/

    $(window).on("resize", function () {
        setColumnWidths();
    });

    /** Actions **/

    var onRowClick = function (rowKey) {
        
        $.each(rowClickListeners, function (i, func) {
            func(rowKey);
        });
    }
    var onRowDblClick = function (rowKey) {
        $.each(rowDblClickListeners, function (i, func) {
            func(rowKey);
        });
    }
    var onRowEnter = function (rowKey) {

        $.each(rowEnterListeners, function (i, func) {
            func(rowKey);
        });
    }
    /** Methods **/

    var createHtml = function () {
        html = $("<div>", { "class": "grid" });
        var d = $("<div>");
        d1 = d.clone(); d1.addClass("div-head");
        d2 = d.clone(); d2.addClass("div-body");
        tableHeader = $("<table>", { "class": "head", html: "<thead></thead>" });
        tableBody = $("<table>", { "class": "body", html: "<tbody></tbody>", tabindex: 99 });
        tableFooter = $("<div>", { "class": "footer" }); tableFooter.hide();
        pagingDiv = $("<div>", { "class": "paging-div" });
        tableFooter.append(pagingDiv);
        d1.append(tableHeader); d2.append(tableBody); 
        html.append(d1, d2);
        if (selectable) {
            html.addClass('selectable');
        }
        if (search || paging) {
            html.append(tableFooter);
        }
        if (search) {
            setSearch();
        }

    }
    var createHeader = function () {
        var tr = $("<tr>");
        var th = $("<th>");
        $.each(settings.columns, function (i, column) {
            var _th = th.clone();
            tr.append(_th.html(column.label));
            if (column.class) {
                _th.addClass(column.class);
            }
            if (column.hidden) {
                _th.hide();
            }
            if (column.width) {
                _th.css("width", column.width);
            }
        });
        tableHeader.find("thead").append(tr);
    }

    var setColumnWidths = function () {
        if (html.is(":visible") && !_isEmpty()) {
            var trs = tableBody.find("tbody > tr");
            var ths = tableHeader.find("th");
            if (!_isEmpty()) {
                var tds = $(trs[0]).find("td");
                $.each(tds, function (i, td) {
                    var wd = (settings.columns[i].width) ? settings.columns[i].width : $(td).width();
                    wd += (i == tds.length - 1 && tableHeader.width() > tableBody.width()) ? tableHeader.width() - tableBody.width() : 0;
                    wd = (settings.columns[i].hidden) ? 0 : wd;
                    $(ths[i]).css("width", wd);
                });
            }
        }
        return self;
    }

    var addRowClickListener = function (func) {
        rowClickListeners.push(func);
        return self;
    }
    var addRowEnterListener = function (func) {
        rowEnterListeners.push(func);
        return self;
    }
    var addRowDblClickListener = function (func) {
        rowDblClickListeners.push(func);
        return self;
    }
    var loadData = function (dataArray, pageNumber) {

        loadedData = $.makeArray(dataArray);
        inner = tableBody.find("tbody");
        inner.html('');
        var records = false;
        var length = dataArray instanceof Object ? Object.keys(dataArray).length : dataArray.length;
        if (length) {
            if (paging) {                
                var currRec = 0;
                var startStop = setPaging(length, (pageNumber)?pageNumber: 1); // returns pagingSettings
                $.each(dataArray, function (i, dataRow) {
                    records = true;                    
                    if (startStop.start <= currRec && currRec <= startStop.stop) {
                        inner.append(getRow(settings.columns, dataRow));
                    }
                    currRec++;
                });
            } else {
                $.each(dataArray, function (i, dataRow) {
                    records = true;
                    inner.append(getRow(settings.columns, dataRow));
                });
            }
            
        }
        
        if (!records) {
            inner.append(getRow([{ dataKey: "description" }], { id: "no-records", description: "0 Records" }));
        }
        setColumnWidths();
        return self;
    }
    var setPaging = function (length,pageNumber) {
        var stop = (pageNumber*paging.size) - 1;
        var start = stop + 1 - paging.size;
        
        var pageBtn = $("<span>", {
            "data-pagenumber":"",
            "class": "button", click: function () {
                $(this).parent().find(".active").removeClass("active");                
                paging.callback($(this).attr("data-pagenumber"),self);
            }
        });
        pagingDiv.html('').show();
        tableFooter.show();
        var numberOfPages = Math.ceil(length / paging.size);
        for(var i = 1; i <= numberOfPages; i++) {
            var btn = pageBtn.clone(true).attr("data-pagenumber",i).text(i);
            pagingDiv.append(btn);
        };
        d2.scrollTop();
        tableFooter.find("[data-pagenumber='" + pageNumber + "']").addClass("active");

        return {
            start: start, stop: stop 
        }
    }
    var setSearch = function () {
        searchDiv = $("<div>", { "class": "search-div" });
        //var searchText = $("<span>", { "class": "label", html: search.title });
        var searchInput = $("<input>", { type: "text", placeholder: "Search By " + search.title });
        searchInput.keyup(function (e) {
            //if (e.which == 13) {
                search.callback($(this).val(),self);
            //}
        });
        searchDiv.append(searchInput);
        tableFooter.append(searchDiv).show();
    }
    var addRow = function (dataRow, prependFlag) {
        var r = getRow(settings.columns, dataRow);
        if (_isEmpty()) {
            tableBody.find("tbody").html("");
        }
        (prependFlag) ? inner.prepend(r) : inner.append(r);
    }
    var popRow = function () {
        inner.find("tr").last().remove();
    }
    var updateRow = function (rowId,dataRow) {
        var r = html.find("[data-id='"+rowId+"']");
        if (r.length) {
            var nr = getRow(settings.columns, dataRow);
            if (r.hasClass("selected")) {
                nr.addClass("selected");
            }
            r.replaceWith(nr);
        }        
    }
    var clearSearch = function () {
        if (search) {
            searchDiv.find("input").val('').trigger("keyup");
        }
    }
    var getRow = function (columns, dataRow) {
        //var tr = $("<tr>", { "data-id": dataRow[settings.rowKey] });
        var tr = trCloner.clone();
        tr.attr("data-id", dataRow[settings.rowKey]);
        if (dataRow.id != "no-records") {
            tr.click(function () {
                if (selectable) {
                    if (selectable != "many") {
                        tableBody.find(".selected").removeClass("selected");
                    }
                    $(this).addClass("selected");
                }
                onRowClick($(this).attr("data-id"));
            });
            tr.dblclick(function () {
                onRowDblClick($(this).attr("data-id"));
            });
        }
        var td = $("<td>");
        $.each(columns, function (i, column) {
            var _td = td.clone();
            if (!column.dataKey && column.html) {
                _td.html(column.html);
            } else {
                var val = (column.getValue) ? column.getValue(dataRow[column.dataKey]) : dataRow[column.dataKey];
                _td.html(val);
            }
            if (column.onClick) {
                _td.click(function () {
                    column.onClick(dataRow[settings.rowKey]);
                });
            }
            if (column.onDblClick) {
                _td.dblclick(function () {
                    column.onDblClick(dataRow[settings.rowKey]);
                });
            }
            if (column.hoverText) {
                _td.attr("data-title", column.hoverText);
            }
            if (column.width) { _td.css("width", column.width); }
            if (column.class) {
                _td.addClass(column.class);
            }
            if (column.hidden) {
                _td.hide();
            }
            tr.append(_td);
        });
        if (settings.rowRule) {
            settings.rowRule(dataRow, tr);
        }
        return tr;
    }

    var clear = function () {
        inner.html('');
    }

    var getSelected = function () {
        var sel = [];
        tableBody.find(".selected").each(function () {
            sel.push($(this).attr("data-id"));
        });
        return sel;
    }
    var setSelected = function (arrayDataIds) {
        $.each(arrayDataIds, function (i,dataId) {
            tableBody.find("[data-id='" + dataId + "']").addClass("selected");
        });
    }
    var _isEmpty = function () {
        var trs = tableBody.find("tr");
        return (!trs.length || (trs.length == 1 && $(trs[0]).attr('data-id') == "no-records"));
    }

    var bindKeyboardNavigation = function () {
        var constants = {
            keycode: {
                up: 38,
                down: 40,
                enter: 13
            }
        }
        var st = 0;
        var ss = false;

        var evn = "mousedown." + gridName;
        $(window).unbind(evn).bind(evn, function (e) {
            ss = false;
        });

        var t = tableBody;
        t.on("click", function () {
            t.focus();           
        });

        t.on("keydown", function (e) {
            if (e.which == constants.keycode.up || e.which == constants.keycode.down) {
                move(e.which);
            }
            else if (e.which == constants.keycode.enter) {
                open(t.find(".selected"));
            }
        });
        var open = function (jqEle) {
            var dataId = jqEle.attr("data-id");
            if (dataId) {
                onRowEnter(dataId);
            }
        }
        var move = function (keycode) {
            var sel = t.find(".selected");
            var trs = t.find("tr");
            var rh = sel.height();
            ss = true;
            var ind = (sel.length) ? sel.index() : false;
            if (ind === false ||
                (keycode == constants.keycode.up && sel.index() == 0) ||
                (keycode == constants.keycode.down && sel.index() == trs.length - 1))
            { return; }

            trs.removeClass("selected");

            if (keycode == constants.keycode.up) {
                sel = $(trs[sel.index() - 1]).addClass("selected");
                if (sel.offset().top - d2.offset().top < 0) {
                    st = (st - rh < 0) ? 0 : st - rh;
                } else {
                    st = d2.scrollTop();
                }
            } else {
                sel = $(trs[sel.index() + 1]).addClass("selected");
                if (sel.offset().top - d2.offset().top + rh > d2.innerHeight()) {
                    st = st + rh;
                } else {
                    st = d2.scrollTop();
                }
            }
        }

        d2.bind("mousewheel DOMMouseScroll", function () {
            ss = false;
        });

        d2.scroll(function (e) {
            if (ss) {
                d2.scrollTop(st);
            }
        });
        d2.on("scrollstop", function () {
            if (ss) {
                st = d2.scrollTop();
            }
        });

    }

    __construct();



    return self;
}

AppComponents.prototype.Form = function (settings) {
    /**
        settings: {
        labelWidth: int, 
        inputWidth: int,
        fields: [
            {
                label: "", dataKey: "",
                type: "text|select|date",
                dataType: "int|string",
                required: bool,
                readonly: bool,
                visible: bool,
                onChange: function (form) { form.setValue("myOtherDataKey", $(this).val()); },
                options: [{ label: "", value: "" }],
                getOptions: function (callback) { callback(options); },
                customValue: function (_form) { return "yourvalue"; }
            }
        ]
        }

    **/
    var self = this;
    var settings = settings;
    var html;
    var loadedData;
    var invalidClass = "invalid";
    var enterListeners = [];
    var createdListeners = [];
    var intKeys = [];
    var hasCustomValue = false;

    var __construct = function () {
        createHtml();
        self.setValues = setValues;
        self.setValue = setValue;
        self.getValues = getValues;
        self.getValue = getValue;
        self.validate = validate;
        self.clear = clearForm;
        self.showRed = showRed;
        self.html = html;
        self.onEnter = function (func) {
            enterListeners.push(func);
        }
        self.onCreated = function (func) {
            createdListeners.push(func);
        }
        self.focus = function () {
            html.find("input:not([readonly]), select:not([readonly])").first().focus();
        }
        
        bindEvents();
        onCreated();
    }

    /** Events **/

    var bindEvents = function () {
        html.find("input,select").on("keypress", function (e) {
            if (e.which == 13) {
                onEnterClick();
            }
        });
    }

    /** Actions **/

    var onEnterClick = function () {
        lib.callFunctions(enterListeners, []);
    }
    var onCreated = function () {
        lib.callFunctions(createdListeners, []);
    }
    /** Methods **/

    var createHtml = function () {
        html = $("<div>", { "class": "form" });
        $.each(settings.fields, function (i, field) {
            var r = new FormRow(field);
            if (field.visible === false) { r.html.hide(); }
            html.append(r.html);
        });
    }
    var FormRow = function (field) {
        var label = field.label;
        var name = field.dataKey;
        var type = (field.type) ? field.type : "text";
        var options = (field.options) ? field.options : []; // [{ label: "", value: "" }]
        var readonly = (field.readonly);
        var required = (field.required);
        var hidden = (field.hidden);
        var isInt = false;
        if (field.customValue) {
            hasCustomValue = true;
        }
        if (field.dataType == "int") {
            intKeys.push(field.dataKey);
            isInt = true;
        }
        var r = $("<div>", { "class": "field-row" });
        if (hidden) {
            r.hide();
        }
        var l = $("<label>", { html: label });
        if (settings.labelWidth) {
            l.css("width", settings.labelWidth + "px");
        }
        if (type == "select") {
            var inp = $("<select>", { name: name });
            if (settings.inputWidth) {
                inp.css("width", (settings.inputWidth+7) + "px");
            }

            if (field.getOptions) {
                field.getOptions(function (options) {
                    setOptions(inp, options);
                });
            } else {
                setOptions(inp, options);
            }
            // onChange
            if (field.onChange) {
                inp.change(function () {
                    field.onChange.call($(this),self);
                });
            }
        } else {
            if (type == "date") {
                var inp = $("<input>", { name: name, type: "date" });
            } else {
                var inp = $("<input>", { name: name, type: "text" });
            }
            if (settings.inputWidth) {
                inp.css("width", settings.inputWidth + "px");
            }
            // KeyUp == Change Event for Inputs
            if (isInt) {
                inp.on("keyup", function (e) {
                    var str = $(this).val();
                    var selStart = $(this)[0].selectionStart;
                    var selEnd = $(this)[0].selectionEnd;
                    var result = parseUInt(str);
                    $(this).val(result);
                    $(this)[0].selectionStart = selStart;
                    $(this)[0].selectionEnd = selEnd;
                });
            }
            if (field.onChange) {
                inp.on("keyup", function () {
                    field.onChange.call($(this),self);
                });
            }
        }
        
        if (readonly) { inp.attr("readonly", true); }
        if (required) { inp.attr("required", true); }
        r.append(l, inp);
        this.html = r;
    }
    var getRowEle = function (key) {
        var ele = html.find("[name='" + key + "']");
        if (ele) {
            return ele;
        }
        throw "Form field with this name was not found.";
    }
    var setOptions = function (selectEle, optionsArray) {
        var option = $("<option>");
        $.each(optionsArray, function (i, opt) {
            var o = option.clone();
            o.attr("value", opt.value);
            o.html(opt.label);
            selectEle.append(o);
        });
    }
    var getValues = function () {

        return lib.objectifyFields(html, intKeys);
    }
    var setValues = function (data) {
        html.find("[name]").val('');
        $.each(data, function (key, value) {
            html.find("[name='" + key + "']").val(value);
        });
        _runCustomValues();
        return self;
    }
    var setValue = function (key, value) {
        var ele = getRowEle(key);
        ele.val(value); 
        return true;
    }
    var getValue = function (key) {
        var v = getValues();
        if (!v.hasOwnProperty(key)) {
            throw "Form field with this name was not found.";
        }
        return v[key];
    }
    var validate = function () {
        var valid = true;
        var msgs = [];
        html.find(".invalid").removeClass("invalid");
        $.each(settings.fields, function (i, field) {
            var ele = html.find("[name='" + field.dataKey + "']");
            var propName = field.label || field.dataKey;
            if (ele.attr("required") && (!ele.val() || ele.val() == '' || (ele.val() + '').trim() == '')) {
                valid = false; ele.addClass(invalidClass);
                msgs.push(propName + " is a required field.");
            } else if (field.valid) {
                var v = field.valid(getValues());
                if (v !== true) {
                    valid = false; ele.addClass(invalidClass);
                    msgs.push((v === false) ? propName + " is invalid." : v);
                }
            }
        });
        if (msgs.length) { lib.alert(msgs); }
        return valid;
    }
    var clearForm = function () {
        html.find("[name]").val('');
    }
    var showRed = function (key) {
        var ele = getRowEle(key);
        if (!ele.hasClass(invalidClass)) {
            ele.addClass(invalidClass);
        }
    }
    var _runCustomValues = function () {
        if (hasCustomValue) {
            $.each(settings.fields, function (i, field) {
                if (field.customValue) {
                    html.find("[name='" + field.dataKey + "']").val(field.customValue(self));
                }
            });
        }
    }
    __construct();

    return self;
}

AppComponents.prototype.Popup = function (settings) {
    /**
    settings = {
        height: 200, width: 200
    }
    */

    var self = this;
    if (settings) {
        var docWidth = $(document).width();
        var docHeight = $(document).height();
        var leftRightMargin = 20;
        var topBottomMargin = 60;
        if (settings.width && settings.width > docWidth) {
            settings.width = docWidth - leftRightMargin;
        }
        if (settings.height && settings.height > docHeight) {
            settings.height = docHeight - topBottomMargin;
        }
    }
    var settings = $.extend({ height: 400, width: 300 }, settings);
    var html;
    var body;
    var buttons;
    var overlay;
    var openListeners = [];
    var style = {
        overlay: "position: fixed; top: 0px; height: 100%; width: 100%; z-index: 9999;",
        html: "position: fixed; height: " + settings.height + "px; width: " + settings.width + "px; z-index: 9999;",
        body: "",
        buttons: "text-align: right; height: 33px;",
        button: "border: 0; height: 33px; line-height: 33px; padding: 0 10px; background: none; cursor: pointer; margin: 0 15px 0 0; ",
        buttonHover: ""
    }


    var __construct = function () {
        createHtml();
        self.html = html;
        self.body = body;
        self.overlay = overlay;
        self.addButton = addButton;
        self.open = open;
        self.close = close;
        self.remove = remove;
        bindEvents();
        positionPopup();
        self.onOpen = function (func) {
            openListeners.push(func);
        }
    }

    /** Events **/

    var bindEvents = function () {
        $(window).resize(function () {
            setTimeout(function () {
                positionPopup();
            }, 100);
        });
    }

    /** Actions **/

    var onOpen = function () {
        $.each(openListeners, function (i, func) {
            func();
        });
    }

    /** Methods **/

    var createHtml = function () {
        html = $("<div>", { "class": "popup", style: style.html });
        body = $("<div>", { "class": "body", style: style.body });
        buttons = $("<div>", { "class": "buttons", style: style.buttons });
        overlay = $("<div>", { "class": "overlay", style: style.overlay });
        html.append(body, buttons);
        close();
        $("body").append(overlay, html);
    }
    var addButton = function (text, callback, helperText) {
        var b = $("<a>", { "class": "button", html: text, style: style.button });
        if (helperText) {
            b.attr("data-title", helperText);
        }
        buttons.append(b);
        b.click(callback);
        positionPopup();
        return self;
    }
    var close = function () {
        return _groupAction("hide");
    }
    var open = function () {
        onOpen();
        return _groupAction("show");
    }
    var remove = function () {
        return _groupAction("remove");
    }
    var positionPopup = function () {
        var wh = $(window).height();
        var ww = $(window).width();

        overlay.height(wh + "px");
        overlay.width(ww + "px");

        body.height(html.outerHeight() - buttons.outerHeight() - 2 + "px");

        if (html.outerWidth() + 5 < ww) {
            var left = ((ww / 2) - (html.outerWidth() / 2)) + "px";
            html.css("left", left);
        }
        if (html.outerHeight() + 5 < wh) {
            var top = ((wh / 2) - (html.outerHeight() / 2)) + "px";
            html.css("top", top);
        }
    }
    var _groupAction = function (method) {
        html[method]();
        overlay[method](); return self;
    }
    __construct();



    return self;
}

AppComponents.prototype.EditorGrid = function (settings, Toolbar, Grid, Popup, Form) {
    var self = this;

    var Toolbar = Toolbar;
    var Grid = Grid;
    var Popup = Popup;
    var Form = Form;

    var cont = settings.container;
    var title = settings.title;
    var store = settings.store;
    var gridSettings = settings.gridSettings;
    var formSettings = settings.formSettings;
    var popupSettings = settings.popupSettings;

    var beforeSaveCallback = settings.beforeSaveCallback ? settings.beforeSaveCallback : function (data, allowCb) { allowCb(); };
    var saveCallback = settings.saveCallback ? settings.saveCallback : function () { };

    var toolbar;
    var grid;
    var popup;
    var form;

    var formCreatedListeners = [];

    var __construct = function () {
        createToolbar();
        createGrid();
        createPopup();
        createForm();
        bindEvents();
        cont.append(toolbar.html, grid.html);
        refreshGrid(store,grid);

        self.toolbar = toolbar;
        self.grid = grid;
        self.form = form;
        self.popup = popup;
        self.store = store;
        self.refreshGrid = function () { refreshGrid(store, grid); }
        self.onFormCreated = addCreateFormListener;
    };
    // EVENTS
    var bindEvents = function () {
        popup.onOpen(function () {
            createForm();
            setTimeout(function () { form.focus(); }, 100);
        });
    }
    // ACTIONS

    var onSave = function () {
        if (form.validate()) {
            var data = form.getValues();
            beforeSaveCallback(data, function () {
                var actionType = (data.id.length) ? "update" : "insert";
                var action = store[actionType];
                action(data, function () {
                    if (!settings.noRefreshOnSave) {
                        refreshGrid(store, grid);
                    }
                    saveCallback(actionType);
                    popup.close(); form.clear();
                    grid.tableBody.focus();
                    setTimeout(function () {

                    }, 100);
                });
            });
        }
    }
    var onAdd = function () {
        createForm();
        popup.open();
    }
    // METHODS
    var createToolbar = function () {
        toolbar = new Toolbar(title);
        toolbar.addButton("+Add", onAdd);
    }
    var createGrid = function () {
        grid = new Grid(gridSettings);
        var openEditorPopup = function (rowKeyValue) {
            store.readSingle("id", rowKeyValue, function (data) {
                popup.open(); form.setValues(data);
            });
        }
        grid.onRowDblClick(openEditorPopup);
        grid.onRowEnter(openEditorPopup);
    }
    var refreshGrid = function (store, grid) {
        var selected = grid.getSelected();
        store.readAll(function (data) {
            grid.loadData(data);
            grid.setSelected(selected);
            grid.tableBody.focus();
        });
    }
    refreshGrid = (settings.refreshGrid) ? settings.refreshGrid : refreshGrid;

    var createPopup = function () {
        popup = new Popup(popupSettings);
        popup.addButton("Close", function () {
            popup.close();
            form.clear();
        }).addButton("Save", function () {
            onSave();
        });
    }
    var createForm = function () {
        form = new Form(formSettings);
        popup.body.html('');
        popup.body.append(form.html);
        form.onEnter(onSave);

        fireFormCreated(form);
    }

    var addCreateFormListener = function (func) {
        formCreatedListeners.push(func);
    }
    var fireFormCreated = function (form) {
        $.each(formCreatedListeners, function (i, func) {
            func(form);
        });
    }
    __construct();
}
