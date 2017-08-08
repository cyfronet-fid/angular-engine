angular.module('engine.steps')
    .component('engineSteps', {
        templateUrl: '/src/document/steps.tpl.html',
        controller: function ($timeout) {
            var self = this;

            this.changeStep = function (newStep) {
                if(this.processing === true)
                    return;
                self.step = newStep;
            }
        },
        bindings: {
            ngModel: '=',
            step: '=',
            stepList: '=',
            options: '=',
            processing: '<'
        }
    });