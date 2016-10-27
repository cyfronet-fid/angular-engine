angular.module('engine.document')
.controller('engineDocumentCtrl', function ($scope, $route) {
    $scope.query = $route.current.$$route.query;
});