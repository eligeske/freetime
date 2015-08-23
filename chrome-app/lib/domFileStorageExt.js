var DOMFileStorageExt = function (callback) {
    var self = this;
    var domFileStorage;
    var eventsDirName = "events";
    var settingsDirName = "settings";

    self.fs = null;

    var __construct = function () {
        domFileStorage = new DOMFileStorage(function (storage) {
            domFileStorage = storage;
            self.fs = domFileStorage.fs;
            // events
            self.listEvents = listEvents;
            self.writeEvent = writeEvent;
            self.readEvent = readEvent;
            self.removeEvent = removeEvent;
            // settings
            self.checkIfSettingsFileExists = checkIfSettingsFileExists;
            self.readUserSettings = readUserSettings;
            self.writeUserSettings = writeUserSettings;

            cleanRootDir(function () {
                callback(self);
            });
        });
    }

    var cleanRootDir = function (callback) {
        domFileStorage.listFiles(function (rootEntries) {
            var evDirExists = false;
            var setDirExists = false;
            var rootFiles = [];
            $.each(rootEntries, function (i, entry) {
                if (entry.isDirectory == true) {
                    if (entry.name == eventsDirName) {
                        evDirExists = true;
                    } else if (entry.name == settingsDirName) {
                        setDirExists = true;
                    }
                } else {
                    rootFiles.push(entry);
                }
            });

            var checkAndCreateEventsDir = function (cb) {
                if (!evDirExists) {
                    domFileStorage.createDir(eventsDirName, function () { cb(); });
                } else {
                    cb();
                }
            }
            var checkAndCreateSettingsDir = function (cb) {
                if (!setDirExists) {
                    domFileStorage.createDir(settingsDirName, function () { cb(); });
                } else {
                    cb();
                }
            }
            var moveRootFilesToEventDir = function (cb) {
                domFileStorage.moveFiles(eventsDirName, rootFiles, cb);
            }

            checkAndCreateEventsDir(function () {
                moveRootFilesToEventDir(function () {
                    checkAndCreateSettingsDir(function () {
                        callback();
                    });
                });
            });

        });
    }

    // events
    var getEventFullPathName = function (fileName) {
        return eventsDirName + "/" + fileName;
    }

    var listEvents = function (callback) {
        domFileStorage.listDirFiles(eventsDirName, callback);
    }

    var writeEvent = function (fileName, data, callback) {
        domFileStorage.writeFile(getEventFullPathName(fileName), data, callback);
    }

    var readEvent = function (fileName, callback, errorCallback) {
        domFileStorage.readFile(getEventFullPathName(fileName), callback, errorCallback);
    }

    var removeEvent = function (fileName, callback) {
        domFileStorage.removeFile(getEventFullPathName(fileName), callback);
    }

    // settings
    var getSettingsFullPathName = function (fileName) {
        return settingsDirName + "/" + fileName;
    }

    var checkIfSettingsFileExists = function (fileName, callback) {
        domFileStorage.checkIfFileExists(getSettingsFullPathName(fileName), function (exists) {
            callback(exists);
        });
    }

    var writeUserSettings = function (fileName, data, callback) {
        domFileStorage.writeFile(getSettingsFullPathName(fileName), data, callback);
    }

    var readUserSettings = function (fileName, callback, errorCallback) {
        domFileStorage.readFile(getSettingsFullPathName(fileName), callback, errorCallback);
    }


    __construct();
}