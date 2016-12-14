angular.module('engine.document')
    .controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams) {
        $scope.validatedSteps = [];
        $scope.options = $route.current.$$route.options;
        $scope.steps = $route.current.$$route.options.document.steps || null;
        if(angular.isArray($scope.steps))
            angular.forEach($scope.steps, function (step) {
                $scope.validatedSteps.push('blank');
            });
        $scope.document = {};
        $scope.documentId = $routeParams.id;
        if($routeParams.step === undefined)
            $routeParams.step = 0;
        $scope.$routeParams = $routeParams;

        $scope.$watch('$routeParams.step', function (newVal, oldVal) {
            if(angular.isString(newVal)) {
                newVal = parseInt(newVal);
                $routeParams.step = newVal;
            }
            if(newVal !== oldVal) {
                $location.search({step: newVal || 0})
            }
        });
    });