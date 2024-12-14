

/* CONSTANTS */



/* ENUMS */

var racersPrintType = {
    all: 0,
    byCategory: 1
}



/* HELPERS */

var parseUInt = function (str) {
    str = (str + "").trim();
    var testRE = /^\d+$/gi;
    if (testRE.test(str + "")) {
        return parseInt(str);
    }
    var matchRE = /^\d+/gi;
    var result = str.match(matchRE);
    return result ? parseInt(result[0]) : null;
}

var isUserInputValid = function (text) {
    if (text === null || text === undefined) return false;
    var t = (text + "").trim();
    if (t === "") return true;
    var re = /^[A-Za-z0-9 ]+$/gi;
    return re.test(t);
}

var isInputKey = function (whichKeyCode) {
    var k = whichKeyCode;
    if (k == 8 || // backspace
        k == 32 || // space
        k == 46 || // delete
        (k >= 48 && k <= 57) || // 0-9
        (k >= 65 && k <= 90) || // a-z
        (k >= 96 && k <= 111) || // numpad
        (k >= 186 && k <= 192) || (k >= 219 && k <= 222)) // punctuation
    {
        return true;
    }
    return false;
}

var convertToLocaleDateString = function (dateStr) {
    try {
        var parseResult = Date.parse(dateStr);
        if (isNaN(parseResult) || !parseResult) { return null; }
        var date = new Date(parseResult);
        return date.toLocaleString();
    } catch (e) {
        return null;
    }
}