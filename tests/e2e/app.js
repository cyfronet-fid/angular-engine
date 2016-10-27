angular.module('engine-test-app', ['ngRoute', 'engine'])
.config(function ($engineProvider) {
    $engineProvider.document('/proposal', {caption: "Proposals list",
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
});