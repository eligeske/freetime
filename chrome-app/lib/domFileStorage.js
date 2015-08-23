var DOMFileStorage = function (callback) {
    var self = this;
    this.fs;
    var storageSize = 100 * 1024 * 1024;
    var error = function () {
        console.log(arguments);
    }
    var __construct = function () {
        open(function () {
            self.writeFile = writeFile;
            self.listFiles = listRootFiles;
            self.listDirFiles = listDirFiles;
            self.createDir = createDir;
            self.moveFiles = moveFiles;
            self.checkIfFileExists = checkIfFileExists;
            self.readFile = readFile;
            self.removeFile = removeFile;
            self.removeAllFiles = removeAllFiles;
            callback(self);
        });
    }
    var open = function (callback) {
        var callback = (callback) ? callback : function () { }
        navigator.webkitPersistentStorage.requestQuota(storageSize, function (grantedBytes) {
            window.webkitRequestFileSystem(window.PERSISTENT, storageSize, function (fs) {
                self.fs = fs;
                callback();
            }, error);
        }, error);
    }

    var writeFile = function (fileName, data, callback) {
        var callback = (callback) ? callback : function () { }
        self.fs.root.getFile(fileName, { create: true }, function (fileEntry) {

            fileEntry.createWriter(function (fileWriter) {
                var truncated = false;
                fileWriter.onwriteend = function (e) {
                    if (!truncated) {
                        truncated = true;
                        this.truncate(this.position);
                    }
                    callback(data);
                }
                fileWriter.onerror = function (e) {
                    console.log(e);
                }
                var blob = new Blob([data], { type: "text/plain" });
                fileWriter.write(blob);

            }, error);

        }, error);
    }

    var readFile = function (name, callback, errorCallback) {
        var callback = (callback) ? callback : function () { }
        var errorCallback = (errorCallback) ? errorCallback : function () { }
        self.fs.root.getFile(name, {}, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    callback(this.result);
                }
                reader.readAsText(file);
            }, errorCallback);

        });
    }

    var listFiles = function (dirEntry, callback) {
        var callback = (callback) ? callback : function () { }
        var dirReader = dirEntry.createReader();
        var list = [];
        dirReader.readEntries(function (results) {
            callback(results);
        }, error);
    }

    var listRootFiles = function (callback) {
        listFiles(self.fs.root, callback);
    }

    var listDirFiles = function (dirName, callback) {
        self.fs.root.getDirectory(dirName, {}, function (dirEntry) {
            listFiles(dirEntry, callback);
        }, error);
    }

    var createDir = function (dirName, callback) {
        self.fs.root.getDirectory(dirName, { create: true }, function () {
            callback();
        }, error);
    }

    var moveFile = function (dirEntry, fileEntry, callback) {
        fileEntry.moveTo(dirEntry, fileEntry.name, callback);
    }

    var moveFiles = function (dirName, fileEntryList, callback) {
        if (fileEntryList.length) {
            self.fs.root.getDirectory(dirName, {}, function (dirEntry) {
                var i = 0;
                var moveCb = function () {
                    i++;
                    if (fileEntryList.length == i) {
                        callback();
                    } else {
                        moveFile(dirEntry, fileEntryList[i], moveCb);
                    }
                }
                moveFile(dirEntry, fileEntryList[i], moveCb);
            }, error);
        } else {
            callback();
        }
    }

    var checkIfFileExists = function (name, callback) {
        self.fs.root.getFile(name, {}, function (fileEntry) {
            callback(true, fileEntry);
        }, function () {
            callback(false);
        });
    }

    var removeFile = function (name, callback) {
        var callback = (callback) ? callback : function () { }
        self.fs.root.getFile(name, {}, function (fileEntry) {
            fileEntry.remove(function () {
                callback();
            }, error);
        });
    }

    var removeAllFiles = function () {
        listRootFiles(function (fileEntryArray) {
            $.each(fileEntryArray, function (i, fileEntry) {
                fileEntry.remove(function () {

                }, error);
            });
        });
    }
    __construct();

}