var MemoryStorage = function (storesObj, modelsObj, keysObj, cache, dataChanged) {
    var self = this;
    var storesObj = storesObj;
    var modelsObj = modelsObj;
    var keysObj = keysObj;
    var cache = cache;
    var dataChanged = dataChanged;
    var dataChangeTypes = {
        "update": 1,
        "insert": 2,
        "delete": 3
    }
    this.changeTypes = dataChangeTypes;

    var Store = function (modelName) {

        var modelName = modelName;

        var dataChangeListeners = []; // { owner: {}, callback: func }

        var dataStoreChanged = function (data,type) {
            dataChanged(data,type);
            $.each(dataChangeListeners, function (i,obj) {
                if (obj.owner) {
                    obj.callback(data,type);
                }
            });
        }

        this.listen = function (parentObj,callback) {
            dataChangeListeners.push({ owner: parentObj, callback: callback });
        }
        
        this.insert = function (data, callback) {
            data.id = keysObj[modelName]; keysObj[modelName] = keysObj[modelName] + 1;
            storesObj[modelName][data.id] = data;
            updateCache(data);
            dataStoreChanged(data,dataChangeTypes.insert);
            callback(data);
        }

        this.delete = function (data, callback) {
            if (storesObj[modelName][data.id]) {
                delete storesObj[modelName][data.id];
            }
            deleteFromCache(data);
            dataStoreChanged(data, dataChangeTypes.delete);
            callback(data);
        }

        this.readAll = function (callback) {
            callback(storesObj[modelName]);
        }

        this.readMany = function (key,value,callback) {
            if (value instanceof Array) {
                new Promise(function (resolve, reject) {
                    var data = [];
                    $.each(storesObj[modelName], function (i, row) {
                        if (value.indexOf(row[key]) > -1) {
                            data.push(row);
                        }
                    });
                    resolve(data);
                }).then(function (data) {
                    callback(data);
                });
            } else {
                new Promise(function (resolve, reject) {
                    var data = [];
                    $.each(storesObj[modelName], function (i, row) {
                        if (value == row[key]) {
                            data.push(row);
                        }
                    });
                    resolve(data);
                }).then(function (data) {
                    callback(data);
                });
            }
        }

        this.readSingle = function (key,value,callback) {
            new Promise(function (resolve, reject) {
                var data;
                $.each(storesObj[modelName], function (i, row) {
                    if (value == row[key]) {
                        data = row; return;
                    }
                });
                resolve(data);
            }).then(function (data) {
                callback(data);
            });
        }

        this.update = function (data,callback) {
            new Promise(function (resolve, reject) {
                // get by array key and check if key matches id for quicker return
                if (storesObj[modelName][data.id].id == data.id) {
                    var beforeData = _.clone(storesObj[modelName][data.id]);
                    _updateDataModel(storesObj[modelName][data.id], data); 
                } else {
                    // if key does not match id then loop through and find right key
                    $.each(storesObj[modelName], function (i, row) {
                        if (data.id == row.id) {
                            var beforeData = _.clone(storesObj[modelName][i]);
                            _updateDataModel(storesObj[modelName][i], data);
                            return;
                        }
                    });
                }
                
                resolve([data, beforeData]);
            }).then(function (arrData) {
                updateCache(arrData[0], arrData[1]);
                dataStoreChanged(arrData[0], dataChangeTypes.update);
                callback(arrData[0]);
            });
        }
        var loadCache = function () {
            this.readAll(function (dataArray) {
                $.each(dataArray, function (i, dataRow) {
                    updateCache(dataRow);
                });
            });
        }
        var updateCache = function (dataRow, beforeData) {
            if (!cache[modelName]) { return; }
            $.each(cache[modelName], function (key, obj) {
                if (beforeData && dataRow[key] != beforeData[key]) {
                    delete obj[beforeData[key]];
                }
                obj[dataRow[key]] = dataRow;
            });
        }
        var deleteFromCache = function (dataRow) {
            if (!cache[modelName]) { return; }
            $.each(cache[modelName], function (key, obj) {
                delete obj[dataRow[key]];
            });
        }

        loadCache.call(this, loadCache);

        var _updateDataModel = function (rowData,newData) {
            $.each(rowData, function (prop, val) {
                if (newData[prop] != undefined) {
                    rowData[prop] = newData[prop];
                }
            });
        }
    }

    $.each(modelsObj, function (modelName,model) {
        self[modelName] = new Store(modelName);
    });
    

}
