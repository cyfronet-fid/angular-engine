angular.module('engine.common')
    .component('engineDocumentActions', {
        templateUrl: '/src/common/document-actions/document-actions.tpl.html',
        controller: function ($rootScope, $scope, DocumentActionList, $engLog, $timeout) {
            var self = this;

            this.$onInit = function () {

                if (!this.documentScope) {
                    $engLog.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
                    this._documentScope = $scope;
                }
                else
                    this._documentScope = this.documentScope;

                //If document is reloaded, also reload actions
                this._documentScope.$on('document.form.requestReload', self.loadActions);

                //After every save reload actions
                this._documentScope.$on('engine.common.save.after', self.loadActions);

                //If any list in the document was forced to reload also reload actions (relations could have changed)
                this._documentScope.$on('engine.list.reload', self.loadActions);

                self.loadActions();
            };


            this.validate = function () {
                return $scope.$emit('engine.common.document.validate').$promise;
            };

            this.changeStep = function (newStep) {
                self.step = newStep;
            };

            $scope.$watch('$ctrl.document', function (newDocument, oldDocument) {
                if (self.actionList != null && !_.isEmpty(newDocument) && newDocument != null)
                    self.actionList._setDocument(newDocument);
            });

            this.loadActions = function loadActions() {
                self.loading = true;
                $timeout(function () {
                    self.actionList = new DocumentActionList(null, self.document, self.documentParent, self._documentScope);
                    self.actionList.$ready.finally(function () {
                        self.loading = false;
                    });
                });
            };
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