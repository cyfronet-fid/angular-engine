angular.module('engine.document')
    .factory('DocumentActionList', function (DocumentAction, engActionResource, $engineApiCheck, $q, $engLog, $http, $rootScope) {
        function DocumentActionList(actions, document, parentDocument, $scope, dontSendTemp) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);

            if (parentDocument == null)
                parentDocument = {};


            var self = this;
            this.dontSendTemp = dontSendTemp || false;
            this.$scope = $scope;
            this.parentDocument = parentDocument;
            this.parentDocumentId = document.id != null ? null : parentDocument.id;
            this.actions = [];

            this.markInit = null;

            this.loadActions = function loadActions() {
                if (actions != null)
                    return self.processActions(actions);
                return engActionResource.getAvailable(self.document, self.document.id, self.parentDocumentId).$promise.then(self.processActions);
            };

            this.processActions = function (actions) {
                self.actions = [];
                _.forEach(actions, function (action) {
                    self.actions.push(new DocumentAction(action, self.document, self.parentDocument, self.$scope, self.dontSendTemp));
                });
            };

            this.$ready = $q(function (resolve, reject) {
                self.markInit = resolve;
            }).then(self.loadActions);

            this._setDocument(document);
        }

        DocumentActionList.get = function (document, parentDocument, $scope) {
            var res = new DocumentActionList(document, parentDocument, $scope);

            $http.get($engineConfig.baseUrl + '/action/available?documentId=' + document.id).then(function (response) {
                var data = response.data.data;

                return data;
            });

            return res;
        };

        DocumentActionList.prototype._setDocument = function setDocument(document) {
            if (document == null || _.isEmpty(document) || document == this.document)
                return;

            var prevDoc = this.document;
            this.document = document;
            this.parentDocumentId = document.id ? null : this.parentDocumentId;
            // if(!prevDoc && prevDoc != null && !_.isEmpty(prevDoc))
            this.markInit();
            // else
            // if(this.$ready.$$state.status === 0)
            this.$ready = this.loadActions();

        };
        DocumentActionList.prototype.getSaveAction = function getSaveAction() {
            return _.find(this.actions, function (action) {
                return action.isSave();
            });
        };
        DocumentActionList.prototype.getLinkAction = function getLinkAction() {
            return _.find(this.actions, function (action) {
                return action.isLink();
            });
        };

        DocumentActionList.prototype.callSave = function callSave() {
            var saveAction = this.getSaveAction();

            if (saveAction == null) {
                $engLog.warn('engine.document.actions No save action specified for document', this.document);
                return $q.reject();
            }
            $engLog.debug('engine.document.actions Called save for document', this.document);
            return saveAction.call();
        };


        DocumentActionList.prototype.callLink = function callLink() {
            var linkAction = this.getLinkAction();

            if (linkAction == null) {
                $engLog.warn('engine.document.actions No link action specified for document', this.document);
                return $q.reject();
            }
            $engLog.debug('engine.document.actions Called link for document', this.document);
            return linkAction.call();
        };

        return DocumentActionList;
    })
    .factory('DocumentAction', function (engActionResource, $engineApiCheck, DocumentActionProcess, $engLog, $q, $rootScope, $engine) {
        function DocumentAction(engAction, document, parentDocument, $scope, dontSendTemp) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);
            this.dontSendTemp = dontSendTemp || false;
            this.document = document;
            this.actionId = engAction.id;
            this.label = engAction.label;
            this.engAction = engAction;
            this.type = engAction.type;
            this.parentDocument = parentDocument;
            this.parentDocumentId = parentDocument == null ? null : parentDocument.id;
            this.$scope = $scope;
        }

        DocumentAction.prototype.TYPE_CREATE = 'CREATE';
        DocumentAction.prototype.TYPE_UPDATE = 'UPDATE';
        DocumentAction.prototype.TYPE_DELETE = 'DELETE';
        DocumentAction.prototype.TYPE_LINK = 'LINK';
        DocumentAction.prototype.SAVE_ACTIONS = [DocumentAction.prototype.TYPE_CREATE, DocumentAction.prototype.TYPE_UPDATE];
        DocumentAction.prototype.LINK_ACTIONS = [DocumentAction.prototype.TYPE_LINK];
        DocumentAction.prototype.DELETE_ACTIONS = [DocumentAction.prototype.TYPE_DELETE];

        /**
         * Broadcast notification event (notification events should not be listened by angular-engine
         * components, and should only be used to show notifications by the host application
         *
         * @param notificationId notification id eg. 'engine.notification.action.prevented'
         * @type String
         */
        DocumentAction.prototype.broadcastNotification = function broadcastNotification(notificationId) {
            $rootScope.$broadcast(notificationId, this.document, this);
        };

        /**
         *
         * @param {Object} ctx custom context which will be passed to every event fired in this function (key: `ctx`)
         */
        DocumentAction.prototype.call = function call(ctx) {
            if (ctx == null)
                ctx = {};
            var self = this;
            var event = null;
            $engLog.debug('engine.document.actions', 'action called', this);

            let consent = $q.when(true);

            if (this.isDelete()) {
                console.log('delete called');
                consent = $engine.confirm('Delete', 'Do you really want to perform this action?');
            }

            return consent.then(() => {
                if (this.$scope) {
                    var promises = [];

                    event = this.$scope.$broadcast('engine.common.action.before', {
                        'document': this.document,
                        'action': this,
                        'ctx': ctx,
                        'promises': promises
                    });
                    this.broadcastNotification('engine.notification.action.before');

                    if (event.defaultPrevented) {
                        this.$scope.$broadcast('engine.common.action.prevented', {
                            'document': this.document,
                            'action': this,
                            'ctx': ctx,
                            'event': event
                        });

                        this.broadcastNotification('engine.notification.action.prevented');
                        return $q.reject();
                    }

                    if (this.isSave()) {
                        event = self.$scope.$broadcast('engine.common.save.before', {
                            'document': this.document,
                            'action': this,
                            'ctx': ctx,
                            'promises': promises
                        });

                        this.broadcastNotification('engine.notification.save.before');

                        if (event.defaultPrevented) {
                            self.$scope.$broadcast('engine.common.save.prevented', {
                                'document': this.document,
                                'action': this,
                                'ctx': ctx,
                                'event': event
                            });

                            self.broadcastNotification('engine.notification.save.prevented');
                            return $q.reject();
                        }
                    }
                }
                return $q.all(promises).then(function () {
                    return engActionResource.invoke(self.actionId, self.dontSendTemp === true ? null : self.document, self.document.id, self.parentDocumentId).$promise;
                }).then(function (result) {
                    $engLog.debug('engine.document.actions', 'action call returned', result);
                    if (self.$scope) {
                        var ev1 = self.$scope.$broadcast('engine.common.action.after', {
                            'document': self.document,
                            'action': self,
                            'ctx': ctx,
                            'result': result
                        });
                        var ev2 = self.$scope.$broadcast('engine.common.save.after', {
                            'document': self.document,
                            'action': self,
                            'ctx': ctx,
                            'result': result
                        });

                        self.broadcastNotification('engine.notification.action.after');

                        if (self.isSave())
                            self.broadcastNotification('engine.notification.save.after');

                        if (ev1.defaultPrevented || ev2.defaultPrevented)
                            return result;
                    }
                    return DocumentActionProcess(self.document, result, self.parentDocument, self.$scope);
                }, function (result) {
                    self.$scope.$broadcast('engine.common.action.error', {
                        'document': self.document,
                        'action': self,
                        'ctx': ctx,
                        'result': result
                    });
                    self.broadcastNotification('engine.notification.action.error');
                    if (self.isSave())
                        self.broadcastNotification('engine.notification.save.error');
                    return $q.reject(result);
                });
            });
        };

        DocumentAction.prototype.isSave = function isSave() {
            return _.contains(this.SAVE_ACTIONS, this.type);
        };

        DocumentAction.prototype.isCreate = function isCreate() {
            return this.type == this.TYPE_CREATE;
        };

        DocumentAction.prototype.isLink = function isLink() {
            return _.contains(this.LINK_ACTIONS, this.type);
        };

        DocumentAction.prototype.isDelete = function isDelete() {
            return _.contains(this.DELETE_ACTIONS, this.type);
        };

        return DocumentAction;
    })
    .factory('DocumentActionProcess', function ($location, $engine, engineDocument, $engLog, $q, DocumentModal) {
        return function DocumentActionHandler(document, actionResponse, parentDocument, $scope) {
            if (actionResponse.type === 'REDIRECT') {
                if (actionResponse.redirectToDocument === null)
                    return $q.resolve();

                // Reload document
                if (document.id === actionResponse.redirectToDocument && $scope != null) {
                    $scope.$broadcast('engine.common.document.requestReload');
                    return $q.resolve();
                }

                let promise = null;
                if (actionResponse.redirectContext != null) {
                    promise = $q.when(actionResponse.redirectContext)
                }
                else if (actionResponse.targetDocumentStates != null && actionResponse.targetDocumentStates[$engine.DOCUMENT_MODEL_KEY] != null) {
                    promise = $q.when(actionResponse.targetDocumentStates[$engine.DOCUMENT_MODEL_KEY])
                }
                else {
                    promise = engineDocument.get(actionResponse.redirectToDocument).$promise.then((data) => data.document.states.documentType);
                }

                //before redirecting, load document from engine to ascertain it's document type
                return promise.then(function (documentModelTypeAndSteps) {
                    // Split step & model
                    documentModelTypeAndSteps = documentModelTypeAndSteps.split('#');
                    let documentModelType = documentModelTypeAndSteps[0];
                    let step = documentModelTypeAndSteps[1];

                    if (document.id != null && document.id !== actionResponse.redirectToDocument) {
                        $location.$$search.step = 0;
                    }

                    if (step !== undefined)
                        $location.$$search.step = step;

                    var documentOptions = $engine.getOptions(documentModelType);

                    if (documentOptions == null) {
                        var message = 'Document type to which redirection was requested has not been registrated! ' +
                            'Make sure to register it in $engineProvider';

                        $engLog.error(message, 'DocumentType=', documentModelType);

                        throw new Error(message)
                    }
                    if (documentOptions.dashboard == true) {
                        $location.path(documentModelType);
                    }
                    else if (documentOptions.subdocument == false) {
                        $location.$$path = $engine.pathToDocument(documentOptions, actionResponse.redirectToDocument);
                        $location.$$compose();
                    } else {
                        DocumentModal(actionResponse.redirectToDocument, documentOptions, parentDocument.id);
                    }

                    return actionResponse;
                });
            }
        }
    });
