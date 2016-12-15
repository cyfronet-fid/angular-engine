angular.module('engine.document')
    .factory('DocumentActionList', function (DocumentAction, engActionResource, $engineApiCheck, $q, $log) {
        function DocumentActionList(document, parentDocumentId, $scope) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.string.optional, $engineApiCheck.object.optional], arguments);

            var self = this;
            this.$scope = $scope;
            this.parentDocumentId = parentDocumentId;
            this.actions = [];

            this.markInit = null;

            this.loadActions = function loadActions() {
                engActionResource.getAvailable(self.document, self.parentDocumentId || self.document.id).$promise.then(function (actions) {
                    self.actions = [];
                    _.forEach(actions, function (action) {
                        self.actions.push(new DocumentAction(action, self.document, self.parentDocumentId, self.$scope));
                    });
                });
            };

            this.$ready = $q(function (resolve, reject) {
                self.markInit = resolve;
            }).then(self.loadActions);

            this.setDocument(document);
        }

        DocumentActionList.prototype.setDocument = function setDocument(document) {
            if(document == null || _.isEmpty(document) || document == this.document)
                return;

            var prevDoc = this.document;
            this.document = document;

            // if(!prevDoc && prevDoc != null && !_.isEmpty(prevDoc))
            this.markInit();
            // else
            if(this.$ready.$resolved)
                this.$ready = this.loadActions();
        };
        DocumentActionList.prototype.getSaveAction = function getSaveAction() {
            return _.find(this.actions, function (action) {
                return action.isSave();
            });
        };

        DocumentActionList.prototype.callSave = function callSave() {
            var saveAction = this.getSaveAction();

            if(saveAction == null) {
                $log.warn('engine.document.actions No save action specified for document', this.document);
                return $q.reject();
            }
            $log.debug('engine.document.actions Called save for document', this.document);
            return saveAction.call();
        };

        return DocumentActionList;
    })
    .factory('DocumentAction', function (engActionResource, $engineApiCheck, DocumentActionProcess, $log, $q) {
        function DocumentAction(engAction, document, parentDocumentId, $scope) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object, $engineApiCheck.string.optional, $engineApiCheck.object.optional], arguments);
            this.document = document;
            this.actionId = engAction.id;
            this.label = engAction.label;
            this.engAction = engAction;
            this.type = engAction.type;
            this.parentDocumentId = parentDocumentId;
            this.$scope = $scope;
        }

        DocumentAction.prototype.TYPE_CREATE = 'CREATE';
        DocumentAction.prototype.TYPE_UPDATE = 'UPDATE';
        DocumentAction.prototype.TYPE_LINK = 'LINK';
        DocumentAction.prototype.SAVE_ACTIONS = [DocumentAction.prototype.TYPE_CREATE, DocumentAction.prototype.TYPE_UPDATE];

        DocumentAction.prototype.call = function call() {
            var self = this;
            var event = null;
            $log.debug('engine.document.actions', 'action called', this);

            if(this.$scope) {
                var promises = [];

                event = this.$scope.$broadcast('engine.common.action.before', {'document': this.document,
                                                                               'action': this,
                                                                               'promises': promises});

                if(event.defaultPrevented) {
                    this.$scope.$broadcast('engine.common.action.prevented', {'document': this.document,
                                                                              'action': this,
                                                                              'event': event});
                    return;
                }

                if(this.isSave()){
                    event = self.$scope.$broadcast('engine.common.save.before', {'document': this.document,
                                                                                 'action': this,
                                                                                 'promises': promises});

                    if(event.defaultPrevented) {
                        self.$scope.$broadcast('engine.common.action.prevented', {'document': this.document,
                                                                                  'action': this,
                                                                                  'event': event});
                        return;
                    }
                }


            }
            return $q.all(promises).then(function(){
                return engActionResource.invoke(self.actionId, self.document, self.parentDocumentId).$promise
            }).then(function (result) {
                $log.debug('engine.document.actions', 'action call returned', result);
                if(self.$scope) {
                    self.$scope.$broadcast('engine.common.action.after', {'document': self.document, 'action': self, 'result': result});
                    self.$scope.$broadcast('engine.common.save.after', {'document': self.document, 'action': self, 'result': result});
                }
                return DocumentActionProcess(self.document, result);
            });
        };

        DocumentAction.prototype.isSave = function isSave() {
            return _.contains(this.SAVE_ACTIONS, this.type);
        };

        return DocumentAction;
    })
.factory('DocumentActionProcess', function ($location, $engine, engineDocument, $log, $q) {

    return function DocumentActionHandler(document, actionResponse) {
        if(actionResponse.type == 'REDIRECT') {
            if(document.id == actionResponse.redirectToDocument)
                return $q.resolve();

            //before redirecting, load document from engine to ascertain it's document type
            return engineDocument.get(actionResponse.redirectToDocument).$promise.then(function (data) {
                var search = {};

                if(document.id != null && document.id != actionResponse.redirectToDocument) {
                    search.step = 0;
                }

                var documentOptions = $engine.getOptions(data.document.states.documentType);

                if(documentOptions == null){
                    var message = 'Document type to which redirection was requested has not been registrated! ' +
                                  'Make sure to register it in $engineProvider';

                    $log.error(message, 'DocumentType=', data.document.states.documentType);

                    throw new Error(message)
                }



                $location.$$search = search;
                $location.$$path = $engine.pathToDocument(documentOptions, actionResponse.redirectToDocument);
                $location.$$compose();

                return actionResponse;
            });
        }
    }
});