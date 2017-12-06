angular.module('engine.list')
.controller('engineListWrapperCtrl', function ($scope, $route, engineDashboard, $engine) {
    $scope.options = $route.current.$$route.options;
    $scope.IMMEDIATE_CREATE = $engine.IMMEDIATE_CREATE;
    var query = $route.current.$$route.options.query;

    if(angular.isArray(query)) {
        $scope.queries = [];
        angular.forEach(query, function (q) {
            $scope.queries.push({id: q});
        });
    }
    else { //dashboard
        engineDashboard.fromCategory(query, function (data) {
            $scope.queries = [];
            angular.forEach(data, function (query) {
                $scope.queries.push(query);
            })
        });
    }
})