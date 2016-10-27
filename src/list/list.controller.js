angular.module('engine.list')
.controller('engineListCtrl', function ($scope, $route, engineQuery) {
    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.document_type = $route.current.$$route.common_options.document_type;

    $scope.documents = engineQuery($scope.query)
});