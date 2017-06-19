angular.module('engine.common')
.component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: function ($rootScope, $scope, DocumentActionList, $engLog, $timeout) {
        var self = this;

        if(!this.documentScope){
            $engLog.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
            this._documentScope = $scope;
        }
        else
            this._documentScope = this.documentScope;

        this.validate = function () {
            return $scope.$emit('engine.common.document.validate').$promise;
        };

        this.changeStep = function (newStep) {
            self.step = newStep;
        };

        $scope.$watch('$ctrl.document', function (newDocument, oldDocument) {
            if(self.actionList != null && !_.isEmpty(newDocument) && newDocument != null)
                self.actionList._setDocument(newDocument);
        });

        this._documentScope.$on('document.form.requestReload', function (event) {
            $engLog.debug('requested reload for action list');
            self.loadActions();
        });

        this.loadActions = function loadActions() {
            self.loading = true;
            $timeout(function () {
                self.actionList = new DocumentActionList(null, self.document, self.documentParent, self._documentScope);
                self.actionList.$ready.finally(function () { self.loading = false; });
            });
        };

        self.loadActions();
    },
    bindings: {
        documentScope: '=',
        document: '=',
        options: '=',
        steps: '=',
        step: '=',
        showValidationButton: '=',
        customButtons: '=',
        documentParent: '=',
        dirty: '=',
        saveAlertLeft: '='
    }
});