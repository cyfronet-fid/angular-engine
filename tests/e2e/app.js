angular.module('engine-test-app', ['ngRoute', 'engine', 'ngMockE2E'])
    .config(function ($engineProvider) {
        $engineProvider.document('proposal', '/proposal', {
                caption: "Proposals list",
                columns: [
                    {'name': 'id'},
                    {'name': 'title', type: 'link'},
                    {'name': 'beamline', 'css': 'text-center'},
                    {'name': 'status', 'css': 'text-center table-status', 'css_header': 'text-center'},
                    {'name': 'createdAt', 'caption': 'Created', 'css': 'text-center', type: 'date'},
                ]
            },
            '/proposal/:id', {caption: "Proposals"},
            'proposalDraftsCustomer');
        $engineProvider.document('openCall', '/openCall', {}, '/openCall/:id', {}, 'review');
        $engineProvider.document('sla', '/sla', {}, '/sla/:id', {}, 'workingSla');

        $engineProvider.subdocument('sample', {caption: "References",
            columns: [{'name': 'id', 'caption': '#'},
                {'name': 'type', 'css': 'text-center'},
                {'name': 'substance', 'css': 'text-center'},
                {'name': 'risk', 'css': 'text-center'}]},
            {}, true);

        $engineProvider.subdocument('publication', {caption: "Publications",
            columns: [{'name': 'id', 'caption': '#'},
                {'name': 'title', 'css': 'text-center'},
                {'name': 'year', 'css': 'text-center'},
                {'name': 'authors', 'css': 'text-center'},
                {'name': 'uoLibrary', 'caption': "UO Library", 'css': 'text-center'}]},
            {}, true);

        $engineProvider.setBaseUrl('/engine/rest');
    })
    .config(function ($routeProvider) {
        $routeProvider.otherwise('/proposal')
    });

