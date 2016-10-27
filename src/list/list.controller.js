angular.module('engine.list')
.controller('engineListCtrl', function ($scope, $route, engineQuery) {
    $scope.query = $route.current.$$route.query;

    $scope.documents = engineQuery($scope.query)
});