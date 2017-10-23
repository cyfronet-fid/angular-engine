angular.module('engine.document')
    .controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams, engineResolve, StepList, $engine) {
        $scope.responsive = $engine.RESPONSIVE;

        $scope.engineResolve = engineResolve;
        $scope.options = $route.current.$$route.options;

        $scope.stepList = new StepList($route.current.$$route.options.document.steps);

        $scope.document = {};
        $scope.documentId = $routeParams.id;

        $scope.processing = false;

        if($routeParams.step === undefined)
            $routeParams.step = 0;
        else
            $routeParams.step = parseInt($routeParams.step);

        $scope.sideMenuVisible = false;
        $scope.toggleSideMenu = function () {
             $scope.sideMenuVisible = !$scope.sideMenuVisible;
        };

        $scope.$routeParams = $routeParams;

        $scope.$watch('$routeParams.step', function (newVal, oldVal) {


            if(angular.isString(newVal)) {
                newVal = parseInt(newVal);
                $routeParams.step = newVal;
            }
            // $scope.stepList.setCurrentStep(newVal);
            if(newVal !== oldVal) {
                $location.search({step: newVal || 0})
            }
        });
    });