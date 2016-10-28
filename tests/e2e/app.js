angular.module('engine-test-app', ['ngRoute', 'engine', 'ngMockE2E'])
    .config(function ($engineProvider) {
        $engineProvider.document('/proposal', {
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
            'proposal', {document_type: 'proposal'});
        $engineProvider.document('/review', {}, '/review/:id', {}, 'review');
        $engineProvider.setBaseUrl('/engine/rest');
    });

angular.module('engine-test-app').controller('MainCtrl', function ($engine, $httpBackend) {
    $httpBackend.whenGET($engine.baseUrl + '/query/documents?queryId=proposal').respond(
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
    $httpBackend.whenGET(/^\/src\/.*\.tpl\.html/).passThrough();
});