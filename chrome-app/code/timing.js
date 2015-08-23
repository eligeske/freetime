var Timing = function () {
    var self = this;

    this.getReadableClockFromTimestamp = function (timestamp) {
        // uses a full timestamp. NOT millisecond
        var today = new Date(timestamp);
        return today.getHours() + ":" + zeroIt(today.getMinutes()) + ":" + zeroIt(today.getSeconds()) + "." + zeroIt(today.getMilliseconds());
    }
    this.getTimeStamp = function(){
        return new Date().getTime();
    }
    // returns stopwatch time from milliseconds
    // note: this milliseconds not to be confused with unix timestamp
    this.getReadableTime = function (milliseconds) {
        var f = milliseconds / 1000;
        var s = Math.floor(f);
        var m = (s - s % 60) / 60;
        var h = (m - m % 60) / 60;
        m = m % 60; m = (m < 10) ? "0" + m : m;
        s = s % 60; s = (s < 10) ? "0" + s : s;
        var ms = (f.toString().split('.')[1]);
        if (ms == undefined) { ms = 0; }

        return h + ":" + m + ":" + s + "." + ms;
    }

    var zeroIt = function (number) {
        return (number < 10) ? "0" + number : number;
    }

}
