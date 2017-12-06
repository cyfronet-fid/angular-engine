angular.module('engine.dashboard')
    .controller('engineDashboardCtrl', function ($scope, $route, $engine) {
        $scope.$engine = $engine;
        $scope.options = $route.current.$$route.options;
        $scope.queries = $scope.options.queries;
        $scope.IMMEDIATE_CREATE = $engine.IMMEDIATE_CREATE;
    });