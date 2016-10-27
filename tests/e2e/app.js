angular.module('engine-test-app', ['ngRoute', 'engine'])
.config(function ($engineProvider) {
    $engineProvider.document('/proposal', '/proposal/:id', 'type=proposal', {});
    $engineProvider.document('/review', '/review/:id', 'type=review', {});
});