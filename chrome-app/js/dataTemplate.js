var DataTemplate = {
    cacheTemplate: {
        Racer: {
            id: {},
            bib: {}
        },
        PodiumCategory: {
            id: {}
        },
        RacerStart: {
            racerId: {}
        },
        CategoryStart: {
            podiumCategoryId: {}
        }
    },
    eventTemplate: {
        "settings": {
            "id": "",
            "name": "",
            "date": "",
            "timingType": ""
        },
        "model": {
            "Racer": {
                "id": "", "bib": "", "firstName": "", "lastName": "", "age": "",
                "gender": "", "team": "", "podiumCategoryId": "", "teamMembers":[]
            },
            "PodiumCategory": {
                "id": "", "name": "", "numberOfLaps": ""
            },
            "CategoryStart": {
                "id": "", "timestamp": "", "podiumCategoryId": ""
            },
            "RacerStart": {
                "id": "", "timestamp": "", "racerId": ""
            },
            "Lap": {
                "id": "", "racerId": "", "bib": "", "timestamp": ""
            }
        },
        "storage": {
            "Racer": {},
            "PodiumCategory": {},
            "TimingGroup": {},
            "Lap": {},
            "CategoryStart": {},
            "RacerStart": {}
        },
        "primaryKey": {
            "Racer": 1,
            "PodiumCategory": 1,
            "TimingGroup": 1,
            "Lap": 1,
            "CategoryStart": 1,
            "RacerStart": 1
        }
    }
       
}