angular.module('engine-test-app').controller('MainCtrl', function ($engine, $httpBackend) {
    $httpBackend.whenGET($engine.baseUrl + '/query/documents?queryId=proposalDraftsCustomer').respond(
        {
            data: [{
                "id": 25,
                "description": null,
                "shift": 0,
                "start": null,
                "title": "12",
                "attachments": [],
                "previousProposal": null,
                "publications": [],
                "submissionType": null,
                "keywords": null,
                "explanation": null,
                "end": null,
                "status": "DRAFT",
                "beamline": null,
                "createdAt": 1477607621000,
                "periodType": null,
                "discipline": null,
                "subDiscipline": null,
                "peemEndStation": false,
                "xasEndStation": false,
                "userEndStation": false,
                "photonEnergyRange": 0,
                "linearHorizontalPhotonPolarization": false,
                "linearVerticalPhotonPolarization": false,
                "circularElipticalPhotonPolarization": false,
                "totalElectronMeasurementType": false,
                "fluorescenceYieldMeasurementType": false,
                "transmissionMeasurementType": false,
                "linearSkewed": false,
                "fromTemperature": 0,
                "toTemperature": 0,
                "samplePreparationInSitu": false,
                "evaporation": false,
                "arSputtering": false,
                "evaporationMaterial": null,
                "evaporationThickness": null,
                "cryogenicTemperature": null,
                "acceptTermsAndConditions": false,
                "photonEnergyResolution": 0,
                "higherHarmonicContamination": 0,
                "heating": false,
                "temperatureFrom": 0,
                "temperatureTo": 0,
                "gasDosing": false,
                "gasName": null,
                "gasAmount": null,
                "highVoltage": false,
                "shifts": 0,
                "nextProposals": [],
                "proposalAbstract": null,
                "descriptionFile": null,
                "objectives": null,
                "background": null,
                "purpose": null,
                "submittedSomewhereElse": false,
                "continuation": false,
                "proposalReferences": null,
                "laboratoryUsage": false,
                "processes": null,
                "equipmentAndProductsProvidedBySolaris": null,
                "equipmentBrought": null,
                "otherRequirements": null
            }], msg: null
        }
    );
    $httpBackend.whenGET($engine.baseUrl + '/query/documents?queryId=workingSla').respond(
        {
            "data": [
                {
                    "id": "57fe0eafe62091bd1e621e5a",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "NAsrgTjrsE",
                    "slaUuid": "BYOzkAtLyM",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe0ff4e62091bd1e621e5b",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "SQaGcgGDRU",
                    "slaUuid": "bxphQmNJbI",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe100de62091bd1e621e5c",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "ZtyQbOyLGP",
                    "slaUuid": "kgekhWLdji",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1014e62091bd1e621e5d",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "bWZqTnQXst",
                    "slaUuid": "MqyKxvObZh",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1021e62091bd1e621e5e",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "kuywSsdzYY",
                    "slaUuid": "nZmWXmVskB",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe116ce620a7cab55d26ff",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "tdbrwbCEhx",
                    "slaUuid": "rukJTAxRqq",
                    "team": null,
                    "author": null,
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1467e6204d016aac46a9",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "LaPLtzjxQo",
                    "slaUuid": "LkBrxmtHPp",
                    "team": null,
                    "author": "admin",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe146de62091bd1e621e5f",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "KQzPtdXbtA",
                    "slaUuid": "OXZefMFeVu",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe14b4e62025cc9dab822b",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "bnWxIWuoac",
                    "slaUuid": "pfBogokjHt",
                    "team": null,
                    "author": "0",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe14dbe62091bd1e621e60",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "mAHjjTMddL",
                    "slaUuid": "kreKCEhUuw",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe16ebe62099c817395117",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "mwpZxUFURR",
                    "slaUuid": "YFUhFazjOO",
                    "team": null,
                    "author": "admin",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1741e6201f933ec7922b",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "iCSiTjgyaV",
                    "slaUuid": "RpvRpPYXPY",
                    "team": null,
                    "author": "admin",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1a0ce620c7bb38faaddf",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "TEST_NAME",
                    "isLeaf": true,
                    "rootUuid": "WzSbnPuqUT",
                    "slaUuid": "gTQVQyjVFJ",
                    "team": null,
                    "author": "admin",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1a2be6208be98ec11570",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": "test",
                    "isLeaf": true,
                    "rootUuid": "leZKiuYDiH",
                    "slaUuid": "gkxYOgMaiG",
                    "team": null,
                    "author": "3",
                    "relatedDocumentsForQuery": null,
                    "site": "BARI",
                    "siteName": null
                },
                {
                    "id": "57fe1a87e6205f906b08216a",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "SqBOgWxLaW",
                    "slaUuid": "sdUpXFMfsb",
                    "team": null,
                    "author": null,
                    "relatedDocumentsForQuery": null,
                    "site": null,
                    "siteName": null
                },
                {
                    "id": "57fe1ab8e62082b6499b6388",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": true,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "dvTZRhvWfg",
                    "slaUuid": "cvzDbrQXth",
                    "team": null,
                    "author": null,
                    "relatedDocumentsForQuery": null,
                    "site": null,
                    "siteName": null
                },
                {
                    "id": "58062547e620c1f46b33880f",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": false,
                    "name": "4401ac5dc8cfbbb737b0a025758cf045",
                    "isLeaf": true,
                    "rootUuid": "fUnaOiXBgS",
                    "slaUuid": "UCDSPUmdUb",
                    "team": null,
                    "author": "6",
                    "relatedDocumentsForQuery": null,
                    "site": "",
                    "siteName": null
                },
                {
                    "id": "58062a74e62036cbaa4941bb",
                    "parentId": null,
                    "states": {
                        "serviceType": "computing",
                        "documentType": "sla",
                        "mainState": "draft"
                    },
                    "metrics": {
                        "publicIP-totalGuaranteed": null,
                        "publicIP-userLimit": null,
                        "computingTime-totalLimit": null,
                        "computingTime-userGuaranteed": null,
                        "publicIP-totalLimit": null,
                        "computingTime-instanceGuaranteed": null,
                        "publicIP-instanceGuaranteed": null,
                        "computingTime-instanceLimit": null,
                        "publicIP-userGuaranteed": null,
                        "computingTime-userLimit": null,
                        "publicIP-instanceLimit": null,
                        "computingTime-totalGuaranteed": null
                    },
                    "hasValidMetrics": false,
                    "name": null,
                    "isLeaf": true,
                    "rootUuid": "gRZRBwkkgi",
                    "slaUuid": "gYLArkDVJM",
                    "team": null,
                    "author": "9",
                    "relatedDocumentsForQuery": null,
                    "site": "test",
                    "siteName": null
                }
            ],
            "msg": null
        }
    );
    $httpBackend.whenGET($engine.baseUrl + '/query/documents-with-extra-data?queryId=workingSla').respond(
        {
            "data": [
                {
                    "document": {
                        "id": "57fe0eafe62091bd1e621e5a",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "NAsrgTjrsE",
                        "slaUuid": "BYOzkAtLyM",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe0ff4e62091bd1e621e5b",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "SQaGcgGDRU",
                        "slaUuid": "bxphQmNJbI",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe100de62091bd1e621e5c",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "ZtyQbOyLGP",
                        "slaUuid": "kgekhWLdji",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1014e62091bd1e621e5d",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "bWZqTnQXst",
                        "slaUuid": "MqyKxvObZh",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1021e62091bd1e621e5e",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "kuywSsdzYY",
                        "slaUuid": "nZmWXmVskB",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe116ce620a7cab55d26ff",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "tdbrwbCEhx",
                        "slaUuid": "rukJTAxRqq",
                        "team": null,
                        "author": null,
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1467e6204d016aac46a9",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "LaPLtzjxQo",
                        "slaUuid": "LkBrxmtHPp",
                        "team": null,
                        "author": "admin",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe146de62091bd1e621e5f",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "KQzPtdXbtA",
                        "slaUuid": "OXZefMFeVu",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe14b4e62025cc9dab822b",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "bnWxIWuoac",
                        "slaUuid": "pfBogokjHt",
                        "team": null,
                        "author": "0",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe14dbe62091bd1e621e60",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "mAHjjTMddL",
                        "slaUuid": "kreKCEhUuw",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe16ebe62099c817395117",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "mwpZxUFURR",
                        "slaUuid": "YFUhFazjOO",
                        "team": null,
                        "author": "admin",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1741e6201f933ec7922b",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "iCSiTjgyaV",
                        "slaUuid": "RpvRpPYXPY",
                        "team": null,
                        "author": "admin",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1a0ce620c7bb38faaddf",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "TEST_NAME",
                        "isLeaf": true,
                        "rootUuid": "WzSbnPuqUT",
                        "slaUuid": "gTQVQyjVFJ",
                        "team": null,
                        "author": "admin",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1a2be6208be98ec11570",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": "test",
                        "isLeaf": true,
                        "rootUuid": "leZKiuYDiH",
                        "slaUuid": "gkxYOgMaiG",
                        "team": null,
                        "author": "3",
                        "relatedDocumentsForQuery": null,
                        "site": "BARI",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1a87e6205f906b08216a",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "SqBOgWxLaW",
                        "slaUuid": "sdUpXFMfsb",
                        "team": null,
                        "author": null,
                        "relatedDocumentsForQuery": null,
                        "site": null,
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "57fe1ab8e62082b6499b6388",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": true,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "dvTZRhvWfg",
                        "slaUuid": "cvzDbrQXth",
                        "team": null,
                        "author": null,
                        "relatedDocumentsForQuery": null,
                        "site": null,
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "58062547e620c1f46b33880f",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": false,
                        "name": "4401ac5dc8cfbbb737b0a025758cf045",
                        "isLeaf": true,
                        "rootUuid": "fUnaOiXBgS",
                        "slaUuid": "UCDSPUmdUb",
                        "team": null,
                        "author": "6",
                        "relatedDocumentsForQuery": null,
                        "site": "",
                        "siteName": null
                    },
                    "actions": null
                },
                {
                    "document": {
                        "id": "58062a74e62036cbaa4941bb",
                        "parentId": null,
                        "states": {
                            "serviceType": "computing",
                            "documentType": "sla",
                            "mainState": "draft"
                        },
                        "metrics": {
                            "publicIP-totalGuaranteed": null,
                            "publicIP-userLimit": null,
                            "computingTime-totalLimit": null,
                            "computingTime-userGuaranteed": null,
                            "publicIP-totalLimit": null,
                            "computingTime-instanceGuaranteed": null,
                            "publicIP-instanceGuaranteed": null,
                            "computingTime-instanceLimit": null,
                            "publicIP-userGuaranteed": null,
                            "computingTime-userLimit": null,
                            "publicIP-instanceLimit": null,
                            "computingTime-totalGuaranteed": null
                        },
                        "hasValidMetrics": false,
                        "name": null,
                        "isLeaf": true,
                        "rootUuid": "gRZRBwkkgi",
                        "slaUuid": "gYLArkDVJM",
                        "team": null,
                        "author": "9",
                        "relatedDocumentsForQuery": null,
                        "site": "test",
                        "siteName": null
                    },
                    "actions": null
                }
            ],
            "msg": null
        }
    );




    var metrics_request_body = '{"states": {"documentType": "proposal"},"metrics": null}';

    $httpBackend.whenPOST($engine.baseUrl + '/metrics').respond(function (method, url, data, headers, params) {
        data = angular.fromJson(data);
        //indigo slam
        // "documentType": "sla"
        if(data.states.documentType == 'sla'){
            return [200, {
                "data": [
                    {
                        "id": "startComp",
                        "label": "Start",
                        "unit": null,
                        "description": "When u wish your SLA to activate",
                        "required": true,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": null,
                        "visualClass": null
                    },
                    {
                        "id": "endComp",
                        "label": "end",
                        "unit": null,
                        "description": "When u wish your SLA to finish",
                        "required": true,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": null,
                        "visualClass": null
                    },
                    {
                        "id": "computing_time-total_guaranteed",
                        "label": "Total guaranteed computing time",
                        "unit": "h",
                        "description": "The guaranteed quantity of computing time to be granted to the user group in total",
                        "required": false,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "0",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "computing_time-total_limit",
                        "label": "Total limit of computing time",
                        "unit": "h",
                        "description": "The limit of computing time for the user group in total",
                        "required": false,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "0",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "computing_time-instance_limit",
                        "label": "Instance limit of computing time",
                        "unit": "h",
                        "description": "The limit of a resource for each instance",
                        "required": false,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "0",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "computing_time-user_guaranteed",
                        "label": "User guaranteed computing time",
                        "unit": "h",
                        "description": "The guaranteed quantity of a resource to be granted to each user",
                        "required": false,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "1",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "computing_time-user_limit",
                        "label": "User limit of computing time",
                        "unit": "h",
                        "description": "The limit of a resource for each user",
                        "required": false,
                        "categoryId": "computingTimeRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "0",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "public_ip-total_guaranteed",
                        "label": "Total guaranteed public IPs",
                        "unit": "none",
                        "description": "The guaranteed quantity of public ip to be granted to the user group in total",
                        "required": false,
                        "categoryId": "publicIPRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "0",
                        "maxValue": "100000000"
                    },
                    {
                        "id": "public_ip-total_limit",
                        "label": "Total limit of public IPs",
                        "unit": "none",
                        "description": "The limit of public IPs for the user group in total",
                        "required": false,
                        "categoryId": "publicIPRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "1",
                        "maxValue": "255"
                    },
                    {
                        "id": "public_ip-user_guaranteed",
                        "label": "User guaranteed public IPs",
                        "unit": "none",
                        "description": "The guaranteed quantity of a resource to be granted to each user",
                        "required": false,
                        "categoryId": "publicIPRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "1",
                        "maxValue": "255"
                    },
                    {
                        "id": "public_ip-user_limit",
                        "label": "User limit of public IPs",
                        "unit": "none",
                        "description": "The limit of a resource for each user",
                        "required": false,
                        "categoryId": "publicIPRestrictions",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": null,
                        "visualClass": null,
                        "minValue": "1",
                        "maxValue": "255"
                    }
                ],
                "msg": null
            }]
        }
        //duo
        //openCall
        else if(data.states.documentType == 'openCall'){
            return [200, {
                "data": [
                    {
                        "id": "OpenCallBeamline",
                        "label": "OpenCallBeamline",
                        "unit": null,
                        "description": "Beamlines available in open call",
                        "required": true,
                        "categoryId": "openCallForm",
                        "position": 1,
                        "defaultValue": "PEM",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "openCall"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "PEM",
                                "constraint": null
                            },
                            {
                                "value": "UARPES",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "PEM",
                            "UARPES"
                        ]
                    },
                    {
                        "id": "startSubmission",
                        "label": "start Submission",
                        "unit": null,
                        "description": "Start of submission period",
                        "required": true,
                        "categoryId": "openCallForm",
                        "position": 2,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "openCall"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    },
                    {
                        "id": "endSubmission",
                        "label": "end Submission",
                        "unit": null,
                        "description": "End of submission period",
                        "required": true,
                        "categoryId": "openCallForm",
                        "position": 3,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "openCall"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    },
                    {
                        "id": "startExperiment",
                        "label": "start Experiment",
                        "unit": null,
                        "description": "Start of Experiment period",
                        "required": true,
                        "categoryId": "openCallForm",
                        "position": 4,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "openCall"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    },
                    {
                        "id": "endExperiment",
                        "label": "end Experiment",
                        "unit": null,
                        "description": "End of Experiment period",
                        "required": true,
                        "categoryId": "openCallForm",
                        "position": 5,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "openCall"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    }
                ],
                "msg": null
            }]
        }
        //duo
        //proposal
        else if(data.states.documentType == 'proposal'){
            return [200, {
                "data": [
                    {
                        "id": "Keywords",
                        "label": "labProposalKeywords",
                        "unit": null,
                        "description": "List of customer defined keywords (max.5)",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "shortString"
                        ]
                    },
                    {
                        "id": "UserCategory",
                        "label": "labUserCategory",
                        "unit": null,
                        "description": "User category required for way for light",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": "General",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "General",
                                "constraint": null
                            },
                            {
                                "value": "EU Funded",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "General",
                            "EU Funded"
                        ]
                    },
                    {
                        "id": "ProposalCategory",
                        "label": "labProposalCategory",
                        "unit": null,
                        "description": "User category required for way for light",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": "New",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "New",
                                "constraint": null
                            },
                            {
                                "value": "Continuation",
                                "constraint": null
                            },
                            {
                                "value": "Resubmition",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "New",
                            "Continuation",
                            "Resubmition"
                        ]
                    },
                    {
                        "id": "FinancialSupport",
                        "label": "labFinancialSupport",
                        "unit": null,
                        "description": "At present it is not possible to apply for EU support in Solaris",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": "false",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "checkbox"
                        ],
                        "options": [
                            {
                                "value": "false",
                                "constraint": null
                            },
                            {
                                "value": "true",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "false",
                            "true"
                        ]
                    },
                    {
                        "id": "start",
                        "label": "Start",
                        "unit": null,
                        "description": "Start date of the experiment",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    },
                    {
                        "id": "end",
                        "label": "end",
                        "unit": null,
                        "description": "End date of the experiment",
                        "required": true,
                        "categoryId": "documentationSettings",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "DATE",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "date"
                        ]
                    },
                    {
                        "id": "ExperimentType",
                        "label": "labExperimentType",
                        "unit": null,
                        "description": "Type of experiment",
                        "required": true,
                        "categoryId": "ExperimentCategory",
                        "position": 0,
                        "defaultValue": "Standard",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Standard",
                                "constraint": null
                            },
                            {
                                "value": "Long",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Standard",
                            "Long"
                        ]
                    },
                    {
                        "id": "Discipline",
                        "label": "labDiscipline",
                        "unit": null,
                        "description": "Discipline",
                        "required": true,
                        "categoryId": "ExperimentCategory",
                        "position": 0,
                        "defaultValue": "Physics",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Physics",
                                "constraint": null
                            },
                            {
                                "value": "Chemistry",
                                "constraint": null
                            },
                            {
                                "value": "Life Sciences & Biotech",
                                "constraint": null
                            },
                            {
                                "value": "Earth Sciences & Environment",
                                "constraint": null
                            },
                            {
                                "value": "Engineering & Technology",
                                "constraint": null
                            },
                            {
                                "value": "Mathematics",
                                "constraint": null
                            },
                            {
                                "value": "Information & Communication Technologies",
                                "constraint": null
                            },
                            {
                                "value": "Material Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Energy",
                                "constraint": null
                            },
                            {
                                "value": "Social Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Humanities",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Physics",
                            "Chemistry",
                            "Life Sciences & Biotech",
                            "Earth Sciences & Environment",
                            "Engineering & Technology",
                            "Mathematics",
                            "Information & Communication Technologies",
                            "Material Sciences",
                            "Energy",
                            "Social Sciences",
                            "Humanities"
                        ]
                    },
                    {
                        "id": "SpecificDiscipline",
                        "label": "labSpecificDiscipline",
                        "unit": null,
                        "description": "SpecificDiscipline. Not available if there is no sub discipline for given discipline",
                        "required": true,
                        "categoryId": "ExperimentCategory",
                        "position": 0,
                        "defaultValue": "Physics",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Astronomy / Astrophysics / Astroparticles",
                                "constraint": null
                            },
                            {
                                "value": "Atomic & molecular physics",
                                "constraint": null
                            },
                            {
                                "value": "Condensed matter physics",
                                "constraint": null
                            },
                            {
                                "value": "High energy and particle physics",
                                "constraint": null
                            },
                            {
                                "value": "Nuclear physics",
                                "constraint": null
                            },
                            {
                                "value": "Plasma physics",
                                "constraint": null
                            },
                            {
                                "value": "Quantum electronics & optics",
                                "constraint": null
                            },
                            {
                                "value": "Other - Physics",
                                "constraint": null
                            },
                            {
                                "value": "Chemistry",
                                "constraint": null
                            },
                            {
                                "value": "Food quality and safety",
                                "constraint": null
                            },
                            {
                                "value": "Agriculture & Fisheries",
                                "constraint": null
                            },
                            {
                                "value": "Medicine",
                                "constraint": null
                            },
                            {
                                "value": "Veterinary sciences",
                                "constraint": null
                            },
                            {
                                "value": "Molecular and cellular biology",
                                "constraint": null
                            },
                            {
                                "value": "Other - Life Sciences & Biotech",
                                "constraint": null
                            },
                            {
                                "value": "Global change & Climate observation",
                                "constraint": null
                            },
                            {
                                "value": "Ecosystems & Biodiversity",
                                "constraint": null
                            },
                            {
                                "value": "Natural disaster & Desertification",
                                "constraint": null
                            },
                            {
                                "value": "Marine science & Oceanography",
                                "constraint": null
                            },
                            {
                                "value": "Water sciences & Hydrology",
                                "constraint": null
                            },
                            {
                                "value": "Other - Earth Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Other - Environment",
                                "constraint": null
                            },
                            {
                                "value": "Aeronautics",
                                "constraint": null
                            },
                            {
                                "value": "Space",
                                "constraint": null
                            },
                            {
                                "value": "New production processes",
                                "constraint": null
                            },
                            {
                                "value": "Nanotechnology & Nanosciences",
                                "constraint": null
                            },
                            {
                                "value": "Transport",
                                "constraint": null
                            },
                            {
                                "value": "Other - Engineering & Technology",
                                "constraint": null
                            },
                            {
                                "value": "Mathematics",
                                "constraint": null
                            },
                            {
                                "value": "IST for citizens, businesses & organizations",
                                "constraint": null
                            },
                            {
                                "value": "Trust & Security",
                                "constraint": null
                            },
                            {
                                "value": "Communication & Networks",
                                "constraint": null
                            },
                            {
                                "value": "Computing & software technologies",
                                "constraint": null
                            },
                            {
                                "value": "Components & Micro - systems",
                                "constraint": null
                            },
                            {
                                "value": "Knowledge & interface technologies",
                                "constraint": null
                            },
                            {
                                "value": "Other - ICT",
                                "constraint": null
                            },
                            {
                                "value": "Knowledge based multifunctional materials",
                                "constraint": null
                            },
                            {
                                "value": "Other - Material Science",
                                "constraint": null
                            },
                            {
                                "value": "Sustainable energy systems",
                                "constraint": null
                            },
                            {
                                "value": "Fusion",
                                "constraint": null
                            },
                            {
                                "value": "Other - Energy",
                                "constraint": null
                            },
                            {
                                "value": "Economics",
                                "constraint": null
                            },
                            {
                                "value": "Political Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Educational Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Law",
                                "constraint": null
                            },
                            {
                                "value": "Demography",
                                "constraint": null
                            },
                            {
                                "value": "Other - Social Sciences",
                                "constraint": null
                            },
                            {
                                "value": "Arts",
                                "constraint": null
                            },
                            {
                                "value": "History",
                                "constraint": null
                            },
                            {
                                "value": "Languages",
                                "constraint": null
                            },
                            {
                                "value": "Other - Humanities",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Astronomy / Astrophysics / Astroparticles",
                            "Atomic & molecular physics",
                            "Condensed matter physics",
                            "High energy and particle physics",
                            "Nuclear physics",
                            "Plasma physics",
                            "Quantum electronics & optics",
                            "Other - Physics",
                            "Chemistry",
                            "Food quality and safety",
                            "Agriculture & Fisheries",
                            "Medicine",
                            "Veterinary sciences",
                            "Molecular and cellular biology",
                            "Other - Life Sciences & Biotech",
                            "Global change & Climate observation",
                            "Ecosystems & Biodiversity",
                            "Natural disaster & Desertification",
                            "Marine science & Oceanography",
                            "Water sciences & Hydrology",
                            "Other - Earth Sciences",
                            "Other - Environment",
                            "Aeronautics",
                            "Space",
                            "New production processes",
                            "Nanotechnology & Nanosciences",
                            "Transport",
                            "Other - Engineering & Technology",
                            "Mathematics",
                            "IST for citizens, businesses & organizations",
                            "Trust & Security",
                            "Communication & Networks",
                            "Computing & software technologies",
                            "Components & Micro - systems",
                            "Knowledge & interface technologies",
                            "Other - ICT",
                            "Knowledge based multifunctional materials",
                            "Other - Material Science",
                            "Sustainable energy systems",
                            "Fusion",
                            "Other - Energy",
                            "Economics",
                            "Political Sciences",
                            "Educational Sciences",
                            "Law",
                            "Demography",
                            "Other - Social Sciences",
                            "Arts",
                            "History",
                            "Languages",
                            "Other - Humanities"
                        ]
                    },
                    {
                        "id": "EndStationPEM",
                        "label": "labEndStationPEM",
                        "unit": null,
                        "description": "Endstation for given beamline",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "PEEM",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "PEEM",
                                "constraint": null
                            },
                            {
                                "value": "XAS Chamber",
                                "constraint": null
                            },
                            {
                                "value": "User endstation",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "PEEM",
                            "XAS Chamber",
                            "User endstation"
                        ]
                    },
                    {
                        "id": "EndStationUARPES",
                        "label": "labEndStationUARPES",
                        "unit": null,
                        "description": "Endstation for given beamline",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "UARPES",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "UARPES",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "UARPES"
                        ]
                    },
                    {
                        "id": "labNumberOfShiftsPEM",
                        "label": "labNumberOfShiftsPEM",
                        "unit": null,
                        "description": "Number of shifts (24h) required",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "smallInteget"
                        ],
                        "minValue": "1",
                        "maxValue": "30"
                    },
                    {
                        "id": "labNumberOfShiftsUARPES",
                        "label": "labNumberOfShiftsUARPES",
                        "unit": null,
                        "description": "Number of shifts (24h) required",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "smallInteget"
                        ],
                        "minValue": "1",
                        "maxValue": "30"
                    },
                    {
                        "id": "PhotonEnergyRange",
                        "label": "labPhotonEnergyRange",
                        "unit": "eV",
                        "description": "",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "200.0",
                        "maxValue": "2000.0"
                    },
                    {
                        "id": "PhotonPolarisationHorizontal",
                        "label": "Photon Polarisation Linear Horizontal",
                        "unit": null,
                        "description": "Photon polarization Linear Horizontal",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonPolarisationVertical",
                        "label": "Photon Polarisation Linear vertical",
                        "unit": null,
                        "description": "Photon polarization Linear vertical",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonPolarisationCircular",
                        "label": "Photon Polarisation Linear vertical",
                        "unit": null,
                        "description": "Photon polarization Circular/Eliptical",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonEnergyRange",
                        "label": "Photon Energy Range",
                        "unit": "mbar",
                        "description": "",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "0.00000000001",
                        "maxValue": "10.0"
                    },
                    {
                        "id": "MeasurementType",
                        "label": "Measurement Type",
                        "unit": null,
                        "description": "Measurement type",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Total electron",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Total electron",
                                "constraint": null
                            },
                            {
                                "value": "Fluorescence yield",
                                "constraint": null
                            },
                            {
                                "value": "Transmission",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Total electron",
                            "Fluorescence yield",
                            "Transmission"
                        ]
                    },
                    {
                        "id": "TemperatureRangeMin",
                        "label": "Temperature Range Min",
                        "unit": "K",
                        "description": "Minimum temperature [K]",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "5",
                        "maxValue": "2300"
                    },
                    {
                        "id": "TemperatureRangeMax",
                        "label": "Temperature Range Max",
                        "unit": "K",
                        "description": "Maximum temperature [K]",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "5",
                        "maxValue": "2300"
                    },
                    {
                        "id": "SamplePreparationInSitu",
                        "label": "labSamplePreparationInSitu",
                        "unit": null,
                        "description": "Sample preparation in situ",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "Evaporation",
                        "label": "labEvaporation",
                        "unit": null,
                        "description": "Evaporation",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "ArSputtering",
                        "label": "labArSputtering",
                        "unit": null,
                        "description": "Ar-Sputtering",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "CryogenicTemperature",
                        "label": "labCryogenicTemperature",
                        "unit": null,
                        "description": "Ar-Sputtering",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "None",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "None",
                                "constraint": null
                            },
                            {
                                "value": "From 80 K",
                                "constraint": null
                            },
                            {
                                "value": "From 20 K",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "None",
                            "From 80 K",
                            "From 20 K"
                        ]
                    },
                    {
                        "id": "HighVoltage",
                        "label": "High Voltage",
                        "unit": null,
                        "description": "High voltage",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "GasDosing",
                        "label": "Gas Dosing",
                        "unit": null,
                        "description": "Gas dosing",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "GasName",
                        "label": "Gas Name",
                        "unit": null,
                        "description": "Gas name",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "shortString"
                        ]
                    },
                    {
                        "id": "GasAmount",
                        "label": "Gas Amount",
                        "unit": null,
                        "description": "Gas nosing",
                        "required": true,
                        "categoryId": "BeamlinesPEM",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "PhotonEnergyRangeUARPESMin",
                        "label": "labPhotonEnergyRangeMin",
                        "unit": "eV",
                        "description": "Photon energy range min",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "8.0",
                        "maxValue": "100.0"
                    },
                    {
                        "id": "PhotonEnergyRangeUARPESMax",
                        "label": "labPhotonEnergyRangeMax",
                        "unit": "eV",
                        "description": "Photon energy range min",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "8.0",
                        "maxValue": "100.0"
                    },
                    {
                        "id": "PhotonEnergyResolution",
                        "label": "labPhotonEnergyResolution",
                        "unit": null,
                        "description": "Photon energy resolution",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "0.0",
                        "maxValue": "20000.0"
                    },
                    {
                        "id": "PhotonPolarisationHorizontalUARPES",
                        "label": "labPhotonPolarisation",
                        "unit": null,
                        "description": "Photon polarization Linear horizontal",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonPolarisationLinearUARPES",
                        "label": "Photon polarization Linear vertical",
                        "unit": null,
                        "description": "Photon polarization Linear vertical",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonPolarisationCircularUARPES",
                        "label": "Photon polarization Circular/Eliptical",
                        "unit": null,
                        "description": "Photon polarization Circular/Eliptical",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "PhotonPolarisationSkewedUARPES",
                        "label": "Photon polarization Linear Skewed",
                        "unit": null,
                        "description": "Photon polarization Linear Skewed",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "AcceptableHigherHarmonicContamination",
                        "label": "labAcceptableHigherHarmonicContamination",
                        "unit": null,
                        "description": "Acceptable higher harmonic contamination (>10e-4)",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "Heating",
                        "label": "labHeating",
                        "unit": null,
                        "description": "Heating",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "EvaporationUARPES",
                        "label": "Evaporation",
                        "unit": null,
                        "description": "Evaporation",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "EvaporationMaterial",
                        "label": "labEvaporationMaterial",
                        "unit": null,
                        "description": "Evaporation material",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "shortString"
                        ]
                    },
                    {
                        "id": "EvaporationThickness",
                        "label": "labEvaporationThickness",
                        "unit": null,
                        "description": "Evaporation thickness",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "shortString"
                        ]
                    },
                    {
                        "id": "SampleTemperatureDuringDataExpositionMin",
                        "label": "labSampleTemperatureDuringDataExpositionMin",
                        "unit": "K",
                        "description": "Sample min temperature during data exposition [K]",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "8",
                        "maxValue": "500"
                    },
                    {
                        "id": "SampleTemperatureDuringDataExpositionMax",
                        "label": "labSampleTemperatureDuringDataExpositionMax",
                        "unit": "K",
                        "description": "Sample max temperature during data exposition [K]",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": "8",
                        "maxValue": "500"
                    },
                    {
                        "id": "GasDosingUARPES",
                        "label": "labGasDosing",
                        "unit": null,
                        "description": "Gas dosing",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "GasNameUARPES",
                        "label": "labGasDosing",
                        "unit": null,
                        "description": "Gas name",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "shortString"
                        ]
                    },
                    {
                        "id": "GasAmountUARPES",
                        "label": "labGasAmount",
                        "unit": null,
                        "description": "Gas nosing",
                        "required": true,
                        "categoryId": "BeamlinesUARPES",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "ExpAbstract",
                        "label": "labExpAbstract",
                        "unit": null,
                        "description": "Abstract",
                        "required": true,
                        "categoryId": "ExperimentDescription",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpDescription",
                        "label": "labExpDescription",
                        "unit": null,
                        "description": "Abstract",
                        "required": true,
                        "categoryId": "ExperimentDescription",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpProposalObjectives",
                        "label": "labExpProposalObjectives",
                        "unit": null,
                        "description": "Proposal objectives",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpBackground",
                        "label": "labExpBackground",
                        "unit": null,
                        "description": "Background",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpWhyNeeded",
                        "label": "labExpWhyNeeded",
                        "unit": null,
                        "description": "Why is needed to solve the proposed scientific case?",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpAccessReason",
                        "label": "labExpAccessReason",
                        "unit": null,
                        "description": "Explain why this work calls for access to the facility",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpAlreadySubmitted",
                        "label": "labExpAlreadySubmitted",
                        "unit": null,
                        "description": "Have you already submitted this proposal to another synchrotron radiation facility? If yes, specify where.",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "ExpOtherFacility",
                        "label": "labExpOtherFacility",
                        "unit": null,
                        "description": "Other facility for this proposal",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "ExpContinuation",
                        "label": "labExpContinuation",
                        "unit": null,
                        "description": "Is this proposal is a continuation of another proposal or previous experimental reports are related to this one",
                        "required": true,
                        "categoryId": "ExperimentContext",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "ExpReferences",
                        "label": "labExpReferences",
                        "unit": null,
                        "description": "References",
                        "required": true,
                        "categoryId": "ProposalFramework",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamSampleType",
                        "label": "labSamSampleType",
                        "unit": null,
                        "description": "Sample type",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Biological",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Biological",
                                "constraint": null
                            },
                            {
                                "value": "Chemical",
                                "constraint": null
                            },
                            {
                                "value": "Other",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Biological",
                            "Chemical",
                            "Other"
                        ]
                    },
                    {
                        "id": "SamSubstance",
                        "label": "Substance",
                        "unit": null,
                        "description": "Substance",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamCAS",
                        "label": "CAS",
                        "unit": null,
                        "description": "CAS",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamChemicalFormula",
                        "label": "labSamChemicalFormula",
                        "unit": null,
                        "description": "Chemical formula",
                        "required": false,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamContent",
                        "label": "labSamContent",
                        "unit": null,
                        "description": "Content",
                        "required": false,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamHasMSDS",
                        "label": "The substance has a Material Safety Data Sheet (MSDS)",
                        "unit": null,
                        "description": "The substance has a Material Safety Data Sheet (MSDS)",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "MSDS",
                        "label": "MSDS",
                        "unit": null,
                        "description": "MSDS",
                        "required": false,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamHasTDS",
                        "label": "The substance has a Technical Data Sheet",
                        "unit": null,
                        "description": "The substance has a Technical Data Sheet",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "TDS",
                        "label": "TDS",
                        "unit": null,
                        "description": "TDS",
                        "required": false,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamPlannedNumberOfSamples",
                        "label": "labSamPlannedNumberOfSamples",
                        "unit": null,
                        "description": "Planned number of samples",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "smallInteget"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamPhysicalState",
                        "label": "Physical state",
                        "unit": null,
                        "description": "Physical state",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Solid",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Solid",
                                "constraint": null
                            },
                            {
                                "value": "Liquid",
                                "constraint": null
                            },
                            {
                                "value": "Gas",
                                "constraint": null
                            },
                            {
                                "value": "Other",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Solid",
                            "Liquid",
                            "Gas",
                            "Other"
                        ]
                    },
                    {
                        "id": "SamTendsToReleaseDustParticles",
                        "label": "Metric tends to release dust particles",
                        "unit": null,
                        "description": "Metric tends to release dust particles",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "SamTendsToReleaseNanoarticles",
                        "label": "Metric tends to release nanoparticles",
                        "unit": null,
                        "description": "Metric tends to release nanoparticles",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "SamTendsToRSublime",
                        "label": "Sample tends to sublime",
                        "unit": null,
                        "description": "Sample tends to sublime",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "SamSize",
                        "label": "Sample Size",
                        "unit": "mm3",
                        "description": "Size",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamMass",
                        "label": "labSamMass",
                        "unit": "mg",
                        "description": "Mass",
                        "required": true,
                        "categoryId": "Sample Mass",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamVolumeOfCylinderUsed",
                        "label": "Volume of cylinder used",
                        "unit": "cm3",
                        "description": "Volume of cylinder used",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamPressureOfGasInTheCylinder",
                        "label": "Pressure of gas in the cylinder",
                        "unit": "mbar",
                        "description": "Pressure of gas in the cylinder",
                        "required": true,
                        "categoryId": "sampleInfo",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamRadioactiveIsotope",
                        "label": "labSamRadioactiveIsotope",
                        "unit": null,
                        "description": "Radioactive isotope",
                        "required": false,
                        "categoryId": "Radiation",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamRadType",
                        "label": "labSamRadType",
                        "unit": null,
                        "description": "Type",
                        "required": true,
                        "categoryId": "Radiation",
                        "position": 0,
                        "defaultValue": "Open",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "select"
                        ],
                        "options": [
                            {
                                "value": "Open",
                                "constraint": null
                            },
                            {
                                "value": "ealed",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Open",
                            "ealed"
                        ]
                    },
                    {
                        "id": "SamActivity",
                        "label": "labSamActivity",
                        "unit": "Bq",
                        "description": "Activity [Bq]",
                        "required": true,
                        "categoryId": "Radiation",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "NUMBER",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "twodigits"
                        ],
                        "minValue": null,
                        "maxValue": null
                    },
                    {
                        "id": "SamRadBriefWorkDescription",
                        "label": "labSamRadBriefWorkDescription",
                        "unit": null,
                        "description": "Brief work description",
                        "required": false,
                        "categoryId": "Radiation",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamRadComments",
                        "label": "labSamRadComments",
                        "unit": null,
                        "description": "Comments",
                        "required": false,
                        "categoryId": "Radiation",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamEquipmentType",
                        "label": "Use of Solaris laboratory",
                        "unit": null,
                        "description": "Use of Solaris laboratory",
                        "required": true,
                        "categoryId": "Equipment",
                        "position": 0,
                        "defaultValue": "Yes",
                        "inputType": "SELECT",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "radioGroup"
                        ],
                        "options": [
                            {
                                "value": "Yes",
                                "constraint": null
                            },
                            {
                                "value": "No",
                                "constraint": null
                            }
                        ],
                        "availableOptions": [
                            "Yes",
                            "No"
                        ]
                    },
                    {
                        "id": "SamProcesses",
                        "label": "Processes (preparation samples) performed by users during the experiment at Solaris",
                        "unit": null,
                        "description": "Processes (preparation samples) performed by users during the experiment at Solaris",
                        "required": true,
                        "categoryId": "Equipment",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamSolarisEquipmentProvided",
                        "label": "Equipment and products provided by Solaris during the experiment",
                        "unit": null,
                        "description": "Equipment and products provided by Solaris during the experiment",
                        "required": true,
                        "categoryId": "Equipment",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamEquipmentBrought",
                        "label": "Equipment brought by the users during the experiment at Solaris",
                        "unit": null,
                        "description": "Equipment brought by the users during the experiment at Solaris",
                        "required": true,
                        "categoryId": "Equipment",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    },
                    {
                        "id": "SamOtherRequirements",
                        "label": "labSamOtherRequirements",
                        "unit": null,
                        "description": "Other requirements",
                        "required": false,
                        "categoryId": "Equipment",
                        "position": 0,
                        "defaultValue": null,
                        "inputType": "TEXTAREA",
                        "constraint": {
                            "id": null,
                            "negation": false,
                            "type": "AND",
                            "children": [
                                {
                                    "id": null,
                                    "negation": false,
                                    "documentAlias": "TEMP_STATES_AND_METRICS",
                                    "state": "documentType",
                                    "value": "proposal"
                                }
                            ]
                        },
                        "visualClass": [
                            "testVisualClass",
                            "longString"
                        ]
                    }
                ],
                "msg": null
            }
            ]
        }
    });

    $httpBackend.whenGET(/^\/src\/.*\.tpl\.html/).passThrough();
});