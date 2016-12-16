angular.module('engine.common')
.component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: function ($rootScope, $scope, DocumentActionList,$log) {
        var self = this;

        if(!this.documentScope){
            $log.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
            this._documentScope = $scope;
        }
        else
            this._documentScope = this.documentScope;

        this.validate = function () {
            $scope.$emit('engine.common.document.validate');
        };

        this.changeStep = function (newStep) {
            self.step = newStep;
        };

        $scope.$watch('$ctrl.document', function (newDocument, oldDocument) {
            if(!_.isEmpty(newDocument) && newDocument != null)
                self.actionList._setDocument(newDocument);
        });
        self.actionList = new DocumentActionList(self.document, self.documentParent, self._documentScope);
    },
    bindings: {
        documentScope: '=',
        document: '=',
        options: '=',
        steps: '=',
        step: '=',
        showValidationButton: '=',
        customButtons: '=',
        documentParent: '='
    }
});