angular.module('engine.document')
.controller('engineDocumentCtrl', function ($scope, $route, metrics) {
    $scope.query = $route.current.$$route.query;
    $scope.document_type = $route.current.$$route.common_options.document_type;

    $scope.metrics = metrics($scope.document_type);
});