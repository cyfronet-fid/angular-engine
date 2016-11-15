angular.module('engine.steps')
    .component('engineSteps', {
        templateUrl: '/src/document/steps.tpl.html',
        controller: function ($scope, $route, $routeParams, $location) {
            $scope.steps = $route.current.$$route.options.steps;
            $scope.step = $routeParams.step || 0;

            $scope.changeStep = function (newStep) {
                $routeParams.step = newStep;
                $location.search({step: newStep})
            }
        },
        bindings: {
            // ngModel: '@',
            // steps: '@'
        }
    });