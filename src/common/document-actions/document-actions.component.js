angular.module('engine.common')
.component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: function ($timeout, engineAction) {
        var self = this;

        this.engineAction = engineAction;

        this.changeStep = function (newStep) {
            self.step = newStep;
            $timeout(self.stepChange);
        }
    },
    bindings: {
        document: '=',
        options: '=',
        actions: '=',
        step: '=',
        stepChange: '&'
    }
});