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

        $scope.conditionFulfilled = (addon) => {
            return addon.condition($scope.document);
        };

        $scope.$watch('$routeParams.step', function (newVal, oldVal) {
            if(angular.isString(newVal)) {
                newVal = parseInt(newVal);
                $routeParams.step = newVal;
            }

            // handle cases where step is "out of bounds" - we'll silently handle the error and
            // substitute it for first step
            var stepNumber = ($scope.stepList.steps.length != 0)?$scope.stepList.steps.length:$scope.stepList.documentSteps.length;

            if($routeParams.step > stepNumber || $routeParams.step < 0) {
                $routeParams.step = 0;
                newVal = 0;
            }

            if(newVal !== oldVal) {
                $location.search({step: newVal || 0})
            }
        });
    })
    .directive('fixedOnScroll',['$window',function ( $window ) {
    var $win = angular.element($window);
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var topClass = attrs.fixedOnScroll;

            $win.on("scroll", function () {
                scope.offsetTop =  element[0].parentNode.offsetTop + element[0].getBoundingClientRect().top;
                if ($window.pageYOffset >= scope.offsetTop ) {
                    element.addClass(topClass);
                } else {
                    element.removeClass(topClass);
                }
                scope.$digest();
            });

        }
    };
}]);