angular.module('engine.common')
.component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: function ($timeout, $rootScope, engineAction, $scope, DocumentEventCtx, ErrorEventCtx, ENGINE_SAVE_ACTIONS, $log) {
        var self = this;

        if(!this.documentScope){
            $log.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
            this._documentScope = $scope;
        }
        else
            this._documentScope = this.documentScope;

        this.engineAction = function(action) {
            $scope.$emit('engine.common.action.invoke', action, self.document);
        };

        this.changeStep = function (newStep) {
            $scope.$emit('engine.common.step.change', newStep, self.document);
            // self.engineAction(self.getCreateUpdateAction(), self.document, function () {
            //     self.step = newStep;
                // $timeout(self.stepChange);
            // });
        }
    },
    bindings: {
        documentScope: '=',
        document: '=',
        options: '=',
        actions: '=',
        step: '=',
        stepChange: '&'
    }
});