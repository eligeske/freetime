var Lib = function(){}
Lib.prototype.getJS = function (url, callback) {
    var p = new Promise(function (resolve, reject) {
        var script = document.createElement("script")
        script.type = "text/javascript";

        if (script.readyState) {  //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" ||
                        script.readyState == "complete") {
                    script.onreadystatechange = null;
                    resolve();
                }
            };
        } else {  //Others
            script.onload = function () {
                resolve();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);


    }).then(function () {
        callback();
    });
}
Lib.prototype.loadCss = function (url, uid) {
    var attr = { rel: "stylesheet", href: url };
    if (uid) {
        $(document).find('link#' + uid).remove();
        attr.id = uid;
    }
    var link = $('<link />', attr);
    $('head').append(link);
}
Lib.prototype.AsyncList = function (finishCallback) {

    /* asyncFunc = function(asyncDone){ 
                // your code(function(){
                    asyncDone();
                })
        } */
    var finishCallback = finishCallback;
    var funcs = [];
    var called = 0;
    var callback;

    var callCheck = function () {
        called = called + 1;
        if (called == funcs.length) {
            finishCallback();
        }
    }
    this.add = function (asyncFunc) {
        funcs.push(asyncFunc);
    }

    this.run = function () {
        if (!funcs.length) {
            finishCallback(); return;
        }
        $.each(funcs, function (i, f) {
            f(callCheck);
        })
    }
    this.count = function () {
        return funcs.length;
    }
}
Lib.prototype.callFunctions = function (funcList, args) {
    $.each(funcList, function (i, func) {
        (args != undefined) ? func.apply(func, args) : func();
    });
}
Lib.prototype.sameObject = function (a, b) {
    return JSON.stringify(a) == JSON.stringify(b);
}
// returns named object of form fields in element by name attr
// arrayOfIntKeys, parses the output to int from string if there is a value
Lib.prototype.objectifyFields = function (containerEle,arrayOfIntKeys) {
    var out = {};
       
    containerEle.find("select,input").each(function () {
        var name = $(this).attr("name");
        var val = $(this).val();
        if(arrayOfIntKeys && arrayOfIntKeys.length){
            if(arrayOfIntKeys.indexOf(name) > -1){
                val = (val == "") ? null : parseInt(val);
            }
        }
        out[$(this).attr("name")] = val;
    });
    return out;
}
// fills form by name attr from object
Lib.prototype.fillForm = function (containerEle, obj) {
    $.each(obj, function (key, value) {
        var f = containerEle.find("[name='" + key + "']");
        if (f.length) {
            f.val(value);
        }
    });
}
Lib.prototype.updateObject = function (obj1, obj2, map) {
    /**
        object1 gets new property values from object2. ignores any properties not found in object1
        map = { obj1key:obj2key }, 
        note: obj1 is by reference
        returns undefined
    */
    var ignore = [];
    // handle mapping
    $.each(map, function (key1, key2) {
        if (obj1.hasOwnProperty(key1) && obj2.hasOwnProperty(key2)) {
            obj1[key1] = obj2[key2];
            ignore.push(key2);
        }
    });
    $.each(obj1, function (key, val) {
        if (obj2[key] && key.indexOf(ignore) == -1) {
            obj1[key] = obj2[key];
        }
    });

}
Lib.prototype.mapObject = function (sourceObj, mapping) {
    /**
        creates a  new object from the values of sourceObj and mapping object keys
        var sourceObj = { name: "ted", age: "22", id: 123 }
        var mapping = { "fName":"name", "hisAge": "age"}  // { outputKey : sourceObjKey  }

        returns { fName: "ted", hisAge: "22" }
    */
    var obj = {};
    $.each(mapping, function (oKey, sKey) {
        obj[oKey] = sourceObj[sKey];
    });
    return obj;
}
Lib.prototype.arrayOfValues = function (arrayOfObjects, key) {
    /**
        returns an array [] or values of a specified key in an object for each item in an object array
        var arrayOfObjects = [
            {name: "", someProp: "somePropVal1" },
            {name: "", someProp: "somePropVal2" }
        ]
        var key = "someProp";

        returns ["somePropVal1","somePropVal2"]
    */
    var arr = [];
    $.each(arrayOfObjects, function (i, obj) {
        arr.push(obj[key]);
    });
    return arr;
}
Lib.prototype.getURLParam = function (name) {
    /**
        returns a GET Param from URL
    */
    var result = null,
    tmp = [];
    location.search
    .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === name) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

Lib.prototype.showMessage = function (text, messageType, delayMS) {
    var delayMS = (delayMS) ? delayMS : 3000;
    var al = $("<div>", { "class": "alert" });
    if (messageType == "success") { al.addClass("success"); }
    if (text instanceof Array) {
        $.each(text, function (i, val) {
            al.append("<span>" + val + "</span>");
        });
    } else {
        al.append("<span>" + text + "</span>");
    }
    $("body").append(al);
    al.delay(delayMS).fadeOut("slow", function () { al.remove(); });
}

Lib.prototype.alert = function (text, delayMS) {
    this.showMessage(text, "error", delayMS);
}

Lib.prototype.alertSuccess = function (text, delayMS) {
    this.showMessage(text, "success", delayMS);
}

var lib = new Lib();
Lib.prototype.confirm = function (text, callback, popupSettings) {
    var popupSettings = (popupSettings) ? popupSettings : { height: 200, width: 200 };
    var c = new AppComponents();
    var p = new c.Popup(popupSettings);
    p.body.append("<div class='popup-confirm-body'>" + text + "</div>");
    p.addButton("No", function () {
        p.remove();
        callback(false);
    });
    p.addButton("Yes", function () {
        p.remove();
        callback(true);
    });
    p.open();
}