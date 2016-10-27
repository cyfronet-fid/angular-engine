angular.module('engine-test-app', ['ngRoute', 'engine'])
.config(function ($engineProvider) {
    $engineProvider.document('/proposal', {caption: "Proposals list"
        columns: [
            {'name': 'id'},
            {'name': 'title'},
            {'name': 'beamline'},
            {'name': 'status'},
            {'name': 'createdAt'},
        ]
    },
                             '/proposal/:id', {caption: "Proposals"},
                             'proposal', {document_type: 'proposal'});
    $engineProvider.document('/review', {}, '/review/:id', {}, 'review');
});