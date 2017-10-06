angular.module('engine.common')
    .component('engineDocumentActions', {
        templateUrl: '/src/common/document-actions/document-actions.tpl.html',
        controller: function ($rootScope, $scope, DocumentActionList, $engLog, $timeout) {
            var self = this;
            var _bindings = [];

            this.$onInit = function () {
                if (self.document != null)
                    self.loadActions();
            };

            this.$onChanges = function (changesObj) {
                if (changesObj.documentScope != null) {
                    if (changesObj.documentScope.currentValue == null) {
                        $engLog.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
                        this._documentScope = $scope;
                    } else {
                        this._documentScope = this.documentScope;
                    }


                    if (changesObj.documentScope.isFirstChange() != true && changesObj.documentScope.previousValue != null) {
                        angular.forEach(_bindings, function (removeBinding) {
                            removeBinding();
                        });
                        _bindings = [];
                    }

                    _bindings.push(this._documentScope.$on('engine.common.document.documentLoaded', self.loadActions));

                    //If document is reloaded, also reload actions
                    _bindings.push(this._documentScope.$on('document.form.requestReload', self.loadActions));

                    //After every save reload actions
                    _bindings.push(this._documentScope.$on('engine.common.save.after', self.loadActions));

                    //If any list in the document was forced to reload also reload actions (relations could have changed)
                    _bindings.push(this._documentScope.$on('engine.list.reload', self.loadActions));
                }
                if (changesObj.document != null) {
                    var newDocument = changesObj.document.currentValue;

                    if (self.actionList != null && !_.isEmpty(newDocument) && newDocument != null) {
                        if (self.actionList == null)
                            self.loadActions();
                        else
                            self.actionList._setDocument(newDocument);
                    }
                }
            };

            this.validate = function () {
                return this._documentScope.$emit('engine.common.document.validate').$promise;
            };

            this.changeStep = function (newStep) {
                self.step = newStep;
            };

            this.loadActions = function loadActions() {

                self.loading = true;
                $timeout(function () {
                    if (self.document == null) {
                        self.loading = false;
                        return;
                    }
                    self.actionList = new DocumentActionList(null, self.document, self.documentParent, self._documentScope);
                    self.actionList.$ready.finally(function () {
                        self.loading = false;
                    });
                });
            };
        },
        bindings: {
            documentScope: '<',
            document: '<',
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