'use strict';

angular.module('engine.common', []);
'use strict';

angular.module('engine.dashboard', ['ngRoute', 'engine.list']);
'use strict';

/**
 * @ngdoc overview
 * @name engine.document
 *
 * @requires ngRoute
 *
 * @description
 * Module containing all functionalities of a single document form
 *
 */
angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

/**
 * @ngdoc overview
 * @name engine
 *
 * @requires engine.list
 * @requires engine.document
 * @requires engine.dashboard
 * @requires engine.steps
 *
 * @description
 * Base module for angular-engine front end package
 *
 */
angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'engine.formly', 'ui.bootstrap',
//required for supporting multiselect metrics
'checklist-model', 'engine.common', 'engine.list', 'engine.dashboard', 'engine.steps', 'ngMessages', 'ngFileUpload', 'pascalprecht.translate', 'engine.document']);
'use strict';

angular.module('engine.formly', []);
'use strict';

angular.module('engine.list', ['ngRoute']);
'use strict';

angular.module('engine.common').constant('ENGINE_SAVE_ACTIONS', ['CREATE', 'UPDATE']);
'use strict';

angular.module('engine.common').factory('DocumentEventCtx', function () {
    return function (document, action, options) {
        this.document = document;
        this.action = document;
        this.options = options;
    };
}).factory('ErrorEventCtx', function () {
    return function (errorId, errorMessage) {
        this.errorId = errorId;
        this.errorMessage = errorMessage;
    };
}).factory('engineActionUtils', function ($rootScope, ErrorEventCtx, ENGINE_SAVE_ACTIONS) {
    var ENGINE_LINK_ACTION = 'LINK';
    var isSaveAction = function isSaveAction(action) {
        if (_.contains(ENGINE_SAVE_ACTIONS, action.type)) return true;
        return false;
    };

    var isLinkAction = function isLinkAction(action) {
        return action.type == ENGINE_LINK_ACTION;
    };

    var getLinkAction = function getLinkAction(actions) {
        return _.find(actions, isLinkAction);
    };

    var getCreateUpdateAction = function getCreateUpdateAction(actions) {
        for (var i = 0; i < actions.length; ++i) {
            var action = actions[i];
            if (isSaveAction(action)) {
                return action;
            }
        }
        $rootScope.$broadcast('engine.common.error', new ErrorEventCtx('noCreateUpdateAction', 'Document has no available create / update action, angular-engine framework requires that at least one update and one create action is specified'));
        return null;
    };

    return {
        getCreateUpdateAction: getCreateUpdateAction,
        isSaveAction: isSaveAction,
        getLinkAction: getLinkAction,
        isLinkAction: isLinkAction
    };
});
'use strict';

angular.module('engine.common').component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: function controller($rootScope, $scope, DocumentActionList, $log, $timeout) {
        var self = this;

        if (!this.documentScope) {
            $log.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
            this._documentScope = $scope;
        } else this._documentScope = this.documentScope;

        this.validate = function () {
            $scope.$emit('engine.common.document.validate');
        };

        this.changeStep = function (newStep) {
            self.step = newStep;
        };

        $scope.$watch('$ctrl.document', function (newDocument, oldDocument) {
            if (self.actionList != null && !_.isEmpty(newDocument) && newDocument != null) self.actionList._setDocument(newDocument);
        });

        this._documentScope.$on('document.form.requestReload', function (event) {
            $log.debug('requested reload for action list');
            self.loadActions();
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
        documentParent: '='
    }
});
'use strict';

angular.module('engine.common').factory('engActionResource', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', { actionId: '@actionId', documentId: '@documentId' }, {
        invoke: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    var _actionAvailable = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId', { documentId: '@id' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return {
        getAvailable: function getAvailable(document, contextDocumentId) {
            $engineApiCheck([apiCheck.object, apiCheck.string], arguments);

            return _actionAvailable.post({ documentId: contextDocumentId }, document);
        },
        invoke: function invoke(actionId, document, contextDocumentId) {
            $engineApiCheck([apiCheck.string, apiCheck.object], arguments);

            return _action.invoke({ actionId: actionId, documentId: contextDocumentId || document.id }, document);
        }
    };
});
'use strict';

angular.module('engine.dashboard').controller('engineDashboardCtrl', function ($scope, $route, $engine) {
    $scope.$engine = $engine;
    $scope.options = $route.current.$$route.options;
    $scope.queries = $scope.options.queries;
});
'use strict';

angular.module('engine.document').component('engineDocumentDetails', {
    templateUrl: '/src/document/details/details.tpl.html',
    controller: function controller($parse) {
        var self = this;
        this.$parse = $parse;

        this.saveDocument = function () {
            self.savePromise = self.actions.callSave();
        };
    },
    bindings: {
        ngModel: '=',
        options: '=',
        actions: '='
    }
}).filter('conditionFulfiled', function ($parse) {
    return function (items, document) {
        var filtered = [];

        angular.forEach(items, function (item) {
            if (item.condition == null || $parse(item.condition)(document) === true) filtered.push(item);
        });
        return filtered;
    };
});
'use strict';

angular.module('engine.document').component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        documentChange: '&',
        document: '=',
        options: '=',
        stepList: '=',
        step: '=',
        validatedSteps: '=',
        showValidationButton: '=',
        documentId: '@',
        actions: '=',
        parentDocument: '='
    }
}).controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument, engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx, engineAction, engineMetricCategories, StepList, DocumentForm, DocumentActionList, $q, $log, $attrs) {
    var self = this;
    console.log($scope);
    this.document = null;
    self.documentScope = $scope;
    $scope.steps = this.options.document.steps;

    this.actionList = null;
    this.documentForm = new DocumentForm();

    this.getDocument = function (noReloadSteps) {
        var _actionsToPerform = [];
        //if the document exists, the first action will be retrieving it
        if (self.documentId && self.documentId != 'new') {
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (data) {
                self.document = data.document;
                self.messages = data.messages;
                // self.documentChange(self.document);
            }));
        } //if document does not exist copy base from options, and set the name
        else {
                self.document = angular.copy(self.options.documentJSON);
                self.document.name = (self.options.name || 'Document') + ' initiated on ' + new Date();
            }
        return $q.all(_actionsToPerform).then(function () {
            if (!noReloadSteps) self.stepList.setDocument(self.document);
        });
    };
    /**
     * **NOTE** this function should be called only after all required promises are fulfilled:
     * * this.stepList.$ready
     * * this.documentForm.$ready
     *
     * Initializes document (loads document data, loads available actions, loads metrics for forms)
     * everything is accomplished by chaining promises, method returns promise itself, which should be
     * consumed in order to make sure that all asynchronous operations have been compleated
     *
     * @returns {Promise<R>|IPromise<U>|Promise<U>}
     */
    this.initDocument = function initDocument() {
        var message = 'engineDocumentCtrl.initDocument called before all required dependencies were resolved, make ' + 'sure that iniDocument is called after everything is loaded';

        assert(self.stepList.$ready, message);
        // assert(self.documentForm.$ready, message);

        self.stepList.setCurrentStep(self.step);

        // return chained promise, which will do all other common required operations:
        self.actionList = new DocumentActionList(null, self.document, self.parentDocument, $scope);
        return self.actionList.$ready.then(function () {
            //assign actions only if binding is present
            if ($attrs.actions) self.actions = self.actionList;
            self.documentForm.init(self.document, self.options, self.stepList, self.actionList);
            //load metrics to form
            return self.documentForm.loadForm();
        });
    };

    /**
     * This method is called after whole document was initiated,
     * here all $watch, and other such methods should be defined
     */
    this.postinitDocument = function postinitDocument() {

        if (self.actionList.getSaveAction() == null) self.documentForm.setEditable(false);

        $scope.$watch('$ctrl.step', self.onStepChange);
    };

    this.onStepChange = function (newStep, oldStep) {
        if (newStep != oldStep) {
            if (self.documentForm.isEditable()) {
                self.documentForm.validate(oldStep, true);
                self.save();
            }
        }
        self.stepList.setCurrentStep(newStep);
        self.documentForm.setStep(newStep);
    };

    this.save = function () {
        return self.actionList.callSave();
    };

    $scope.$on('engine.common.document.validate', function () {
        self.documentForm.validate(null, true).then(function (valid) {
            if (!valid) self.step = self.stepList.getFirstInvalidIndex();
        });
    });

    $scope.$on('engine.common.document.requestSave', function (event) {
        event.savePromise = self.save();
    });

    $scope.$on('engine.common.action.after', function (event, document, action, result) {});

    $scope.$on('engine.common.document.requestReload', function (event) {
        $log.debug('request reload for document');
        event.reloadPromise = self.getDocument(true).then(function () {
            self.documentForm._setDocument(self.document);
            self.actionList._setDocument(self.document);
        });
    });

    this.$ready = this.getDocument().then(function () {
        return $q.all(self.stepList.$ready, self.documentForm.$ready);
    }).then(this.initDocument).then(this.postinitDocument).then(function () {
        $log.debug('engineDocumentCtrl initialized: ', self);
        console.log(self.$ready.$$state.status);
    });
    console.log(this.$ready.$$state.status);
});
'use strict';

angular.module('engine.document').factory('DocumentModal', function ($resource, $uibModal) {
    return function (_documentId, _documentOptions, parentDocument, callback) {
        var modalInstance = $uibModal.open({
            templateUrl: '/src/document/document-modal.tpl.html',
            controller: function controller($scope, documentId, documentOptions, engineActionsAvailable, StepList, engineResolve, $uibModalInstance) {
                $scope.engineResolve = engineResolve;
                $scope.step = 0;
                $scope.documentOptions = documentOptions;
                $scope.parentDocument = parentDocument;
                $scope.$scope = $scope;
                $scope.stepList = new StepList($scope.documentOptions.document.steps);
                $scope.document = {};
                $scope.documentId = documentId;

                $scope.closeModal = function () {
                    $uibModalInstance.close();
                };

                $scope.$on('engine.common.action.after', function (event, ctx) {
                    if (ctx.result.type == 'REDIRECT') {
                        event.preventDefault();
                        $scope.closeModal();
                    }
                });

                $scope.customButtons = [{ label: 'Cancel', 'action': $scope.closeModal }];
            },
            size: 'lg',
            resolve: {
                documentOptions: function documentOptions() {
                    return _documentOptions;
                },
                documentId: function documentId() {
                    return _documentId;
                }
            }
        });
        modalInstance.result.then(function (result) {
            if (callback) callback(result);
        }, function () {});
    };
});
'use strict';

angular.module('engine.document').controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams, engineResolve, StepList) {
    $scope.engineResolve = engineResolve;
    $scope.options = $route.current.$$route.options;

    $scope.stepList = new StepList($route.current.$$route.options.document.steps);

    $scope.document = {};
    $scope.documentId = $routeParams.id;
    if ($routeParams.step === undefined) $routeParams.step = 0;else $routeParams.step = parseInt($routeParams.step);

    $scope.sideMenuVisible = true;
    $scope.toggleSideMenu = function () {
        $scope.sideMenuVisible = !$scope.sideMenuVisible;
    };

    $scope.$routeParams = $routeParams;

    $scope.$watch('$routeParams.step', function (newVal, oldVal) {

        if (angular.isString(newVal)) {
            newVal = parseInt(newVal);
            $routeParams.step = newVal;
        }
        // $scope.stepList.setCurrentStep(newVal);
        if (newVal !== oldVal) {
            $location.search({ step: newVal || 0 });
        }
    });
});
'use strict';

angular.module('engine.document').factory('DocumentActionList', function (DocumentAction, engActionResource, $engineApiCheck, $q, $log, $http, $rootScope) {
    function DocumentActionList(actions, document, parentDocument, $scope) {
        $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);

        if (parentDocument == null) parentDocument = {};

        var self = this;
        this.$scope = $scope;
        this.parentDocument = parentDocument;
        this.parentDocumentId = document.id != null ? null : parentDocument.id;
        this.actions = [];

        this.markInit = null;

        this.loadActions = function loadActions() {
            return engActionResource.getAvailable(self.document, self.parentDocumentId || self.document.id).$promise.then(function (actions) {
                self.actions = [];
                _.forEach(actions, function (action) {
                    self.actions.push(new DocumentAction(action, self.document, self.parentDocument, self.$scope));
                });
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
        if (document == null || _.isEmpty(document) || document == this.document) return;

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

    DocumentActionList.prototype.callSave = function callSave() {
        var saveAction = this.getSaveAction();

        if (saveAction == null) {
            $log.warn('engine.document.actions No save action specified for document', this.document);
            return $q.reject();
        }
        $log.debug('engine.document.actions Called save for document', this.document);
        return saveAction.call();
    };

    return DocumentActionList;
}).factory('DocumentAction', function (engActionResource, $engineApiCheck, DocumentActionProcess, $log, $q, $rootScope) {
    function DocumentAction(engAction, document, parentDocument, $scope) {
        $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);
        this.document = document;
        this.actionId = engAction.id;
        this.label = engAction.label;
        this.engAction = engAction;
        this.type = engAction.type;
        this.parentDocument = parentDocument;
        this.parentDocumentId = parentDocument.id;
        this.$scope = $scope;
    }

    DocumentAction.prototype.TYPE_CREATE = 'CREATE';
    DocumentAction.prototype.TYPE_UPDATE = 'UPDATE';
    DocumentAction.prototype.TYPE_LINK = 'LINK';
    DocumentAction.prototype.SAVE_ACTIONS = [DocumentAction.prototype.TYPE_CREATE, DocumentAction.prototype.TYPE_UPDATE];
    DocumentAction.prototype.LINK_ACTIONS = [DocumentAction.prototype.TYPE_LINK];

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

    DocumentAction.prototype.call = function call() {
        var self = this;
        var event = null;
        $log.debug('engine.document.actions', 'action called', this);

        if (this.$scope) {
            var promises = [];

            event = this.$scope.$broadcast('engine.common.action.before', { 'document': this.document,
                'action': this,
                'promises': promises });
            this.broadcastNotification('engine.notification.action.before');

            if (event.defaultPrevented) {
                this.$scope.$broadcast('engine.common.action.prevented', { 'document': this.document,
                    'action': this,
                    'event': event });

                this.broadcastNotification('engine.notification.action.prevented');
                return;
            }

            if (this.isSave()) {
                event = self.$scope.$broadcast('engine.common.save.before', { 'document': this.document,
                    'action': this,
                    'promises': promises });

                this.broadcastNotification('engine.notification.save.before');

                if (event.defaultPrevented) {
                    self.$scope.$broadcast('engine.common.save.prevented', { 'document': this.document,
                        'action': this,
                        'event': event });

                    self.broadcastNotification('engine.notification.save.prevented');
                    return;
                }
            }
        }
        return $q.all(promises).then(function () {
            if (self.isLink()) return engActionResource.invoke(self.actionId, self.parentDocument, self.document.id).$promise;else return engActionResource.invoke(self.actionId, self.document, self.parentDocumentId).$promise;
        }).then(function (result) {
            $log.debug('engine.document.actions', 'action call returned', result);
            if (self.$scope) {
                var ev1 = self.$scope.$broadcast('engine.common.action.after', { 'document': self.document, 'action': self, 'result': result });
                var ev2 = self.$scope.$broadcast('engine.common.save.after', { 'document': self.document, 'action': self, 'result': result });

                self.broadcastNotification('engine.notification.action.after');

                if (self.isSave()) self.broadcastNotification('engine.notification.save.after');

                if (ev1.defaultPrevented || ev2.defaultPrevented) return result;
            }
            return DocumentActionProcess(self.document, result);
        }, function (result) {
            self.$scope.$broadcast('engine.common.action.error', { 'document': self.document, 'action': self, 'result': result });
            self.broadcastNotification('engine.notification.action.error');
            if (self.isSave()) self.broadcastNotification('engine.notification.save.error');
            return $q.reject(result);
        });
    };

    DocumentAction.prototype.isSave = function isSave() {
        return _.contains(this.SAVE_ACTIONS, this.type);
    };

    DocumentAction.prototype.isLink = function isLink() {
        return _.contains(this.LINK_ACTIONS, this.type);
    };

    return DocumentAction;
}).factory('DocumentActionProcess', function ($location, $engine, engineDocument, $log, $q) {

    return function DocumentActionHandler(document, actionResponse) {
        if (actionResponse.type == 'REDIRECT') {
            if (document.id == actionResponse.redirectToDocument) return $q.resolve();

            //before redirecting, load document from engine to ascertain it's document type
            return engineDocument.get(actionResponse.redirectToDocument).$promise.then(function (data) {

                if (document.id != null && document.id != actionResponse.redirectToDocument) {
                    $location.$$search.step = 0;
                }

                var documentOptions = $engine.getOptions(data.document.states.documentType);

                if (documentOptions == null) {
                    var message = 'Document type to which redirection was requested has not been registrated! ' + 'Make sure to register it in $engineProvider';

                    $log.error(message, 'DocumentType=', data.document.states.documentType);

                    throw new Error(message);
                }

                if (documentOptions.subdocument == false) {
                    $location.$$path = $engine.pathToDocument(documentOptions, actionResponse.redirectToDocument);
                    $location.$$compose();
                }

                return actionResponse;
            });
        }
    };
});
'use strict';

angular.module('engine.document').factory('engAttachment', function ($engineConfig, $http, Upload, $q) {
    var listUrl = 'attachment-list';
    var singleUrl = 'attachment';

    function EngineAttachment(documentId, metricId, isList) {
        var self = this;
        this.isList = isList || false;
        this.baseUrl = this.isList ? listUrl : singleUrl;
        if (this.isList) self.dataDict = {};
        this.documentId = documentId;
        this.metricId = metricId;
        this.action = null;
        this.data = null;
        this.label = 'Select file';
        this.ready = $q.all([this.loadActions(), $q.when(function () {
            if (self.documentId == null) return;

            return self.loadMetadata();
        }())]);
    }

    EngineAttachment.prototype.clear = function clear() {
        this.data = null;
    };

    EngineAttachment.prototype.getDownloadLink = function getDownloadLink(file) {
        return $engineConfig.baseUrl + this.baseUrl + '/download?documentId=' + this.documentId + '&metricId=' + this.metricId + '&fileId=' + file;
    };

    EngineAttachment.prototype.getFilename = function getFilename(file) {
        if (file == null) {
            if (this.data != null) return this.data.fileName;
            return null;
        } else return (this.dataDict[file] || {}).fileName;
    };

    EngineAttachment.prototype.getSize = function getSize(file) {
        if (file == null) {
            if (this.data != null) return this.data.length;
            return null;
        } else return (this.dataDict[file] || {}).length;
    };

    EngineAttachment.prototype.loadMetadata = function loadMetadata() {
        var self = this;
        this.data = null;
        return $http.get($engineConfig.baseUrl + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId).then(function (response) {
            self.data = response.data.data;

            if (self.isList) self.dataDict = _.indexBy(self.data, 'id');

            return self.data;
        }, function (response) {
            //no attachment
            if (response.status == 404) self.data = [];
        });
    };
    EngineAttachment.prototype.loadActions = function loadActions() {
        var self = this;
        return $http.post($engineConfig.baseUrl + 'action/available/attachment' + '?documentId=' + this.documentId + '&metricId=' + this.metricId).then(function (response) {
            if (response.data.data.length == 0) console.error("No Attachment action available for document: ", self.documentId, " and metric ", self.metricId);
            self.action = response.data.data[0];
            self.label = self.action.label;
        }, function (response) {
            //TODO ERROR MANAGEMENT
        });
    };
    EngineAttachment.prototype.upload = function upload(file) {
        var self = this;

        data = self.isList ? { files: file } : { file: file };

        return Upload.upload({
            url: $engineConfig.baseUrl + '/action/invoke/' + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId + '&actionId=' + this.action.id,
            data: data
        });
    };

    return EngineAttachment;
});

angular.module('engine.document').filter('formatFileSize', function () {
    return function (input) {
        if (input == null) return '- ';
        return Math.floor(input / 1024) + 'kB';
    };
});

angular.module('engine.document').controller('engAttachmentCtrl', function ($scope, Upload, $timeout, engAttachment) {
    var self = this;
    var STATUS = { loading: 0, uploading: 1, disabled: 2, normal: 3 };

    if ($scope.model[$scope.metric.id] == null) $scope.model[$scope.metric.id] = $scope.isList ? [] : null;

    $scope.$watch('model.' + $scope.metric.id, function (newValue, oldValue) {
        if (newValue == null || newValue == oldValue) return;

        if ($scope.ctx.document.id == null) return;

        if ($scope.attachment == null) return;

        $scope.attachment.loadMetadata();
    });

    $scope.delete = function () {
        $scope.status = STATUS.loading;
        $scope.model[$scope.options.key] = $scope.isList ? [] : null;
        $scope.attachment.clear();

        var event = $scope.$emit('engine.common.document.requestSave');

        event.savePromise.then(function () {
            $scope.error = null;
            $scope.status = STATUS.normal;
        }, function () {
            $scope.error = 'Could not save document';
            $scope.status = STATUS.normal;
        });
    };

    $scope.upload = function (file) {
        if (file == null) return;

        var event = $scope.$emit('engine.common.document.requestSave');

        event.savePromise.then(function () {
            $scope.progress = 0;
            $scope.error = null;
            $scope.status = STATUS.uploading;
            $scope.uploadPromise = $scope.attachment.upload(file).then(function (response) {
                console.log('Success ' + response.config.data[$scope.isList ? 'files' : 'file'].name + 'uploaded. Response: ' + response.data);
                $scope.status = STATUS.normal;
                $scope.error = null;

                // This is no longer advised, data is loaded from document now
                // $scope.ctx.document.metrics[$scope.metric.id] = response.data.data.redirectToDocument;

                var event = $scope.$emit('engine.common.document.requestReload');

                event.reloadPromise.then(function () {
                    $scope.attachment.loadMetadata();
                });
            }, function (response) {
                //TODO HANDLE ERROR
                console.log('Error status: ' + response.status);
                $scope.status = STATUS.normal;

                $scope.error = "An error occurred during upload";
            }, function (evt) {
                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
            });
        }, function () {
            $scope.error = 'Could not save document';
            $scope.status = STATUS.normal;
        });
    };

    function _init() {
        $scope.error = null;
        $scope.STATUS = STATUS;
        $scope.status = STATUS.loading;
        if ($scope.ctx.document.id != null) {
            $scope.attachment = new engAttachment($scope.ctx.document.id, $scope.metric.id, $scope.isList);
            $scope.attachment.ready.then(function () {
                $scope.status = STATUS.normal;
            });
        } else {
            $scope.status = STATUS.disabled;
            $scope.disable = true;
        }
    }

    _init();
});

angular.module('engine.document').factory('createAttachmentCtrl', function () {
    return function (metric, ctx, isList) {
        return function ($scope, Upload, $timeout, engAttachment, $controller) {
            $scope.isList = isList;
            $scope.metric = metric;
            $scope.ctx = ctx;
            $controller('engAttachmentCtrl', {
                $scope: $scope,
                Upload: Upload,
                $timeout: $timeout,
                engAttachment: engAttachment
            });
        };
    };
});
'use strict';

angular.module('engine.document').factory('DocumentCategoryFactory', function (DocumentCategory, $log, $parse) {
    function DocumentCategoryFactory() {
        this._categoryTypeList = [];
        this._defaultCategory = new DocumentCategory();

        this._registerBasicCategories();
    }

    DocumentCategoryFactory.prototype.register = function register(documentCategory) {
        this._categoryTypeList.push(documentCategory);
    };

    DocumentCategoryFactory.prototype.makeCategory = function makeCategory(category, ctx) {
        for (var i = this._categoryTypeList.length - 1; i >= 0; --i) {
            if (this._categoryTypeList[i].matches(category)) return this._categoryTypeList[i].makeCategory(category, ctx);
        }

        return this._defaultCategory.makeCategory(category, ctx);
    };

    DocumentCategoryFactory.prototype.makeStepCategory = function makeStepCategory(step) {
        var formStepStructure = {
            fieldGroup: null,
            templateOptions: { 'disabled': true },
            data: {
                'step': step,
                'hide': true,
                '$parse': $parse
            },
            wrapper: 'step'
        };

        formStepStructure.data.hasEntries = function () {
            if (formStepStructure.data.step.data.summary == null) return false;
            return formStepStructure.data.step.data.summary.entries != null && formStepStructure.data.step.data.summary.entries.length > 0;
        };

        return formStepStructure;
    };

    DocumentCategoryFactory.prototype._registerBasicCategories = function _registerBasicCategories() {
        this.register(new DocumentCategory('row', function (formlyCategory, metricCategory, ctx) {
            formlyCategory.templateOptions.wrapperClass = '';
            formlyCategory.wrapper = 'row';
            formlyCategory.data.$process = function () {
                //if there are operator defined widths don't add autogenerated
                if (_.find(formlyCategory.fieldGroup, function (field) {
                    if (field.className == null) return false;
                    return field.className.match(/(col-(md|xs|lg)-\d+)/g) != null;
                }) != null) {
                    return;
                }

                var size = Math.floor(12 / formlyCategory.fieldGroup.length);
                size = size < 1 ? 1 : size;

                _.forEach(formlyCategory.fieldGroup, function (field) {
                    field.className += ' col-md-' + size;
                });
            };
            return formlyCategory;
        }));

        this.register(new DocumentCategory('category', function (formlyCategory, metricCategory, ctx) {
            formlyCategory.templateOptions.wrapperClass = 'text-box';
            formlyCategory.templateOptions.wrapperInnerClass = 'text-content';
            formlyCategory.wrapper = 'category';

            return formlyCategory;
        }));
    };

    return new DocumentCategoryFactory();
}).factory('DocumentCategory', function (ConditionBuilder) {
    function DocumentCategory(categoryCondition, categoryBuilder) {
        if (categoryBuilder == null) categoryBuilder = function categoryBuilder(formlyCategory, metricCategory, ctx) {
            return formlyCategory;
        };
        if (categoryCondition == null) categoryCondition = function categoryCondition() {
            return true;
        };

        this.categoryCondition = ConditionBuilder(categoryCondition);
        this.categoryCustomizer = categoryBuilder;

        this.categoryWrapper = 'default';
        this.categoryWrapperCSS = '';
        this.categoryWrapperInnerCSS = '';
    }

    DocumentCategory.prototype.matches = function matches(metricCategory) {
        return this.categoryCondition(metricCategory);
    };

    DocumentCategory.hasMetrics = function hasMetrics(fieldGroup) {
        return _.find(fieldGroup, function (field) {
            if (field.data.isMetric) return true;
            if (field.fieldGroup != null) return DocumentCategory.hasMetrics(field.fieldGroup);
        }) != null;
    };

    DocumentCategory.prototype.makeCategory = function makeCategory(metricCategory, ctx) {
        //**IMPORTANT NOTE** metricCategory.children should not be parsed here
        //DocumentCategory is parsing only given category, taking care of category hierarchy is part
        //of DocumentForm job, that's why fieldGroup is intentionally set to `null`
        var formlyCategory = {
            templateOptions: {
                categoryId: metricCategory.id,
                wrapperClass: this.categoryWrapperCSS,
                label: metricCategory.label,
                visualClass: metricCategory.visualClass,
                css: metricCategory.visualClass == null ? '' : metricCategory.visualClass.join(' ')
            },
            fieldGroup: null,
            wrapper: this.categoryWrapper,
            data: {
                hasMetrics: function hasMetrics() {
                    return DocumentCategory.hasMetrics(formlyCategory.fieldGroup);
                },
                position: metricCategory.position,
                metricCategory: metricCategory
            }
        };

        return this.categoryCustomizer(formlyCategory, metricCategory, ctx);
    };

    return DocumentCategory;
});
'use strict';

angular.module('engine.document').factory('ConditionBuilder', function ($engineApiCheck) {
    var _apiCheck = $engineApiCheck;

    return function (fieldCondition) {
        _apiCheck([_apiCheck.oneOfType([_apiCheck.func, _apiCheck.string, _apiCheck.object])], arguments);

        var rFieldCondition = null;

        if (_.isFunction(fieldCondition)) rFieldCondition = fieldCondition;else {
            var _condition;
            if (_.isString(fieldCondition)) _condition = { visualClass: fieldCondition };else _condition = fieldCondition;

            rFieldCondition = function rFieldCondition(metric) {
                for (var metricAttribute in _condition) {
                    if (_.isArray(metric[metricAttribute]) && !_.contains(metric[metricAttribute], _condition[metricAttribute])) return false;else if (_.isString(metric[metricAttribute]) && metric[metricAttribute] != _condition[metricAttribute]) return false;else if (metric[metricAttribute] == null) return false;
                }
                return true;
            };
        }

        return rFieldCondition;
    };
});
'use strict';

angular.module('engine.document').factory('DocumentFieldFactory', function (DocumentField, $engine, $log, createAttachmentCtrl) {
    function DocumentFieldFactory() {
        this._fieldTypeList = [];
        this._defaultField = new DocumentField();

        this._registerBasicCategories();
    }

    /**
     * Helper function converting engineOptions to formly option which allows
     * angular-formly to generate select box / radio button group / etc
     *
     * @param engineOptions
     * @returns {Array}
     * @private
     */
    DocumentFieldFactory.prototype._engineOptionsToFormly = function _engineOptionsToFormly(engineOptions) {
        var r = [];
        _.forEach(engineOptions, function (option) {

            r.push({ name: option.attributes != null && option.attributes.label != null ? option.attributes.label : option.value,
                value: option.value,
                extraField: true });
        });
        return r;
    };

    DocumentFieldFactory.prototype.register = function register(documentField) {
        this._fieldTypeList.push(documentField);
    };

    /**
     *
     * @param metricList
     * @param metric
     * @param {object} ctx should contain following parameters:
     *
     * {document: model of the document, options: document options, documentForm: DocumentForm instance}
     */
    DocumentFieldFactory.prototype.makeField = function makeField(metricList, metric, ctx) {
        for (var i = this._fieldTypeList.length - 1; i >= 0; --i) {
            if (this._fieldTypeList[i].matches(metric)) return this._fieldTypeList[i].makeField(metricList, metric, ctx);
        }
        if (!this.allowDefaultField) {
            var message = "DocumentFieldFactory.allowDefaultField is false but there was a metric which could not be matched to registered types: ";
            $log.error(message, "Metric", metric, "Registered types", this._fieldTypeList);
            throw new Error(message);
        }
        return this._defaultField.makeField(metricList, metric, ctx);
    };

    DocumentFieldFactory.prototype.makeFields = function makeFields(metricList, ctx) {
        var fields = [];

        _.forEach(metricList, function (metric) {
            fields.push(this.makeField(metricList, metric, ctx));
        }, this);

        return fields;
    };

    DocumentFieldFactory.prototype._registerBasicCategories = function _registerBasicFields(metric) {
        var self = this;

        this.register(new DocumentField({ inputType: 'TEXT' }, function (field, metric, ctx) {
            return field;
        }));

        this.register(new DocumentField({ inputType: 'ATTACHMENT' }, function (field, metric, ctx) {
            field.type = 'attachment';
            field.controller = createAttachmentCtrl(metric, ctx, false);
            return field;
        }));

        this.register(new DocumentField({ inputType: 'ATTACHMENT_LIST' }, function (field, metric, ctx) {
            field.type = 'attachmentList';
            field.controller = createAttachmentCtrl(metric, ctx, true);
            return field;
        }));

        this.register(new DocumentField({ visualClass: 'select', inputType: 'SELECT' }, function (field, metric, ctx) {
            field.type = 'select';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({ visualClass: 'select', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelect';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({ visualClass: '@verticalMultiSelect', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelectVertical';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({ visualClass: '@imgMultiSelect', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelectImage';
            // field.templateOptions.options = self._engineOptionsToFormly(metric.options);
            var cols = metric.cols || 2;
            field.templateOptions.cols = [];
            field.templateOptions.colClass = 'col-md-' + 12 / cols;
            field.templateOptions.optionsPerCol = Math.ceil(metric.options.length / cols);

            for (var i = 0; i < cols; ++i) {
                var col = [];
                field.templateOptions.cols.push(col);
                for (var j = 0; j < field.templateOptions.optionsPerCol && i * field.templateOptions.optionsPerCol + j < metric.options.length; ++j) {
                    var cm = metric.options[i * field.templateOptions.optionsPerCol + j];
                    col.push({ value: cm.value, css: cm.visualClass != null ? cm.visualClass.join(' ') : '', label: cm.value });
                }
            }
            if (field.model[field.key] == null) field.model[field.key] = [];

            field.controller = function ($scope) {
                $scope.addRemoveModel = function (element) {
                    if (_.contains(field.model[field.key], element)) field.model[field.key].splice(field.model[field.key].indexOf(element), 1);else field.model[field.key].push(element);
                    $scope.options.templateOptions.onChange(field.model[field.key], field, $scope);
                };
            };

            field.data.isActive = function (element) {
                return _.contains(field.model[field.key], element);
            };

            return field;
        }));

        this.register(new DocumentField('radioGroup', function (field, metric, ctx) {
            field.type = 'radioGroup';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({ visualClass: 'date', inputType: 'DATE' }, function (field, metric, ctx) {
            field.type = 'datepicker';
            field.data.prepareValue = function (originalValue) {
                if (originalValue == null) return originalValue;
                return new Date(originalValue);
            };
            // field.data.onChangeHandlers = [];
            field.templateOptions.onBlur = undefined;
            return field;
        }));

        this.register(new DocumentField('checkbox', function (field, metric, ctx) {
            field.type = 'checkbox';

            return field;
        }));

        this.register(new DocumentField({ inputType: 'INTEGER' }, function (field, metric, ctx) {
            field.type = 'input';
            field.templateOptions.type = 'text';
            //this will be automatically added to input with ng-model
            field.templateOptions.numberConvert = 'true';

            field.data.prepareValue = function (value) {
                var parsedValue = parseInt(value);

                return _.isNaN(parsedValue) ? value : parsedValue;
            };
            return field;
        }));

        this.register(new DocumentField({ inputType: 'FLOAT' }, function (field, metric, ctx) {
            field.type = 'input';
            field.templateOptions.type = 'text';
            //this will be automatically added to input with ng-model
            field.templateOptions.floatConvert = 'true';

            field.data.prepareValue = function (value) {
                var parsedValue = parseFloat(value);

                return _.isNaN(parsedValue) ? value : parsedValue;
            };
            return field;
        }));

        this.register(new DocumentField({ inputType: 'NUMBER' }, function (field, metric, ctx) {
            field.type = 'input';
            field.templateOptions.type = 'text';
            //this will be automatically added to input with ng-model
            field.templateOptions.numberConvert = 'true';

            field.data.prepareValue = function (value) {
                var parsedValue = parseInt(value);

                return _.isNaN(parsedValue) ? value : parsedValue;
            };
            return field;
        }));

        this.register(new DocumentField({ inputType: 'TEXTAREA' }, function (field, metric, ctx) {
            field.type = "textarea";
            field.templateOptions.rows = 4;
            field.templateOptions.cols = 15;

            return field;
        }));

        this.register(new DocumentField({ inputType: 'EXTERNAL' }, function (field, metric, ctx) {
            return {
                data: field.data,
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' + 'options="options.templateOptions.options" metric="options.data.metric" errors="fc.$error" ' + 'class="' + metric.visualClass.join(' ') + '" ' + 'ng-disabled="options.data.form.disabled" ' + 'formly-options="options" ' + 'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: { ngModel: ctx.document, options: ctx.options }
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({ inputType: 'QUERIED_LIST' }, function (field, metric, ctx) {
            field = {
                data: _.extend(field.data, { queries: ctx.options.document.queries[metric.id] }),
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" ' + 'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + ' list-caption="\'' + metric.label + '\'"' + ' metric-id="' + metric.id + '"' + ' single-document="options.data.queries.singleDocument || ' + (_.find(metric.visualClass, function (visualClass) {
                    return visualClass == '@singleDocument';
                }) != null ? true : false) + '"' + ' columns="options.data.queries.columns"' + ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '" on-select-behavior="' + metric.onSelectBehavior + '"></engine-document-list>',
                templateOptions: {
                    options: $engine.getOptions(metric.modelId),
                    document: ctx.document
                } //, expressionProperties: {'templateOptions.disabled': 'false'}
            };

            return field;
        }));
    };

    return new DocumentFieldFactory();
}).factory('DocumentField', function (ConditionBuilder) {
    function DocumentField(fieldCondition, fieldBuilder) {
        if (fieldBuilder == null) fieldBuilder = function fieldBuilder(formlyField, metric, ctx) {
            return formlyField;
        };
        if (fieldCondition == null) fieldCondition = function fieldCondition() {
            return true;
        };

        this.fieldCondition = ConditionBuilder(fieldCondition);
        this.fieldCustomizer = fieldBuilder;
    }

    //make it class method, to not instantiate it for every field
    DocumentField.onChange = function ($viewValue, $modelValue, $scope) {
        _.forEach($scope.options.data.onChangeHandlers, function (callback) {
            callback($viewValue, $modelValue, $scope);
        });
    };
    DocumentField.validate = function ($viewValue, $modelValue, $scope) {};
    DocumentField.onReload = function ($viewValue, $modelValue, $scope) {
        //emit reload request for dom element which wants to listen (eg. document)
        $scope.$emit('document.form.requestReload');
        $scope.options.data.form._onReload();
    };
    DocumentField.onValidateSelf = function ($viewValue, $modelValue, $scope) {
        var metricToValidate = {};
        metricToValidate[$scope.options.data.metric.id] = $viewValue == null ? null : $viewValue;
        $scope.options.data.form.validator.validateMetrics($modelValue, metricToValidate);
    };
    DocumentField.onValidate = function ($viewValue, $modelValue, $scope) {
        //emit validate request for dom element which wants to listen (eg. document)
        $scope.$emit('document.form.requestValidate');

        $scope.options.data.form.validateCurrentStep(false);
    };

    DocumentField.prototype.matches = function matches(metric) {
        return this.fieldCondition(metric);
    };

    DocumentField.prototype.makeField = function makeField(metricList, metric, ctx) {
        var formlyField = {
            key: metric.id,
            model: ctx.document.metrics,
            type: 'input',
            className: metric.visualClass.join(' '),
            data: {
                'metric': metric,
                position: metric.position,
                isMetric: true,
                form: ctx.documentForm,
                categoryId: metric.categoryId,
                unit: metric.unit,
                id: metric.id, //this is required for DocumentForm
                onChangeHandlers: []
            },
            templateOptions: {
                type: 'text',
                label: metric.label,
                metricId: metric.id,
                description: metric.description,
                placeholder: 'Enter missing value',
                // required: metric.required, now it's handled by server side validation
                visualClass: metric.visualClass,
                onChange: DocumentField.onChange
            },
            ngModelAttrs: {
                metricId: {
                    attribute: 'metric-id'
                }
            },
            expressionProperties: {
                'templateOptions.disabled': function templateOptionsDisabled($viewValue, $modelValue, scope) {
                    return scope.options.data.form.disabled; //|| !(scope.options.data.metric.editable == true); //enable it when it's supported by the backend
                }
            },
            validation: {
                messages: {
                    server: function server(viewValue, modelValue, scope) {
                        return _.isArray(scope.to.serverErrors) && scope.to.serverErrors.length > 0 ? scope.to.serverErrors[0] : '';
                    }
                    //date: 'to.label+"_date"'
                }
            }
        };

        if (metric.unit != null) formlyField.wrapper = 'unit';

        if (metric.reloadOnChange == true) {
            formlyField.data.onChangeHandlers.push(DocumentField.onReload);
        }

        //if validateOnChange is true all other metrics should be validated after this one changes
        if (metric.validateOnChange == true) {
            if (['TEXT', 'TEXTAREA', 'NUMBER', 'FLOAT', 'INTEGER'].indexOf(metric.inputType) != -1) {
                formlyField.templateOptions.onBlur = DocumentField.onValidate;
            } else {
                formlyField.data.onChangeHandlers.push(DocumentField.onValidate);
            }
        }
        //otherwise only this metrics
        else {
                if (['TEXT', 'TEXTAREA', 'NUMBER', 'FLOAT', 'INTEGER'].indexOf(metric.inputType) != -1) {
                    formlyField.templateOptions.onBlur = DocumentField.onValidateSelf;
                } else {
                    formlyField.data.onChangeHandlers.push(DocumentField.onValidateSelf);
                }
            }

        var ret = this.fieldCustomizer(formlyField, metric, ctx);

        //if metric uses non standard JSON data type (eg. DATE, call it's prepare method, to preprocess data before loading)
        if (_.isFunction(ret.data.prepareValue)) {
            ctx.document.metrics[metric.id] = ret.data.prepareValue(ctx.document.metrics[metric.id]);
        }

        return ret;
    };

    return DocumentField;
}).directive('numberConvert', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function link(scope, element, attrs, ngModelCtrl) {
            if (scope.model && typeof scope.model == 'string') {
                if (!scope.model.match(/^\d+$/)) scope.model = val;else {
                    var pv = Number(scope.model);
                    if (!_.isNaN(pv)) scope.model = pv;
                }
            }
            scope.$watch('model', function (val, old) {
                if (typeof val == 'string') {
                    if (!val.match(/^\d+$/)) scope.model = val;else {
                        var pv = Number(val);
                        if (!_.isNaN(pv)) scope.model = pv;else scope.model = val;
                    }
                }
            });
        }
    };
}).directive('floatConvert', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function link(scope, element, attrs, ngModelCtrl) {
            if (scope.model && typeof scope.model == 'string') {
                if (!scope.model.match(/^\d+(\.\d+)?$/)) scope.model = val;else {
                    var pv = Number(scope.model);
                    if (!_.isNaN(pv)) scope.model = pv;
                }
            }
            scope.$watch('model', function (val, old) {
                if (typeof val == 'string') {
                    if (!val.match(/^\d+(\.\d+)?$/)) scope.model = val;else {
                        var pv = Number(val);
                        if (!_.isNaN(pv)) scope.model = pv;else scope.model = val;
                    }
                }
            });
        }
    };
});
'use strict';

angular.module('engine.document').factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, $q, DocumentCategoryFactory, $engineApiCheck, $log, DocumentValidator) {
    var _apiCheck = $engineApiCheck;

    function DocumentForm() {
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.documentOptions = null;
        this.steps = null;
        this.disabled = false;
        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';
        this.formStructure = [];
        this.currentFormlyFields = [];
        this.formlyFields = [];
        this.validator = null;
        this.currentStep = null;
        this.categoriesDict = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {object}
         */
        // this.formlyState = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {{}}
         */
        // this.formlyOptions = {};
        this.formLoaded = false;
        this.markInit = null;
        var self = this;
        this.$ready = $q(function (resolve, reject) {
            self.markInit = resolve;
        }).then(function () {
            return self._loadMetricCategories();
        });
    }

    DocumentForm.prototype.loadForm = function loadForm() {
        var self = this;

        return this.$ready.then(function () {
            return self._loadMetrics();
        }).then(function () {
            self._makeForm();
            self.formLoaded = true;
        });
    };

    /**
     * INTERNAL FUNCTION, as it is callback from form controls, it does not have to check state of the form
     * IN FUTURE it may be made public, in which case check will have to be added in order to make sure, that
     * initial form has been loaded
     *
     * @returns {Promise<U>|Promise<R>}
     * @private
     */
    DocumentForm.prototype._reloadForm = function reloadForm() {
        var self = this;

        if (!this.formLoaded) {
            $log.error('DocumentForm._reloadForm called without waiting for DocumentForm.loadForm');
            throw new Error();
        }

        return engineMetric(this.document, function (metricList) {
            console.log('New loaded metrics: ', metricList);
            var metricDict = _.indexBy(metricList, 'id');

            var newMetrics = _.reject(metricList, function (metric) {
                return metric.id in self.metricDict;
            });

            console.log('New metrics: ', newMetrics);

            //remove metrics, which are not present in metricList
            _.forEach(self.metricList, function (metric) {
                if (!(metric.id in metricDict)) {

                    var metricIndex = _.findIndex(self.categoriesDict[metric.categoryId].fieldGroup, function (field) {
                        return field.data.id == metric.id;
                    });
                    if (metricIndex == -1) return;

                    console.log('Metric to remove: ', metric, 'index: ', metricIndex);
                    delete self.metricDict[metric.id];
                    self.categoriesDict[metric.categoryId].fieldGroup.splice(metricIndex, 1);
                    delete self.document.metrics[metric.id];
                }
            });

            //add new metrics to the form, with respect to position
            _.forEach(newMetrics, function (newMetric) {
                console.log(self.categoriesDict[newMetric.categoryId]);
                self.addMetric(newMetric);
                var field = DocumentFieldFactory.makeField(self.metricList, newMetric, { document: self.document,
                    options: self.documentOptions,
                    documentForm: self });
                self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 0, field);

                self.categoriesDict[newMetric.categoryId].fieldGroup = _.sortBy(self.categoriesDict[newMetric.categoryId].fieldGroup, function (metric) {
                    return metric.data.position;
                });

                for (var i = 0; i < self.steps.getSteps().length; ++i) {
                    var step = self.steps.getStep(i);
                    if (self.categoriesDict[field.data.categoryId] === undefined) {
                        $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
                        continue;
                    }
                    if (step.metrics[field.data.categoryId] === undefined) continue;

                    step.fields[field.data.id] = field;
                    break;
                }
            });
        }).$promise;
    };

    DocumentForm.prototype.addMetric = function addMetric(metric) {
        if (metric.id in this.metricDict) return;

        this.metricList.push(metric);
        this.metricDict[metric.id] = metric;
    };

    DocumentForm.prototype._loadMetricCategories = function loadMetricCategories() {
        var self = this;

        return engineMetricCategories.then(function (metricCategories) {
            self.metricCategories = metricCategories;
        });
    };
    DocumentForm.prototype._setDocument = function setDocument(document) {
        if (this.document != null) {
            this.document = document;
            _.forEach(this.fieldList, function (field) {
                field.model = document.metrics;
            });
        } else this.document = document;
    };
    DocumentForm.prototype._setActions = function setActions(actions) {
        this.actions = actions;
    };
    DocumentForm.prototype._setOptions = function setOptions(documentOptions) {
        this.documentOptions = documentOptions;
    };
    DocumentForm.prototype._setSteps = function setSteps(steps) {
        this.steps = steps;

        _.forEach(this.steps.getSteps(), function (step) {
            _.forEach(step.metricCategories, function (metricCategory) {
                if (_.isArray(metricCategory.visualClass)) metricCategory.visualClass.push('category');else metricCategory.visualClass = ['category'];
            });
        });
    };
    DocumentForm.prototype.init = function init(document, options, steps, actions) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object)], arguments);

        this._setDocument(document);
        this._setOptions(options);
        this._setSteps(steps);
        this._setActions(actions);

        this.markInit();
    };

    DocumentForm.prototype.setEditable = function setEditable(editable) {
        this.disabled = !editable;
    };

    DocumentForm.prototype.isEditable = function isEditable() {
        return !this.disabled;
    };

    DocumentForm.prototype.setStep = function setStep(step) {
        this.currentFormlyFields = this.formStructure[step];

        if (this.currentStep != null) this.formStructure[this.currentStep].data.hide = true;

        this.currentStep = step;
        this.formStructure[this.currentStep].data.hide = false;
        $log.debug('current fields to display in form', this.currentFormlyFields);
    };

    DocumentForm.prototype._assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document' + message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions' + message);
        assert(this.steps != null, 'DocumentForm.steps' + message);
        assert(this.actions != null, 'DocumentForm.actions' + message);
    };

    DocumentForm.prototype._onReload = function onReload() {
        $log.debug('Form reload called');
        this._reloadForm();
    };

    DocumentForm.prototype._makeForm = function makeForm() {
        var self = this;

        console.log('DocumentForm._makeForm', this.fieldList);
        this._assertInit();

        assert(this.metricList.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetrics');
        assert(this.metricCategories.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetricCategories');

        var _categoriesToPostProcess = [];

        _.forEach(this.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory(step);
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
        });
        _.forEach(this.steps.getSteps(), function (step) {
            connectFields(step);
        });

        postprocess();

        reorderFields();
        setDefaultValues();

        this.validator = new DocumentValidator(this.document, this.steps, this.formlyState);

        console.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(step, metricCategories) {
            var formCategories = [];
            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, { document: self.document });

                formMetricCategory.fieldGroup = parseMetricCategories(step, metricCategory.children);

                self.categoriesDict[metricCategory.id] = formMetricCategory;
                step.metrics[metricCategory.id] = formMetricCategory;
                if (_.isFunction(formMetricCategory.data.$process)) _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields(step) {
            _.forEach(self.fieldList, function (field) {
                if (self.categoriesDict[field.data.categoryId] === undefined) {
                    $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
                    return;
                }
                if (step.metrics[field.data.categoryId] === undefined) return;

                self.categoriesDict[field.data.categoryId].fieldGroup.push(field);
                step.fields[field.data.id] = field;
            });
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            });
        }

        function setDefaultValues() {
            _.forEach(self.metricDict, function (metric, metricId) {
                if (metric.defaultValue != null && self.document.metrics[metricId] == null) self.document.metrics[metricId] = metric.defaultValue;
            });
        }

        function reorderFields() {
            _.forEach(self.categoriesDict, function (metricCategory) {
                metricCategory.fieldGroup = _.sortBy(metricCategory.fieldGroup, function (field) {
                    return field.data.position;
                });
            });
        }
    };

    DocumentForm.prototype._updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, { document: this.document, options: this.documentOptions, documentForm: this });
    };

    DocumentForm.prototype._loadMetrics = function loadMetrics() {
        var self = this;

        return engineMetric(this.document, function (metricList) {
            self.metricList = metricList;
            self.metricDict = _.indexBy(self.metricList, 'id');
            self._updateFields(self.metricList);
        }).$promise;
    };

    DocumentForm.prototype.validateCurrentStep = function validateCurrentStep(fillNull) {
        return this.validator.validate(this.currentStep, fillNull);
    };

    DocumentForm.prototype.validate = function validate(step, fillNull) {
        return this.validator.validate(step, fillNull);
    };

    return DocumentForm;
});
'use strict';

angular.module('engine.document').factory('StepList', function (Step, $q, engineMetricCategories, $engineApiCheck, $log, $parse) {
    var _ac = $engineApiCheck;

    function StepList(documentOptionSteps) {
        var self = this;

        this.documentSteps = documentOptionSteps;
        this.steps = [];
        this.singleStep = false;
        this.$ready = null;

        this.currentStep = null;
    }

    StepList.prototype.setDocument = function setDocument(document) {
        var self = this;
        this.document = document;

        this.documentSteps = _.filter(this.documentSteps, function (step) {
            var cond = step.condition;
            if (cond == null) return true;else if (_.isString(cond)) {
                return $parse(cond)(self.document);
            } else if (_.isFunction(cond)) {
                return cond(self.document);
            } else return false;
        });
        this._preprocessDocumentSteps();
    };

    StepList.prototype._preprocessDocumentSteps = function _preprocessDocumentSteps() {
        var self = this;

        this.$ready = engineMetricCategories.then(function (metricCategories) {
            assert(_.isArray(self.documentSteps) && !_.isEmpty(self.documentSteps), 'documentSteps were not defined');

            _.forEach(self.documentSteps, function (step, index) {
                if (_.isArray(step.categories)) {
                    var _categories = [];
                    _.forEach(step.categories, function (categoryId) {
                        _categories.push(metricCategories.getNames(categoryId));
                    });

                    self.steps.push(new Step(_categories, step, index));
                } else {
                    //is string (metricCategory) so we have to retrieve its children
                    if (!(step.categories in metricCategories.metrics)) {
                        $log.error(step.categories, ' not in ', metricCategories.metrics, '. Make sure that metric category registered in document.steps exists');
                        throw new Error();
                    }

                    self.steps.push(new Step(metricCategories.metrics[step.categories].children, step, index));
                }
            });
        });
    };

    StepList.prototype.isLast = function isLast(step) {
        return step == this.steps.length - 1;
    };

    StepList.prototype.getFirstInvalid = function getFirstInvalid() {
        return _.find(this.steps, function (step) {
            return step.state == Step.STATE_INVALID;
        });
    };

    StepList.prototype.getFirstInvalidIndex = function getFirstInvalidIndex() {
        return this.getFirstInvalid().index;
    };

    StepList.prototype.getSteps = function getSteps() {
        return this.steps;
    };

    StepList.prototype.getStep = function getStep(stepIndex) {
        return this.steps[stepIndex];
    };

    StepList.prototype.setCurrentStep = function setCurrentStep(stepIndex) {
        this.currentStep = this.steps[stepIndex];
    };

    StepList.prototype.getCurrentStep = function getCurrentStep() {
        return this.currentStep;
    };

    StepList.prototype.getCurrentStepIndex = function getCurrentStepIndex() {
        return this.steps.indexOf(this.currentStep);
    };

    return StepList;
}).factory('Step', function ($engineApiCheck) {

    function Step(metricCategories, data, index, visible) {
        this.metricCategories = metricCategories;
        this.metrics = {};
        this.fields = {};
        this.visible = visible != null;
        this.state = Step.defaultState;
        this.$valid = false;
        this.name = data.name;
        this.index = index;
        this.data = data;
    }

    Step.STATE_VALID = 'valid';
    Step.STATE_INVALID = 'invalid';
    Step.STATE_BLANK = 'blank';
    Step.STATE_LOADING = 'loading';
    Step.validStates = [Step.STATE_VALID, Step.STATE_INVALID, Step.STATE_LOADING, Step.STATE_BLANK];
    Step.defaultState = 'blank';

    Step.prototype.setState = function setState(state) {
        assert(state != null, 'Privided state (', state, ') is not in', Step.validStates);
        $engineApiCheck([$engineApiCheck.oneOf(Step.validStates)], arguments);
        this.state = state;
    };

    Step.prototype.getState = function getState() {
        return this.state;
    };

    return Step;
});
'use strict';

angular.module('engine.document')
/**
 * @ngdoc service
 * @name engine.document.service:DocumentValidator
 *
 * @description
 * Document validation service
 *
 */
.factory('DocumentValidator', function (engineDocument, $engineApiCheck, $log, Step) {
    function DocumentValidator(document, stepList, formStructure) {
        this.stepList = stepList;
        this.formStructure = formStructure;
        this.document = document;
    }

    DocumentValidator.prototype.setStepsState = function setStepsState(steps, state) {
        $engineApiCheck([$engineApiCheck.arrayOf($engineApiCheck.instanceOf(Step)), $engineApiCheck.oneOf(Step.validStates)], arguments);
        _.forEach(steps, function (step) {
            step.setState(state);
        });
    };

    DocumentValidator.prototype.cleanDocumentMetrics = function makeDocumentForValidation() {
        var documentForValidation = _.omit(this.document, 'metrics');
        documentForValidation.metrics = {};
        return documentForValidation;
    };
    DocumentValidator.prototype.makeDocumentForValidation = function makeDocumentForValidation(document, stepsToValidate, fillNull) {
        var documentForValidation = this.cleanDocumentMetrics();

        _.forEach(stepsToValidate, function (step) {
            _.forEach(step.fields, function (field) {
                documentForValidation.metrics[field.data.id] = document.metrics[field.data.id];
                if (fillNull && documentForValidation.metrics[field.data.id] === undefined) // if field has not been set, set it to null, otherwise it won't be sent
                    documentForValidation.metrics[field.data.id] = null;
            });
        });

        return documentForValidation;
    };

    /**
     * @ngdoc method
     * @name validateMetrics
     * @methodOf engine.document.service:DocumentValidator
     *
     * @description
     * Validates given metrics, returns promise
     *
     * @param {Object} metrics dict `{metricId: metricValue}`
     * @returns {Promise} Promise of server validation
     */
    DocumentValidator.prototype.validateMetrics = function (field, metrics) {
        var self = this;
        $engineApiCheck.throw([$engineApiCheck.object], arguments);
        var documentForValidation = this.cleanDocumentMetrics();
        documentForValidation.metrics = metrics;
        return engineDocument.validate(documentForValidation).$promise.then(function (validatedMetrics) {
            validatedMetrics = _.indexBy(validatedMetrics.results, 'metricId');
            self.setMetricValidation(field, validatedMetrics);

            return validatedMetrics;
        });
    };

    DocumentValidator.prototype.setMetricValidation = function (field, validatedMetrics) {
        var self = this;
        if (self.formStructure[field.id] != null) {
            if (validatedMetrics[field.key] != null)
                // _.forEach(validatedMetrics[field.key].messages, function (message) {
                // self.formStructure[field.id].$setValidity(message, false);
                // });
                self.formStructure[field.id].$setValidity('server', validatedMetrics[field.key].valid);

            field.validation.show = !validatedMetrics[field.key].valid;
        }
        field.templateOptions.serverErrors = validatedMetrics[field.key] == null ? [] : validatedMetrics[field.key].messages;
    };

    DocumentValidator.prototype.validate = function validate(step, fillNull) {
        $engineApiCheck([$engineApiCheck.typeOrArrayOf($engineApiCheck.number).optional], arguments);

        var self = this;

        $log.debug('DocumentValidator.validate called');

        var stepsToValidate = [];

        if (step == null) stepsToValidate = this.stepList.getSteps();else {
            if (!_.isArray(step)) step = [step];

            _.forEach(step, function (stepIndex) {
                stepsToValidate.push(self.stepList.getStep(stepIndex));
            });
        }

        this.setStepsState(stepsToValidate, Step.STATE_LOADING);

        var documentForValidation = this.makeDocumentForValidation(this.document, stepsToValidate, fillNull);

        return engineDocument.validate(documentForValidation).$promise.then(function (validationData) {
            $log.debug(validationData);

            var _validatedMetrics = _.indexBy(validationData.results, 'metricId');

            _.forEach(stepsToValidate, function (step) {
                _.forEach(step.fields, function (field, fieldId) {
                    if (fieldId in _validatedMetrics) {
                        if (_validatedMetrics[fieldId].valid == false) step.setState(Step.STATE_INVALID);

                        self.setMetricValidation(field, _validatedMetrics);
                    }
                });

                $log.debug(self.formStructure.$error);

                if (step.getState() == Step.STATE_LOADING) step.setState(Step.STATE_VALID);
            });

            return validationData.valid;
        });

        //
        // engineDocument.validate($scope.document, function (data) {
        //     console.log(data);
        //     self.form.form.$externalValidated = true;
        //     self.form.backendValidation = data;
        //
        //     var _failedCategories = {};
        //
        //     var _mentionedCategories = {};
        //
        //     angular.forEach(self.form.backendValidation.results, function (metric) {
        //         var categoryId = self.allMetrics_d[metric.metricId].categoryId;
        //         if(metric.valid === false){
        //             _failedCategories[categoryId] = true;
        //         }
        //         _mentionedCategories[categoryId] = true;
        //
        //         if(!dontShowErrors)
        //             if(metric.metricId in $scope.metrics && $scope.metrics[metric.metricId].formControl){
        //                 $scope.metrics[metric.metricId].validation.show = true;
        //                 $scope.metrics[metric.metricId].formControl.$validate();
        //             }
        //     });
        //
        //     angular.forEach($scope.steps, function (step, index) {
        //         angular.forEach(step.categories, function (category) {
        //             if(category in _failedCategories)
        //                 self.validatedSteps[index] = 'invalid';
        //             else if(!(category in _mentionedCategories) && self.validatedSteps[index] != 'invalid')
        //                 self.validatedSteps[index] = 'blank';
        //
        //         })
        //     });
        //
        //     if(self.validatedSteps){
        //         var _firstFailedStep = null;
        //
        //         for(var i=0; i < self.validatedSteps.length; ++i){
        //             if(self.validatedSteps[i] == 'loading') {
        //                 self.validatedSteps[i] = 'valid';
        //             }
        //             else if(_firstFailedStep === null)
        //                 _firstFailedStep = i;
        //         }
        //
        //         if(!dontShowErrors && _firstFailedStep !== null) {
        //             self.step = _firstFailedStep;
        //             self.showErrors = true;
        //         }
        //     }
        //
        //
        // }, function (response) {
        //     if(self.validatedSteps)
        //         for(var i=0; i < self.validatedSteps.length; ++i)
        //             self.validatedSteps[i] = 'invalid';
        // });
    };

    return DocumentValidator;
});
'use strict';

angular.module('engine.steps').component('engineSteps', {
    templateUrl: '/src/document/steps.tpl.html',
    controller: function controller($timeout) {
        var self = this;

        this.changeStep = function (newStep) {
            self.step = newStep;
        };
    },
    bindings: {
        ngModel: '=',
        step: '=',
        stepList: '=',
        options: '='
    }
});
'use strict';

/**
 * @ngdoc controller
 * @name engine.controller:engineMainCtrl
 * @description
 *
 * Main application controller, does not have much functionality yet,
 * apart from setting a few `$rootScope` variables
 *
 */
angular.module('engine').controller('engineMainCtrl', function ($rootScope, engineResourceLoader) {
    $rootScope.resourcesLoaded = false;

    if (engineResourceLoader.resources == 0) $rootScope.resourcesLoaded = true;else $rootScope.$on('engine.common.resourcesLoaded', function () {
        $rootScope.resourcesLoaded = true;
    });
});
'use strict';

angular.module('engine').provider('$engineConfig', function () {
    var self = this;
    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    this.$get = function () {
        return {
            baseUrl: _baseUrl,
            setBaseUrl: self.setBaseUrl
        };
    };
}).provider('$engineApiCheck', function () {

    this.apiCheck = apiCheck({});

    var _apiCheck = this.apiCheck;

    this.apiCheck = _apiCheck;

    this.$get = function () {
        return _apiCheck;
    };
}).service('engineResourceLoader', function ($rootScope, $log) {
    var _resourcesCount = 0;

    return {
        register: function register(promise) {
            $log.debug('registered resource', promise);
            ++_resourcesCount;
            promise.then(function () {
                --_resourcesCount;
                if (_resourcesCount == 0) $rootScope.$broadcast('engine.common.resourcesLoaded');
            });
        },
        resources: _resourcesCount
    };
})
/**
 * @ngdoc service
 * @name engine.provider:$engineProvider
 *
 * @description
 * Basic means of configuration
 */
.provider('$engine', function ($routeProvider, $engineApiCheckProvider, $engineFormlyProvider) {
    var self = this;

    var dashboards = [];
    var documents = [];
    var documents_d = {};

    var _apiCheck = $engineApiCheckProvider.apiCheck;
    _apiCheck.columnOptions = _apiCheck.arrayOf(_apiCheck.shape({ name: _apiCheck.string, caption: _apiCheck.string.optional, style: _apiCheck.string.optional, type: _apiCheck.string.optional })).optional;
    _apiCheck.documentOptions = _apiCheck.shape({
        documentJSON: _apiCheck.object,
        name: _apiCheck.string,
        list: _apiCheck.shape({
            caption: _apiCheck.string,
            templateUrl: _apiCheck.string,
            createButtonLabel: _apiCheck.string.optional,
            customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({ 'label': _apiCheck.string, 'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string]) })).optional
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.object),
            showValidateButton: _apiCheck.bool.optional,
            caption: _apiCheck.string.optional,
            queries: _apiCheck.object.optional
        })
    });

    var _defaultDocumentOptions = {
        list: {
            templateUrl: '/src/list/list.wrapper.tpl.html'
        },
        document: {
            templateUrl: '/src/document/document.wrapper.tpl.html',
            showValidationButton: true
        }
    };

    function prepareDocumentOptions(options) {
        if (options.list.customButtons == null) options.list.customButtons = [];

        if (!_.isArray(options.list.customButtons)) options.list.customButtons = [options.list.customButtons];
    }

    /**
     * @ngdoc method
     * @name dashboard
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Register dashboard in angular-engine, angular URL will be generated queries to declared documents
     * will be displayed using column definitions in those declarations.
     *
     * @param {string|Object} url Angular url to created dashboard
     * example: `/sample-dashboard`, can also be object with following shape:
     * ```
     * {url: '/sample-dashboard', label: 'sampleDashboard'}
     * ```
     * where label is additional parameter passed to ng-route
     *
     * @param {Array} queries list of query objects
     * @param {Object} options Dashboard options
     * Available fields:
     * * **templateUrl** {String} url to template which will replace default one
     * * **caption** {String} Dashboard caption (will be translated)
     *
     */
    this.dashboard = function (url, queries, options) {
        var _options = {
            templateUrl: '/src/dashboard/dashboard.tpl.html'
        };

        options = angular.merge(_options, options);

        _apiCheck([_apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]), _apiCheck.arrayOf(_apiCheck.shape({
            queryId: _apiCheck.string,
            label: _apiCheck.string,
            controller: _apiCheck.string,
            contentTemplateUrl: _apiCheck.string.optional,
            documentModelId: _apiCheck.string.optional,
            columns: _apiCheck.columnOptions,
            showCreateButton: _apiCheck.bool.optional,
            customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({ 'label': _apiCheck.string, 'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string]) })).optional
        }), _apiCheck.shape({ templateUrl: _apiCheck.string, caption: _apiCheck.string.optional }))], [url, queries, options]);

        options.queries = queries;

        var dashboardRoutingOptions = {};

        if (_.isObject(url)) {
            dashboardRoutingOptions = url;
            url = url.url;
        }
        dashboardRoutingOptions.templateUrl = options.templateUrl;
        dashboardRoutingOptions.controller = 'engineDashboardCtrl';
        dashboardRoutingOptions.options = options;

        $routeProvider.when(url, dashboardRoutingOptions);

        dashboards.push({ 'url': url, 'queries': queries, 'options': options });
    };

    function _checkDocumentOptions(options) {
        if (options.document != null) {
            if (options.document.queries != null) _.each(options.document.queries, function (metric) {
                _apiCheck.throw([_apiCheck.shape({ 'columns': _apiCheck.columnOptions, 'singleDocument': _apiCheck.bool.optional })], [metric]);
            });
            if (options.document.queries == null) options.document.queries = {};
        }
    }

    /**
     * @ngdoc method
     * @name document
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Register document in angular-engine, angular URLs will be generated, and document will become available for
     * inclusion in other documents via ```queried_list``` metric
     *
     * **NOTE** The only difference between this method and $engineProvider.subdocument(...) is the fact, that ngRoutes are
     * generated for each registered document.
     *
     *
     * <pre>
     *   var app = angular.module('engine.config.example', ['engine']);
     *             //angular-engine is entirely configured
     *             //by $engineProvider, which means
     *             //that it needs to be run in the configuration phase;
     *             app.config(function($engineProvider) {
     *                //To add document use .document
     *                $engineProvider.document(
     *                    //documentModelName, necessary to link frontend
     *                    //document definitions to backend ones
     *                    'openCall',
     *                    //list url
     *                    '/opencall',
     *                    //document url, must contain :id tag
     *                    '/opencall/:id',
     *                    //list of queries displayed after navigating to list url
     *                    ['MyOpenCalls'],
     *                    //options
     *                    {
     *                        //json fulfilling requirements of
     *                        //the agreemount.engine
     *                        //for document creation / metrics querying
     *                        documentJSON: {
     *                            "states": {
     *                                "documentType": "openCall"
     *                            },
     *                            "metrics": {}
     *                        },
     *                        //name of the resource, will be shown
     *                        //in some labels by default
     *                        //eg. CREATE <name> button, etc.
     *                        name: 'OPENCALL',
     *                        //specific options for list view
     *                        list: {
     *                            //columns visible in table view
     *                            //for this document
     *                            //if ommited all document metrics
     *                            //will be shown (which in most cases
     *                            //will clutter view to great extent)
     *                            columns: [
     *                                {name: 'id', type: 'link', style: 'id'},
     *                                {name: 'name'},
     *                                {name: 'author'},
     *                                {name: 'beamlineChoice'},
     *                                {name: 'states.documentState'},
     *                            ],
     *                            //Caption shown in list view, will be translated
     *                            caption: 'OPENCALL LIST',
     *                            //Create button label, will be translated
     *                            createButtonLabel: 'createOpenCall'
     *                        },
     *                        //specific options for document view
     *                        document: {
     *                            //define form steps for this document
     *                            steps: [
     *                                {name: 'GENEAL',
     *                                 categories: ['beamlineCategory',
     *                                              'openCallForm']}
     *                            ]
     *                        },
     *                        summary: false
     *                });
     *
     *            });
     * </pre>
     *
     * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
     *
     * @param {string|Object} listUrl url to list, which will be added to ngRoute
     * example: ```/simple-document```, can also be object with following shape:
     * ```
     * {url: '/simple-document', label: 'simpleDocument'}
     * ```
     * where label is additional parameter passed to ng-route
     *
     * @param {string|Object} documentUrl url to document, which will be added to ngRoute, has to contain ```:id``` part
     * example: ```/simple-document/:id```
     * ```
     * {url: '/simple-document/:id', label: 'simpleDocumentDetails'}
     * ```
     * where label is additional parameter passed to ng-route
     *
     * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
     * if argument is a string it will be treated as a group **query category** and list of queries will be generated from its children
     *
     * @param {object} options Document options object containing all (if not stated otherwise) below attributes:
     *
     * **documentJSON**: {Object}, json object, which will be send in requests to agreemount.engine when asking for
     * metrics, actions, etc. Especially when document does not exist (before saving), make sure that this
     * Object satisfies all backend constraints
     *
     * **name**: {String}, name of the document type, will be shown on different views, will be translated
     *
     * **list** {Object}, specific options for list view, must contain below attributes (if not stated otherwise)
     *
     *    * **columns**: {Array}, *Optional*, if not specified all document metrics will be displayed.
     *      Every element in the array should be object containing **'name'** attribute which corresponds to
     *      either document property, or document metric. JS expressions are also possible, so name parameter
     *      can be dynamically calculated eg.:
     *
     *      * {name: '$ext.author.name + "<" + $ext.author.email + ">"'} // will generate output like this: Username <user@user.com>
     *
     *      Additionally `name` parameter can have one of the following
     *      values, which coresspond to special behavior:
     *      * `@index` every row's value will be substituted for this row's index (counted from 1)
     *
     *      additional properties which can be provided:
     *
     *      * **caption** {String} if set will be displayed in the column header row, will be translated
     *
     *      * **type** {String, one of: ['link', 'text', 'date', 'array']} specifies what type of data is stored in this
     *      document field, will be formatted accordingly. 'link' field will be formatted as text, but will be wrapped
     *      in `<a>` tag allowing navigation to the selected document.
     *
     *      * **iterator** {String|Function} only if type of column was specified as `array` it can be either a function
     *      or a js expression in string. It will be called on every element of the array, returned value will be
     *      displayed instead of the original value from the array (this method does not change document's data, it
     *      only affects presentation.
     *
     *      Examples:
     *        *
     *        <pre>
     *        {name: '$ext.team.memberships', type: 'array', iterator: function (member) {
     *                       return member.name + ' <' + memeber.email + '>';
     *                   }
     *        </pre>
     *        *
     *        <pre>
     *        {name: '$ext.team.memberships', type: 'array', iterator: "name + ' <' + email +'>'"}
     *        </pre>
     *
     *      * **processor** {String|Function} It can be either a function or a js expression in string.
     *      It will be called for every entry in this column returned value will be
     *      displayed instead of the original value (this method does not change document's data, it
     *      only affects presentation.
     *
     *      Examples:
     *        *
     *        <pre>
     *        {name: '$ext.author', iterator: function (author) {
     *                       return author.name + ' <' + author.email + '>';
     *                   }
     *        </pre>
     *        *
     *        <pre>
     *        {name: '$ext.author', processor: "name + ' <' + email +'>'"}
     *        </pre>
     *
     *      * **style** {String} css classes which will be appended to the fields (to `<td>` element. one of the
     *      prepared styles is `id` which formats field in monospace font family.
     *
     *    * **customButtons** {Array|Object} custom button or array of custom buttons appended at the bottom of
     *    the view. Object must have following fields:
     *      * **label** {String} button's label
     *      * **callback** {String|Function} function which will be called after button is clicked, documentOptions are passed
     *      as an argument to callback. If argument is a {String} it will be treated as angular service and injected.
     *      be sure to define this service to return function.
     *
     *      Example:
     *
     *      .factory('uploadProposalCalled', function ($log) {
     *            return function uploadProposalCalled(documentOptions) {
     *                $log.debug('uploadProposalCalled', documentOptions);
     *            };
     *      })
     *
     *    * **noDocumentsMessage** {String} *Optional* message shown to user if no documents were retrieved
     *      defaults to "There are no documents to display", will be translated
     *
     *    * **noParentDocumentMessage** {String} *Optional* message shown to user when list has parent document
     *    (is embedded as metric) but parent document has not been saved to database yet. Defaults to
     *    "Parent document does not exist, save this document first", will be translated
     *
     *    * **caption**: {String}, *Optional* Caption displayed on top of the list view, will be translated
     *
     * **document** {Object}, specific options for document view must contain below attributes (if not stated otherwise)
     *
     *    * **steps** {Array}, Steps on the document form. At least one step must be specified. Every element
     *    of the array must be {Object} containing following fields:
     *
     *      * **name** {String} Displayed field caption, will be translated
     *      * **categories** {Array|String}, agreemount.engine metric-categories which will be displayed in this step.
     *      If this field is a {String} it will be interpreted as metric-category containing children, in which case
     *      those children will be actual categories diplayied in this step, if this field is an {Array} supplied
     *      metric-categories will be used directly.
     *      * **condition** {Function|String}, condition which must be passed for the given step to be shown,
     *      condition can either be a function (which will receive one argument - document) or a string which
     *      will be evaluated (all document's fields will be accessable as locals)
     *
     *      Example string condition: `states.documentState == 'draft' && id != null`
     *      Example Function condition:
     *      ```
     *      function cond(document) {
     *          return document.states.documentType == 'draft' && document.id != null;
     *      }
     *      ```
     *      * **summary** {Object} If specified on top of specified step document summary will be shown
     *      entries in the summary can be specified via `entries` key (this works the same as global **details**
     *      so you can look there for more details.
     *      **NOTICE** the only difference between **step's summary** and **details** is that step's summary
     *      does not have save button, so it ignores **saveCaption** value.
     *
     *    * **showValidationButton** {Boolean}, *Optional*, default `true` if true shows 'Validate' button at
     *    the end of document form
     *
     *    * **summary** {Boolean}, *Optional*, default `true` if true adds additional step to document form, which
     *    will contain non editable document summary. **(NOT IMPLEMENTED YET)**
     *
     *    * **titleSrc** {String}, *Optional*, default `''`. dotted notation referencing element of the document which
     *    will be used as title in existing document's forms. (eg. `'metrics.proposalName'`)
     *
     *    * **details** {Object}, *Optional*, defines additional information displayed in details box, available fields
     *    are:
     *      * **caption** {String}, Displayed caption, if not specified will default to `options.name`
     *      * **saveCaption** {String}, Caption of the save button, default: 'Save'
     *      * **entries** {Array}, array of objects defining additional information displayed in details box, each
     *      element of the array should conform to the following format:
     *        * **name** {String}, id of the element displayed (eg. `states.documentType`) dotted notation is supported
     *        * **caption** {String}, caption for the given entry
     *        * **condition** {String}, condition which has to be passed in order for entry to appear
     *
     *      Example:
     *      `[{name: 'states.documentType', caption: 'Type', condition: 'states.documentType != "draft"'}]`
     *
     *    * **queries** {Object}, *Optional*, if this document contains `QueriedMetricList`
     *    which should have different columns then the ones defined under `document` you can define them here.
     *    **queries** is a dictionary which maps `metricId` -> properties.
     *    These properties is an `Object` which can have following fields:
     *      * **singleDocument** {Boolean} *Optional*, default false. if set to true documents in the list will
     *      be displayed vertically (one property per colum, one table per document) instead of single table
     *      with one document per row.
     *      * **columns**: {Array}, The same as `list.columns` described earlier in `.document` description
     *
     *      Example:
     *      <pre>
     *      queries: queries: {
     *          proposalForProposalResubmition: { //this is metricId
     *              columns: [
     *                  {name: '@index', type: 'link', caption: 'ID'},
     *                  {name: 'id', type: 'link', caption: 'ID'},
     *                  {name: 'states.documentType', caption: 'Type'}
     *              ]
     *          }
     *      }
     *      </pre>
     *    **WARNING** Queries may be defined in both in the definition of the document which appears *inside*
     *    Queried metric list as well as in the document which *contains* Queried Metric List, definition in
     *    document which contains queried metric list overrides one defined in the document being contained.
     *
     * For example object see this method's description.
     *
     *
     */
    this.document = function (documentModelType, listUrl, documentUrl, query, options) {
        options = angular.merge(angular.copy(_defaultDocumentOptions), options);

        _apiCheck.throw([_apiCheck.string, _apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]), _apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]), _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

        assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

        prepareDocumentOptions(options);
        _checkDocumentOptions(options);
        options.documentModelType = documentModelType;
        options.listUrl = listUrl.url || listUrl;
        options.list.url = options.listUrl;
        options.documentUrl = documentUrl.url || documentUrl;
        options.document.url = options.documentUrl;
        options.query = query;
        options.subdocument = false;

        var documentRoutingOptions = {};
        if (_.isObject(documentUrl)) documentRoutingOptions = documentUrl;

        documentRoutingOptions.templateUrl = options.document.templateUrl;
        documentRoutingOptions.controller = 'engineDocumentWrapperCtrl';
        documentRoutingOptions.options = options;
        documentRoutingOptions.reloadOnSearch = false;

        var listRoutingOptions = {};
        if (_.isObject(listUrl)) listRoutingOptions = documentUrl;

        listRoutingOptions.templateUrl = options.list.templateUrl;
        listRoutingOptions.controller = 'engineListWrapperCtrl';
        listRoutingOptions.options = options;

        documents.push({ list_route: listUrl, document_route: documentUrl });

        $routeProvider.when(options.listUrl, listRoutingOptions);

        $routeProvider.when(options.documentUrl, documentRoutingOptions);

        documents_d[documentModelType] = options;
    };

    /**
     * @ngdoc
     * @name subdocument
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Register subdocument in angular-engine, subdocument will become available for
     * inclusion in other documents via ```queried_list``` metric
     *
     * **NOTE** The only difference between this method and {@link engine.provider:$engineProvider#methods_document $engineProvider.document(...)}
     * is the fact, that ngRoutes are **not** generated for each registered subdocument.
     *
     * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
     * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
     * if argument is a string it will be treated as a group **metric category** and list of queries will be generated from its children
     * @param {Object} options Document options object conforming to format described in
     * {@link engine.provider:$engineProvider#methods_document $engineProvider.document}
     *
     *
     */
    this.subdocument = function (documentModelType, query, options) {
        options = angular.merge(angular.copy(_defaultDocumentOptions), options);
        _apiCheck.throw([_apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, query, options]);
        assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

        prepareDocumentOptions(options);
        _checkDocumentOptions(options);

        options.query = query;
        options.subdocument = true;

        documents_d[documentModelType] = options;
    };

    this.formly = $engineFormlyProvider;

    var _baseUrl = '';

    /**
     * @ngdoc method
     * @name setBaseUrl
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Sets base url (if engine backend is hosted on another host, or is available not from root of
     * the application but from subdirectory (eg. /engine/...)
     *
     * Default is `''`, which is usually sufficient for standard deployments
     *
     * @param {String} url new url prefix which will be added to all engine backend calls
     */
    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    var _visibleDocumentFields = [{ name: 'id', caption: 'ID', type: 'link', style: 'monospace' }, { name: 'name', caption: 'Name' }];

    /**
     * @ngdoc method
     * @name setDocumentFields
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Sets default visible document fields
     *
     * @param {Array} documentFields array of new document fields, which will be added to document list
     * views (apart from all metrics)
     */
    this.setDocumentFields = function (documentFields) {
        _visibleDocumentFields = documentFields;
    };

    this.addDocumentFields = function (document_fields) {
        if (document_fields instanceof Array) angular.forEach(document_fields, function (field) {
            _visibleDocumentFields.push(field);
        });else _visibleDocumentFields.push(document_fields);
    };

    this._debug = false;

    this.enableDebug = function () {
        self._debug = true;
    };
    this.disableDebug = function () {
        self._debug = false;
    };

    /**
     * @ngdoc service
     * @name engine.service:$engine
     *
     * @description
     * Allows some lower level interaction with angular-engine.
     * In normal setup calling eny of it's methods should not be required.
     * (If you want to just use angular-engine see {@link engine.provider:$engineProvider $engineProvider}
     *
     */
    this.$get = function ($engineFormly, engineDocument, $rootScope, $log, engineQuery) {
        var _engineProvider = self;

        return new function () {
            var self = this;
            this.apiCheck = _apiCheck;
            this.formly = $engineFormly;
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;

            /**
             * By default only metrics are visible in document list view, in order to display document fields
             * (such as ID, creation Date, etc) they must be specified here
             * @type {[{string}]}
             */
            this.visibleDocumentFields = _visibleDocumentFields;

            /**
             * @ngdoc method
             * @name getOptions
             * @methodOf engine.service:$engine
             *
             * @description
             * Returns document options defined via ```document()``` method
             *
             * @param {string} documentModelId Document model ID (same as the one registered with ```.document``` and ```.subdocument``` methods)
             * @returns {object} options associated with specified dicumentModelId
             */
            this.getOptions = function (documentModelId) {
                _apiCheck.string(documentModelId);

                return documents_d[documentModelId];
            };

            /**
             * @ngdoc method
             * @name enableDebug
             * @methodOf engine.service:$engine
             *
             * @description
             * Enables debug output for application.
             *
             */
            this.enableDebug = function () {
                _engineProvider._debug = true;
                $rootScope.$on('engine.common.error', function (event, errorEvent) {
                    if (_engineProvider._debug) $log.error(errorEvent);
                });
            };

            /**
             * @ngdoc method
             * @name disableDebug
             * @methodOf engine.service:$engine
             *
             * @description
             * Disables debug output for application.
             *
             */
            this.disableDebug = function () {
                _engineProvider._debug = false;
            };

            /**
             * @ngdoc method
             * @name pathToDocument
             * @methodOf engine.service:$engine
             *
             * @description
             * Returns path to the document with given ```documentId``` and type included in
             * ```options.document.documentUrl```
             *
             * @param {Object} options Options of the document (options with which document has been registrated using
             * ```$engineProvider.document(...)```
             * @param {Object} documentId id of the document to which path should be generated
             * @returns {String} angular URL to given document form
             */
            this.pathToDocument = function (options, documentId) {
                _apiCheck([_apiCheck.documentOptions, _apiCheck.string.optional], arguments);

                if (!document) {
                    return options.document.documentUrl.replace(':id', 'new');
                }
                return options.document.url.replace(':id', documentId);
            };

            /**
             * @ngdoc method
             * @name registerResourceProcessor
             * @methodOf engine.service:$engine
             *
             * @description
             * **NOT IMPLEMENTED YET**
             */
            this.registerResourceProcessor = function () {};

            /**
             * @ngdoc method
             * @name registerDocumentProcessor
             * @methodOf engine.service:$engine
             *
             * @description
             * Registers processor function for documents, it's called every time document is loaded from backend:
             * (form, query (not yet implemented)). Additional fields added to document can be accessed via
             * components, and referenced by list display configuration {@link engine.provider:$engineProvider#methods_document}
             *
             * @param {Function} processor function transforming document data, and returning promise or
             * processed data
             *
             * Function stub (static transformation):
             * <pre>
             * function processor(data) {
             * return data;
             * }
             * </pre>
             *
             * Function stub (async transformation):
             * <pre>
             * function processor(document) {
             *
             * return $http.get('/restful/service').then(
             *     function(response){
             *         document.$ext = 'some data';
             *         return document;
             *     });
             * }
             * </pre>
             *
             * **NOTE** if document / resource processor intends to add extra data
             * to resource convention is to add it to `$ext` field (this field will
             * be stripped before sending it in the http request)
             *
             */
            this.registerDocumentProcessor = function (processor) {
                engineDocument.response_processors.push(processor);
                engineQuery.response_processors.push(processor);
            };
        }();
    };
});
'use strict';

angular.module('engine').factory('engineResolve', function () {
    function index(obj, i) {
        if (obj == null) return undefined;
        return obj[i];
    }

    return function (baseObject, str) {
        if (!str) return '';
        return str.split('.').reduce(index, baseObject);
    };
}).factory('$engResource', function ($engineConfig) {

    var engResource = function engResource() {
        var defaults = {
            browse: { method: 'GET', transformResponse: transformResponse },
            query: { method: 'GET', transformResponse: transformResponse, isArray: true },
            get: { method: 'GET', transformResponse: transformResponse },
            create: { method: 'POST', transformRequest: transformRequest },
            update: { method: 'PATCH', transformRequest: transformRequest },
            destroy: { method: 'DELETE' }
        };

        angular.extend(defaults, options.methods);

        var resource = $resource($engineConfig.baseUrl + options.url, options.params, defaults);

        return resource;
    };

    return engResource;
}).service('engineQuery', function ($engineConfig, $engineApiCheck, $http, EngineInterceptor, $q) {

    var request_processors = [];
    var response_processors = [];

    return {
        request_processors: request_processors,
        response_processors: response_processors,
        get: function get(query, parentDocument, callback, errorCallback) {
            $engineApiCheck.throw([apiCheck.string, apiCheck.object.optional, apiCheck.func.optional, apiCheck.func.optional], arguments);

            var parentDocumentId = parentDocument != null && parentDocument.id != null ? parentDocument.id : '';

            var res = [];
            res.$resolved = 0;

            var q = $http.post($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=' + query + '&attachAvailableActions=true&otherDocumentId=' + parentDocumentId + '&documentId=' + parentDocumentId).then(function (response) {
                return response.data;
            }).then(EngineInterceptor.response).then(function (data) {
                res = angular.merge(res, data);
                return res;
            });

            _.forEach(response_processors, function (processor) {
                var processingQueue = [];
                q = q.then(function (documents) {
                    _.forEach(documents, function (document, index) {
                        if (!_.isNaN(parseInt(index))) processingQueue.push($q.when(processor(document.document)));
                    });

                    return $q.all(processingQueue).then(function () {
                        return documents;
                    });
                });
            });
            q = q.then(function (data) {
                res.$resolved = 1;
                return res;
            }, function (response) {
                res.$resolved = 2;
                res.$error = true;
                res.$errorMessage = response.data.msg;
            }).then(callback, errorCallback);
            res.$promise = q;
            return res;
        }
    };
}).service('engineDashboard', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {

    var _queryCategory = $resource($engineConfig.baseUrl + '/query?queryCategoryId=:queryCategoryId', { queryCategoryId: '@queryCategoryId' }, { get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true } });

    return {
        fromList: function fromList(queryIds) {
            $engineApiCheck([apiCheck.arrayOf(apiCheck.string)], arguments);
        },
        fromCategory: function fromCategory(queryCategoryId, callback, errorCallback) {
            $engineApiCheck([apiCheck.string], arguments);

            return _queryCategory.get({ 'queryCategoryId': queryCategoryId }, callback, errorCallback);
        }
    };
}).service('engineMetric', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var metricSorter = function metricSorter(data, headersGetter, status) {
        var data = EngineInterceptor.response(data, headersGetter, status);
        data = _.sortBy(data, 'position');

        return data;
    };

    var _query = $resource($engineConfig.baseUrl + '/metrics', {}, {
        post: { method: 'POST', transformResponse: metricSorter, isArray: true }
    });

    return function (documentJSON, callback, errorCallback) {
        $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _query.post(documentJSON, callback, errorCallback);
    };
}).service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $log) {
    var categorySorter = function categorySorter(data, headersGetter, status) {
        var data = EngineInterceptor.response(data, headersGetter, status);
        // data = _.sortBy(data, 'position');

        return data;
    };

    var _query = $resource($engineConfig.baseUrl + '/metric-categories', {}, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true }
    });

    var _metricCategories = {};
    var _names = {};

    function collectMetrics(metrics) {
        function writeMetric(_metric) {
            _names[_metric.id] = _metric; //{label: _metric.label, position: _metric.position, visualClass: _metric.visualClass};
        }
        function collectChildren(metric) {
            angular.forEach(metric.children, function (_metric) {
                writeMetric(_metric);
                collectChildren(_metric);
            });
        }

        angular.forEach(metrics, function (_metric) {
            writeMetric(_metric);
            collectChildren(_metric);
        });
    }

    var _promise = _query.get().$promise.then(function (data) {
        angular.forEach(data, function (metricCategory) {
            //top level metric categories are aggregates

            _metricCategories[metricCategory.id] = metricCategory;
        });
        collectMetrics(data);
        console.debug(_metricCategories);
        return {
            $resolved: true,
            metrics: _metricCategories,
            getNames: function getNames(metricCategoryId) {
                if (!(metricCategoryId in _names)) $log.error('You tried to access metricCategory which does not exist, check whether metric references existsing metric category. Wrong key: ' + metricCategoryId);
                return _names[metricCategoryId];
            }
        };
    });

    return _promise;
}).service('engineActionsAvailable', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId', { documentId: '@id' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return {
        forDocument: function forDocument(document, callback, errorCallback) {
            $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

            return _action.post({ documentId: document.id }, document, callback, errorCallback);
        },
        forType: function forType(documentJson, parentDocumentId, callback, errorCallback) {
            return _action.post({ documentId: parentDocumentId }, documentJson, callback, errorCallback);
        }
    };
}).service('engineAction', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId&otherDocumentId=:otherDocumentId', {
        actionId: '@actionId',
        documentId: '@documentId',
        otherDocumentId: '@otherDocumentId'
    }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    return function (actionId, document, callback, errorCallback, parentDocumentId, documentId) {
        $engineApiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _action.post({ actionId: actionId, documentId: documentId || document.id, otherDocumentId: parentDocumentId }, document, callback, errorCallback);
    };
}).service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $http) {
    var _document = $resource('', { documentId: '@documentId' }, {
        getDocument: { url: $engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true',
            method: 'POST', transformResponse: EngineInterceptor.response },
        validate: { url: $engineConfig.baseUrl + '/validate-metric-values' + '?documentId=:documentId',
            method: 'POST', transformResponse: EngineInterceptor.response }
    });

    var request_processors = [];
    var response_processors = [];

    return {
        request_processors: request_processors,
        response_processors: response_processors,
        get: function get(documentId, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.string, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments, errorCallback);

            var res = { $resolved: 0 };

            var q = $http.post($engineConfig.baseUrl + '/document/getwithextradata?documentId=' + documentId + '&attachAvailableActions=true', null).then(function (response) {
                return response.data;
            }).then(EngineInterceptor.response).then(function (data) {
                res = angular.merge(res, data);
                return res.document;
            });

            //null is passed explicitly to POST data, to ensure engine compatibility
            // var res = _document.getDocument({documentId: documentId}, null);

            _.forEach(response_processors, function (processor) {
                q = q.then(processor);
            });
            q = q.then(function (data) {
                res.document = data;
                res.$resolved = 1;
                return res;
            }).then(callback, errorCallback);
            res.$promise = q;
            return res;
        },
        /**
         * Validates given document, sending it to agreemount.engine backend
         *
         * @param document
         * @param callback
         * @param errorCallback
         * @returns {*|{url, method, transformResponse}}
         */
        validate: function validate(document, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

            return _document.validate({ 'documentId': document.id }, document, callback, errorCallback);
        }
    };
}).service('EngineInterceptor', function () {

    function processData(data) {
        if (data == null) return;
        if (data.document !== undefined) data = data.document;
        if (data.metrics !== null && data.metrics !== undefined) {
            for (var metric in data.metrics) {
                data[metric] = data.metrics[metric];
            }
        }
    }

    return {
        response: function response(data, headersGetter, status) {
            if (angular.isString(data)) {
                if (data == "") return {};else data = angular.fromJson(data);
            }

            data = data.data;
            if (data instanceof Array) {
                angular.forEach(data, processData);
            } else processData(data);

            return data;
        },
        request: function request(data, headersGetter) {
            var site = data.site;
            console.log('parsing request');
            if (site && site.id) {
                data.site = site.id;
                data.siteName = site.value.provider_id;
            }

            return angular.toJson(data);
        }
    };
}).service('MetricToFormly', function () {
    return function (data, headersGetter, status) {};
});
'use strict';

var ENGINE_COMPILATION_DATE = '2017-05-23T12:50:34.796Z';
var ENGINE_VERSION = '0.6.84';
var ENGINE_BACKEND_VERSION = '1.0.119';

angular.module('engine').value('version', ENGINE_VERSION);
angular.module('engine').value('backendVersion', ENGINE_BACKEND_VERSION);
'use strict';

angular.module('engine.formly').provider('$engineFormly', function () {
    var self = this;

    var _typeTemplateUrls = {
        input: '/src/formly/types/templates/input.tpl.html',
        attachment: '/src/formly/types/templates/attachment.tpl.html',
        attachmentList: '/src/formly/types/templates/attachmentList.tpl.html',
        select: '/src/formly/types/templates/select.tpl.html',
        checkbox: '/src/formly/types/templates/checkbox.tpl.html',
        radio: '/src/formly/types/templates/radio.tpl.html',
        radioGroup: '/src/formly/types/templates/radioGroup.tpl.html',
        textarea: '/src/formly/types/templates/textarea.tpl.html',
        datepicker: '/src/formly/types/templates/datepicker.tpl.html',
        multiCheckbox: '/src/formly/types/templates/multiCheckbox.tpl.html',
        multiSelect: '/src/formly/types/templates/multiSelect.tpl.html',
        multiSelectImage: '/src/formly/types/templates/multiSelectImage.tpl.html',
        multiSelectVertical: '/src/formly/types/templates/multiSelectVertical.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/wrappers/templates/category.tpl.html',
        label: '/src/formly/wrappers/templates/label.tpl.html',
        hasError: '/src/formly/wrappers/templates/has-error.tpl.html',
        step: '/src/formly/wrappers/templates/step.tpl.html',
        unit: '/src/formly/wrappers/templates/unit.tpl.html',
        default: '/src/formly/wrappers/templates/default.tpl.html'
    };

    this.templateUrls = _typeTemplateUrls;
    this.wrapperUrls = _wrapperTemplateUrls;

    this.setTypeTemplateUrl = function (type, url) {
        _typeTemplateUrls[type] = url;
    };

    this.setWrapperTemplateUrl = function (wrapper, url) {
        _wrapperTemplateUrls[wrapper] = url;
    };

    this.$get = function () {
        return new function () {
            this.templateUrls = _typeTemplateUrls;
            this.wrapperUrls = _wrapperTemplateUrls;
        }();
    };
});
'use strict';

angular.module('engine.formly').run(function (formlyConfig, $engineFormly, $engine) {
    var attributes = ['date-disabled', 'custom-class', 'show-weeks', 'starting-day', 'init-date', 'min-mode', 'max-mode', 'format-day', 'format-month', 'format-year', 'format-day-header', 'format-day-title', 'format-month-title', 'year-range', 'shortcut-propagation', 'datepicker-popup', 'show-button-bar', 'current-text', 'clear-text', 'close-text', 'close-on-date-selection', 'datepicker-append-to-body'];

    var bindings = ['datepicker-mode', 'min-date', 'max-date'];

    var ngModelAttrs = {};

    angular.forEach(attributes, function (attr) {
        ngModelAttrs[camelize(attr)] = { attribute: attr };
    });

    angular.forEach(bindings, function (binding) {
        ngModelAttrs[camelize(binding)] = { bound: binding };
    });

    console.log(ngModelAttrs);

    formlyConfig.setType({
        name: 'datepicker',
        templateUrl: $engineFormly.templateUrls['datepicker'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            ngModelAttrs: ngModelAttrs,
            templateOptions: {
                datepickerOptions: {
                    format: 'dd-MM-yyyy',
                    initDate: new Date(),
                    allowInvalid: true
                },
                css: ''
            }
        },
        controller: function controller($scope) {
            $scope.openedDatePopUp = false;
            $scope.today = function () {
                $scope.model[$scope.options.key] = new Date();
            };
            $scope.openPopUp = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.openedDatePopUp = true;
            };
            //
            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
        }
    });

    function camelize(string) {
        string = string.replace(/[\-_\s]+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
        // Ensure 1st char is always lowercase
        return string.replace(/^([A-Z])/, function (match, chr) {
            return chr ? chr.toLowerCase() : '';
        });
    }
});
'use strict';

angular.module('engine.formly').run(function (formlyConfig, $engineFormly, $engine) {
    var _apiCheck = $engine.apiCheck;

    formlyConfig.setType({
        name: 'input',
        templateUrl: $engineFormly.templateUrls['input'],
        wrapper: ['engineLabel', 'engineHasError']
    });

    formlyConfig.setType({
        name: 'attachment',
        templateUrl: $engineFormly.templateUrls['attachment'],
        wrapper: ['engineLabel', 'engineHasError']
    });

    formlyConfig.setType({
        name: 'attachmentList',
        templateUrl: $engineFormly.templateUrls['attachmentList'],
        wrapper: ['engineLabel', 'engineHasError']
    });

    formlyConfig.setType({
        name: 'checkbox',
        templateUrl: $engineFormly.templateUrls['checkbox'],
        wrapper: ['engineHasError']
    });

    formlyConfig.setType({
        name: 'radio',
        templateUrl: $engineFormly.templateUrls['radio'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false
        }
    });

    formlyConfig.setType({
        name: 'radioGroup',
        templateUrl: $engineFormly.templateUrls['radioGroup'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false
        }
    });
    formlyConfig.setType({
        name: 'multiSelect',
        templateUrl: $engineFormly.templateUrls['multiSelect'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false
        }
    });
    formlyConfig.setType({
        name: 'multiSelectImage',
        templateUrl: $engineFormly.templateUrls['multiSelectImage'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false
        }
    });
    formlyConfig.setType({
        name: 'multiSelectVertical',
        templateUrl: $engineFormly.templateUrls['multiSelectVertical'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false
        }
    });

    formlyConfig.setType({
        name: 'select',
        templateUrl: $engineFormly.templateUrls['select'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: function defaultOptions(options) {
            var ngOptions = options.templateOptions.ngOptions || "option[to.valueProp || 'value'] as option[to.labelProp || 'name'] group by option[to.groupProp || 'group'] for option in to.options";
            var _options = {
                ngModelAttrs: {}
            };

            _options.ngModelAttrs[ngOptions] = { value: options.templateOptions.optionsAttr || 'ng-options' };

            return _options;
        }
    });

    formlyConfig.setType({
        name: 'textarea',
        templateUrl: $engineFormly.templateUrls['textarea'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: function defaultOptions(options) {

            var _options = {
                ngModelAttrs: {
                    rows: { attribute: 'rows' },
                    cols: { attribute: 'cols' }
                }
            };

            return _options;
        }
        // apiCheck: check => ({
        // templateOptions: {
        //     rows: check.number.optional,
        //     cols: check.number.optional
        // }
        // })
    });
    // formlyConfig.setType({
    //         name: 'number',
    //         templateUrl: $engineFormly.templateUrls['number'],
    //         wrapper: ['engineLabel', 'engineHasError'],
    //         defaultOptions: function(options) {
    //             return options;
    //         }
    // });
});
'use strict';

angular.module('engine.formly').config(function ($engineFormlyProvider) {
    $engineFormlyProvider.setWrapperTemplateUrl('row', '/src/formly/wrappers/templates/row.tpl.html');
}).run(function (formlyConfig, $engineFormly) {
    formlyConfig.setWrapper({
        name: 'row',
        templateUrl: $engineFormly.wrapperUrls['row']
    });
});
'use strict';

angular.module('engine.formly').run(function (formlyConfig, $engineFormly) {

    formlyConfig.setWrapper({
        name: 'engineLabel',
        templateUrl: $engineFormly.wrapperUrls['label'],
        // apiCheck:
        overwriteOk: true
    });
    formlyConfig.setWrapper({
        name: 'engineHasError',
        templateUrl: $engineFormly.wrapperUrls['hasError'],
        overwriteOk: true
    });
    formlyConfig.setWrapper({
        name: 'category',
        templateUrl: $engineFormly.wrapperUrls['category']
    });
    formlyConfig.setWrapper({
        name: 'step',
        templateUrl: $engineFormly.wrapperUrls['step']
    });
    formlyConfig.setWrapper({
        name: 'unit',
        templateUrl: $engineFormly.wrapperUrls['unit']
    });
    formlyConfig.setWrapper({
        name: 'default',
        templateUrl: $engineFormly.wrapperUrls['default']
    });
});
'use strict';

angular.module('engine.list').component('engineDocumentList', {
    template: '<ng-include src="$ctrl.contentTemplateUrl || \'/src/list/list.component.tpl.html\'"></ng-include>',
    controller: 'engineListCtrl',
    bindings: {
        options: '=',
        query: '=',
        formWidget: '@',
        parentDocument: '=',
        showCreateButton: '=',
        listCaption: '=',
        columns: '=',
        customButtons: '=',
        onSelectBehavior: '@',
        noDocumentsMessage: '@',
        noParentDocumentMessage: '@',
        metricId: '@',
        singleDocument: '=',
        controller: '@',
        contentTemplateUrl: '='
    }
}).controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction, engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal, $log, $injector, $rootScope, $parse, $controller) {
    var self = this;

    self.engineResolve = engineResolve;
    //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
    this.formWidget = this.formWidget === 'true';

    $scope.$watch('$ctrl.showCreateButton', function (oldVal, newVal) {
        if (self.showCreateButton == undefined) self._showCreateButton = true;else self._showCreateButton = newVal;
    });

    if (self.singleDocument) self.template = '/src/list/list.single.tpl.html';else self.template = '/src/list/list.tpl.html';

    $scope.$parse = $parse;
    $scope.options = this.options;
    $scope.columns = this.columns || (this.metricId && $scope.options.document.queries != null && $scope.options.document.queries[this.metricId] != null ? $scope.options.document.queries[this.metricId].columns : $scope.options.list.columns);

    $scope.query = self.query || $scope.options.query;
    $scope.customButtons = self.customButtons || self.options.customButtons;

    /**
     * If inject all custom buttons callback which were defined as strings
     */
    _.forEach($scope.customButtons, function (customButton) {
        if (_.isString(customButton.callback)) {
            var callbackName = customButton.callback;
            customButton.callback = function (documentOptions) {
                $injector.invoke([callbackName, function (callback) {
                    callback(documentOptions);
                }]);
            };
        }
    });

    var _parentDocumentId = this.parentDocument ? this.parentDocument.id : undefined;

    this.arrayCellIterate = function (iterator, array) {
        if (iterator == null) return array.join(', ');

        return _.map(array, function (element) {
            if (_.isFunction(iterator)) return iterator(element);
            return $parse(iterator)(element);
        }).join(', ');
    };

    this.process = function (processor, element) {
        if (processor != null && _.isFunction(processor)) return processor(element);
        return element;
    };

    this.loadDocuments = function () {
        if (this.parentDocument == null || this.parentDocument != null && this.parentDocument.id != null) {
            $scope.documents = engineQuery.get($scope.query, this.parentDocument);
            $scope.documents.$promise.then(function (documents) {
                if (self.metricId != null) {
                    if (self.parentDocument.$ext == null) self.parentDocument.$ext = {};
                    if (self.parentDocument.$ext.queries == null) self.parentDocument.$ext.queries = {};
                    self.parentDocument.$ext.queries[self.metricId] = documents;
                }
            });
        } else {
            this.noParentDocument = true;
            $scope.documents = { $resolved: 1 };
        }
    };
    $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON, _parentDocumentId);

    $scope.engineAction = function (action, document) {

        // if(action.type == 'LINK'){
        //     return engineAction(action.id, self.parentDocument, undefined, undefined, document.id).$promise.then(function (data) {
        //         $rootScope.$broadcast('engine.list.reload', $scope.query);
        //     }, undefined);
        // } else {
        return engineAction(action.id, document, null, null, _parentDocumentId).$promise.then(function (data) {
            // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
            $rootScope.$broadcast('engine.list.reload', $scope.query);
        });
        // }
    };

    $scope.renderCell = function (document, column) {
        return document[column.name];
    };
    $scope.getCellTemplate = function (document, column, force_type) {
        if (!force_type && column.type == 'link') {
            return '/src/list/cell/link.tpl.html';
        }

        if (column.type) {
            if (column.type == 'date') return '/src/list/cell/date.tpl.html';else if (column.type == 'array') return '/src/list/cell/array.tpl.html';
        }
        if (column.name == '@index') return '/src/list/cell/index.tpl.html';
        return '/src/list/cell/text.tpl.html';
    };
    $scope.onDocumentSelect = function (documentEntry) {
        if (_parentDocumentId) {
            if (self.onSelectBehavior == 'LINK') {
                var linkAction = engineActionUtils.getLinkAction(documentEntry.actions);

                if (linkAction != null) $scope.engineAction(linkAction, documentEntry.document);else $log.warn(self.query, ' QueriedList onSelectBehavior set as Link, but document does not have link action available');
            } else {
                if ($scope.options.subdocument == true) DocumentModal(documentEntry.document.id, $scope.options, _parentDocumentId, function () {
                    // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                    $rootScope.$broadcast('engine.list.reload', $scope.query);
                });else {
                    $location.$$search.step = 0;
                    $location.$$path = $scope.genDocumentLink(documentEntry.document.id);
                    $location.$$compose();
                }
            }
        } else {
            $location.path($scope.genDocumentLink(documentEntry.document.id));
        }
    };

    $scope.genDocumentLink = function (documentId) {
        return $scope.options.documentUrl.replace(':id', documentId);
    };

    $scope.onCreateDocument = function () {
        if ($scope.options.subdocument == true) DocumentModal(undefined, $scope.options, self.parentDocument, function () {
            // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
            $rootScope.$broadcast('engine.list.reload', $scope.query);
        });else $location.path($scope.genDocumentLink('new'));
    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };

    $scope.$on('engine.list.reload', function (event, query) {
        // if($scope == event.currentScope)
        //     return;
        $log.debug('engine.list.reload received, reloading documents', 'queryId', $scope.query);
        self.loadDocuments();
    });

    function init() {
        if ($scope.columns === null || $scope.columns === undefined) {
            $scope.columns = [];

            $engine.visibleDocumentFields.forEach(function (field) {
                if (field.caption === undefined && field.id === undefined) $scope.columns.push({ name: field });else $scope.columns.push(field);
            });

            engineMetric($scope.options.documentJSON, function (data) {
                angular.forEach(data, function (metric) {
                    $scope.columns.push({ name: metric.id, caption: metric.label });
                });
            });
        }
        self.loadDocuments();
    }

    init();

    if (this.controller) $controller(this.controller, { $scope: $scope });
});
'use strict';

angular.module('engine.list').controller('engineListWrapperCtrl', function ($scope, $route, engineDashboard) {
    $scope.options = $route.current.$$route.options;
    var query = $route.current.$$route.options.query;

    if (angular.isArray(query)) {
        $scope.queries = [];
        angular.forEach(query, function (q) {
            $scope.queries.push({ id: q });
        });
    } else {
        //dashboard
        engineDashboard.fromCategory(query, function (data) {
            $scope.queries = [];
            angular.forEach(data, function (query) {
                $scope.queries.push(query);
            });
        });
    }
});
;"use strict";

angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/document-actions/document-actions.tpl.html", "<div class=\"eng-loading-box\" ng-show=\"$ctrl.loading\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n</div>\n<button type=\"submit\" class=\"btn btn-primary dark-blue-btn\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"!$ctrl.loading && !$ctrl.steps.isLast($ctrl.step)\" translate>Next Step:</button>\n<button type=\"submit\" class=\"btn btn-primary\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"!$ctrl.loading && !$ctrl.steps.isLast($ctrl.step)\">{{$ctrl.step+2}}. {{$ctrl.steps.getStep($ctrl.step+1).name}}</button>\n\n<button type=\"submit\" ng-if=\"!$ctrl.loading && $ctrl.showValidationButton && $ctrl.steps.isLast($ctrl.step)\"\n        class=\"btn btn-default\" ng-click=\"$ctrl.validate()\" translate>Validate</button>\n\n<button type=\"submit\" ng-repeat=\"action in $ctrl.actionList.actions\" ng-if=\"!$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"action.call()\" translate>{{action.label}}</button>\n\n<button type=\"submit\" ng-repeat=\"button in $ctrl.customButtons\" ng-if=\"!$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"button.action()\" translate>{{button.label}}</button>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/dashboard/dashboard.tpl.html", "<div class=\"row\">\n    <div class=\"col-md-12\">\n        <h1 translate>{{options.caption}}</h1>\n    </div>\n</div>\n<div class=\"text-box\" ng-repeat=\"query in queries\">\n    <div class=\"text-content\">\n        <engine-document-list show-create-button=\"query.showCreateButton\" columns=\"query.columns\"\n                              custom-buttons=\"query.customButtons\"\n                              content-template-url=\"query.contentTemplateUrl\"\n                              controller=\"{{query.controller || ''}}\"\n                              no-documents-message=\"{{query.noDocumentsMessage || $engine.getOptions(query.documentModelId).list.noDocumentsMessage || ''}}\"\n                              no-parent-document-message=\"{{query.noParentDocumentMessage || $engine.getOptions(query.documentModelId).list.noParentDocumentMessage || ''}}\"\n                              query=\"query.queryId\" options=\"$engine.getOptions(query.documentModelId)\"\n                              list-caption=\"query.label\"></engine-document-list>\n\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/details/details.tpl.html", "<div class=\"text-box\">\n    <div class=\"text-content\" ng-clock>\n        <h3 style=\"margin-top: 0px\">{{$ctrl.options.document.details.caption || $ctrl.options.name}}</h3>\n\n        <ul class=\"list-group\">\n            <li ng-repeat=\"entry in $ctrl.options.document.details.entries | conditionFulfiled : $ctrl.ngModel\" class=\"list-group-item\">\n                <span translate>{{entry.caption || entry.name}}</span>\n                <span translate>{{$ctrl.$parse(entry.name)($ctrl.ngModel) || 'Not specified yet'}}</span>\n            </li>\n        </ul>\n        <button style=\"width: 100%\" type=\"submit\" class=\"btn btn-default\" ng-if=\"$ctrl.actions.getSaveAction() != null\"\n                ng-click=\"$ctrl.saveDocument()\">\n            <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\" ng-show=\"$ctrl.savePromise.$$state.status === 0\"></i>\n            <span translate>{{$ctrl.options.document.details.saveCaption || 'Save' }}</span>\n        </button>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 ng-if=\"!documentId\" class=\"modal-title\" id=\"myModalLabel\" translate>{{ documentOptions.document.caption || 'CREATE ' + documentOptions.name }}</h4>\n    <h4 ng-if=\"documentId\" ><span translate>{{documentOptions.name}}</span> {{engineResolve(document, documentOptions.document.titleSrc)}}</h4>\n\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document parent-document=\"parentDocument\" step-list=\"stepList\" document=\"document\" document-id=\"{{::documentId}}\" step=\"step\" options=\"documentOptions\"></engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" custom-buttons=\"customButtons\"\n                             document=\"document\" document-scope=\"$scope\" document-parent=\"parentDocument\"\n                             steps=\"stepList\" step=\"step\" class=\"btn-group float-left\"></engine-document-actions>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div class=\"eng-loading-box\" ng-show=\"$ctrl.$ready.$$state.status === 0\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n</div>\n\n<div ng-show=\"$ctrl.$ready.$$state.status === 1\" ng-cloak>\n    <div ng-repeat=\"message in $ctrl.messages\" class=\"alert alert-{{message.type}} alert-document\" role=\"alert\" translate>{{message.body}}</div>\n    <form ng-submit=\"$ctrl.onSubmit()\" name=\"$ctrl.documentForm.formlyState\" novalidate>\n        <formly-form model=\"$ctrl.document\" fields=\"$ctrl.documentForm.formStructure\" class=\"horizontal\"\n                     options=\"$ctrl.documentForm.formlyOptions\" form=\"$ctrl.documentForm.formlyState\">\n\n            <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" ng-if=\"!$ctrl.options.subdocument\"\n                                     document=\"$ctrl.document\" document-scope=\"$ctrl.documentScope\"\n                                     steps=\"$ctrl.stepList\" step=\"$ctrl.step\" class=\"btn-group\"></engine-document-actions>\n        </formly-form>\n    </form>\n</div>\n\n<div ng-show=\"!$ctrl.$ready.$$state.status === 2\" ng-cloak translate>\n    REJECTED\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <h1>\n                <span ng-if=\"!document.id\" translate>{{ options.document.caption || 'CREATE ' + options.name }}</span>\n                <span ng-if=\"document.id\" ><span translate>{{options.name}}</span> {{engineResolve(document, options.document.titleSrc)}}</span>\n\n                <span class=\"bold\" ng-if=\"stepList.getSteps().length > 0\">: {{stepList.getStep($routeParams.step).name | translate}} {{$routeParams.step + 1}}/{{stepList.getSteps().length}}</span>\n            </h1>\n        </div>\n    </div>\n    <div class=\"row\">\n        <engine-document step-list=\"stepList\" show-validation-button=\"options.document.showValidationButton\"\n                         document-id=\"{{::documentId}}\" document=\"document\" step=\"$routeParams.step\" options=\"options\"\n                         class=\"col-lg-8 col-md-8 col-sm-12 engine-document\" actions=\"actions\"></engine-document>\n        <div class=\"col-lg-4 col-md-4 hidden-sm sidebar-document\">\n            <engine-steps ng-model=\"document\" step=\"$routeParams.step\" step-list=\"stepList\" options=\"options\"></engine-steps>\n            <engine-document-details ng-model=\"document\" options=\"options\" actions=\"actions\"></engine-document-details>\n        </div>\n    </div>\n\n    <div class=\"document-navi-toggle\" ng-click=\"toggleSideMenu()\" ng-class=\"{active: sideMenuVisible}\">\n        <i class=\"fa fa-file-text\" aria-hidden=\"true\"></i>\n    </div>\n    <div class=\"sidebar-document-rwd\" ng-show=\"sideMenuVisible\">\n        <engine-steps ng-model=\"document\" step=\"$routeParams.step\" step-list=\"stepList\" options=\"options\"></engine-steps>\n        <engine-document-details ng-model=\"document\" options=\"options\" actions=\"actions\"></engine-document-details>\n    </div>\n\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.stepList.steps\" ng-class=\"{active: $ctrl.stepList.getCurrentStep() == _step}\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\">\n                    <i class=\"fa\" aria-hidden=\"true\" style=\"display: inline-block\"\n                       ng-class=\"{'fa-check-circle' : _step.getState() == 'valid',\n                                  'fa-circle-o': _step.getState() == 'blank',\n                                  'fa-cog fa-spin': _step.getState() == 'loading',\n                                  'fa-times-circle-o': _step.getState() == 'invalid'}\"></i>\n                </span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/attachment.tpl.html", "<div>\n    <span ng-if=\"error\" class=\"error-text\">{{error}}</span>\n    <!--ng-model=\"model[options.key]\"-->\n    <!--<input type=\"text\" ng-model=\"username\"><br/><br/>-->\n    <!--watching model:-->\n    <table>\n        <tr>\n            <th translate>Filename</th>\n            <th>Size</th>\n            <th class=\"attachment-actions\">Actions</th>\n        </tr>\n        <tr ng-if=\"model[options.key]\">\n            <td><a href=\"{{attachment.getDownloadLink()}}\">{{ attachment.getFilename() }}</a></td>\n            <td>{{ attachment.getSize() | formatFileSize }}</td>\n            <td class=\"attachment-actions\">\n                <a href=\"\" class=\"\" ng-click=\"delete()\"><span class=\"fa fa-trash-o\"></span></a>\n            </td>\n        </tr>\n\n    </table>\n\n    <button type=\"file\" class=\"btn btn-primary btn-file\" ngf-select=\"upload($file)\" ng-disabled=\"status != STATUS.normal\"\n            ngf-multiple=\"false\" ng-show=\"model[options.key] == null\">\n        <i class=\"fa fa-cloud-upload\" aria-hidden=\"true\"></i>\n        <span ng-if=\"status == STATUS.uploading\">{{ 'Uploading' | translate}} {{progress}}%</span>\n        <span ng-if=\"status == STATUS.normal\">{{ (attachment.label || 'Select File') | translate}}</span>\n        <span ng-if=\"status == STATUS.disabled\">{{ 'You must save document first' | translate}}</span>\n    </button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/attachmentList.tpl.html", "<div>\n    <span ng-if=\"error\" class=\"error-text\">{{error}}</span>\n    <!--ng-model=\"model[options.key]\"-->\n    <!--<input type=\"text\" ng-model=\"username\"><br/><br/>-->\n    <!--watching model:-->\n    <table>\n        <tr>\n            <th translate>Filename</th>\n            <th>Size</th>\n            <th class=\"attachment-actions\">Actions</th>\n        </tr>\n        <tr ng-if=\"model[options.key]\" ng-repeat=\"file in model[options.key]\">\n            <td><a href=\"{{attachment.getDownloadLink(file)}}\">{{ attachment.getFilename(file) }}</a></td>\n            <td>{{ attachment.getSize(file) | formatFileSize }}</td>\n            <td class=\"attachment-actions\">\n                <a href=\"\" class=\"\" ng-click=\"delete(file)\"><span class=\"fa fa-trash-o\"></span></a>\n            </td>\n        </tr>\n\n    </table>\n\n    <button type=\"file\" class=\"btn btn-primary btn-file\" ngf-select=\"upload($file)\" ng-disabled=\"status != STATUS.normal\"\n            ngf-multiple=\"false\">\n        <i class=\"fa fa-cloud-upload\" aria-hidden=\"true\"></i>\n        <span ng-if=\"status == STATUS.uploading\">{{ 'Uploading' | translate}} {{progress}}%</span>\n        <span ng-if=\"status == STATUS.normal\">{{ (attachment.label || 'Select File') | translate}}</span>\n        <span ng-if=\"status == STATUS.disabled\">{{ 'You must save document first' | translate}}</span>\n    </button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/checkbox.tpl.html", "<div class=\"checkbox\">\n\t<label>\n\t\t<input type=\"checkbox\"\n           class=\"formly-field-checkbox\"\n\t\t       ng-model=\"model[options.key]\">\n\t\t{{to.label}}\n\t\t{{to.required ? '*' : ''}}\n\t</label>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/datepicker.tpl.html", "<p class=\"input-group input-group-datepicker\">\n    <input id=\"{{::id}}\"\n           name=\"{{::id}}\"\n           ng-model=\"model[options.key]\"\n           class=\"form-control datepicker\"\n           type=\"text\"\n           uib-datepicker-popup=\"{{to.datepickerOptions.format || 'yyyy-MM-dd'}}\"\n           is-open=\"openedDatePopUp\"\n           datepicker-popup-template-url=\"/src/formly/types/templates/overrides/datepickerPopup.tpl.html\"\n           ng-required=\"false\"\n           show-button-bar=\"false\"\n           datepicker-options=\"to.datepickerOptions\"\n           on-open-focus=\"false\"\n           ng-click=\"openPopUp($event)\"/>\n    <span class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"openPopUp($event)\">\n            <i class=\"glyphicon glyphicon-calendar\"></i>\n        </button>\n    </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/input.tpl.html", "<input class=\"form-control\"  ng-model=\"model[options.key]\" placeholder=\"{{options.templateOptions.placeholder | translate}}\">");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiCheckbox.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\"\n             id=\"{{id + '_'+ $index}}\"\n             ng-model=\"multiCheckbox.checked[$index]\"\n             ng-change=\"multiCheckbox.change()\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelect.tpl.html", "<div>\n    <div class=\"radio-box\" ng-class=\"{'radio-box-last': $last, 'radio-box-first': $first, 'radio-box-active': model[options.key] == option.value}\"\n         ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <span class=\"radio-desc\">{{::option.name}}</span>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelectImage.tpl.html", "<!--<div>\n    <div ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" id=\"{{id}}_{{::option.value}}\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <label class=\"\" style=\"top: -3px; position: relative;\" for=\"{{id}}_{{::option.value}}\">\n            <span class=\"\" >{{::option.name}}</span>\n        </label>\n    </div>\n</div>-->\n\n<div>\n    <div class=\"content\">\n        <div class=\"row\">\n            <div ng-repeat=\"col in options.templateOptions.cols\" class=\"{{::options.templateOptions.colClass}}\">\n               <div class=\"multiselect-image {{::element.css}} {{options.data.isActive(element.value) ? 'alert-success' : 'alert-default'}}\"\n                     role=\"alert\" ng-repeat=\"element in col\"\n                     ng-click=\"addRemoveModel(element.value)\">\n                    <span>{{::element.label}}</span>\n                    <i class=\"fa fa-check-circle\" aria-hidden=\"true\"></i>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelectVertical.tpl.html", "<div>\n    <div ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" id=\"{{id}}_{{::option.value}}\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <label class=\"\" style=\"top: -3px; position: relative;\" for=\"{{id}}_{{::option.value}}\">\n            <span class=\"\" >{{::option.name}}</span>\n        </label>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/overrides/datepickerPopup.tpl.html", "<ul role=\"presentation\" class=\"uib-datepicker-popup dropdown-menu uib-position-measure engine-popup\" dropdown-nested ng-if=\"isOpen\" ng-keydown=\"keydown($event)\" ng-click=\"$event.stopPropagation()\">\n    <li ng-transclude></li>\n    <li ng-if=\"showButtonBar\" class=\"uib-button-bar\">\n    <span class=\"btn-group pull-left\">\n      <button type=\"button\" class=\"btn btn-sm btn-info uib-datepicker-current\" ng-click=\"select('today', $event)\" ng-disabled=\"isDisabled('today')\">{{ getText('current') }}</button>\n      <button type=\"button\" class=\"btn btn-sm btn-danger uib-clear\" ng-click=\"select(null, $event)\">{{ getText('clear') }}</button>\n    </span>\n        <button type=\"button\" class=\"btn btn-sm btn-success pull-right uib-close\" ng-click=\"close($event)\">{{ getText('close') }}</button>\n    </li>\n</ul>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/radio.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"radio\">\n    <label>\n      <input type=\"radio\"\n             id=\"{{id + '_'+ $index}}\"\n             tabindex=\"0\"\n             ng-value=\"option[to.valueProp || 'value']\"\n             ng-model=\"model[options.key]\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/radioGroup.tpl.html", "<div>\n    <div class=\"pr-category btn-group row row-compensate\">\n            <label class=\"btn btn-default\" ng-repeat=\"(key, option) in to.options\">\n                <input type=\"radio\"\n                       id=\"{{id + '_'+ $index}}\"\n                       tabindex=\"0\"\n                       ng-value=\"option[to.valueProp || 'value']\"\n                       ng-model=\"model[options.key]\">\n                <span class=\"radio-desc\" translate>{{option[to.labelProp || 'name']}}</span>\n            </label>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/select.tpl.html", "<select class=\"form-control\" ng-model=\"model[options.key]\"></select>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/textarea.tpl.html", "<textarea class=\"form-control\" ng-model=\"model[options.key]\"></textarea>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\" ng-show=\"options.data.hasMetrics()\">\n    <div class=\"{{::options.templateOptions.wrapperInnerClass}}\">\n        <h2 ng-if=\"options.templateOptions.label\" translate>{{options.templateOptions.label}}</h2>\n        <formly-transclude></formly-transclude>\n    </div>\n    <div class=clearfix\"></div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/default.tpl.html", "<div class=\"{{::options.to.categoryWrapperCSS}}\">\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/has-error.tpl.html", "<div class=\"form-group\" ng-class=\"{'has-error': showError }\">\n  <formly-transclude></formly-transclude>\n  <div ng-if=\"showError\" class=\"error-messages\">\n    <div ng-repeat=\"(key, error) in fc.$error\" class=\"message help-block ng-binding ng-scope\" translate>{{options.validation.messages[key](fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  <!-- after researching more about ng-messages integrate it\n  <div ng-messages=\"fc.$error\" ng-if=\"showError\" class=\"error-messages\">\n    <div ng-message=\"{{ ::name }}\" ng-repeat=\"(name, message) in ::options.validation.messages\" class=\"message help-block ng-binding ng-scope\" translate>{{ message(fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  -->\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/label.tpl.html", "<div class=\"\">\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        <span translate>{{to.label}}</span>\n        {{to.required ? '*' : ''}}\n        <span translate class=\"grey-text\" ng-if=\"to.description\" translate>({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/row.tpl.html", "<div ng-if=\"options.data.hasMetrics()\">\n    <p class=\"row-label\" ng-if=\"to.label\" translate>{{to.label}}</p>\n    <div class=\"row  {{options.templateOptions.wrapperClass}}\">\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/step.tpl.html", "<div ng-hide=\"options.data.hide\">\n    <div class=\"text-box\" ng-if=\"options.data.hasEntries()\">\n        <div class=\"{{::options.templateOptions.wrapperInnerClass}}\">\n            <h2 ng-if=\"options.data.step.data.summary.caption\" translate>{{options.data.step.data.summary.caption}}</h2>\n            <table class=\"table\">\n                <tr ng-repeat=\"entry in options.data.step.data.summary.entries\">\n                    <td translate>{{entry.caption || entry.name}}</td>\n                    <td translate>{{options.data.$parse(entry.name)(model) || 'Not specified yet'}}</td>\n                </tr>\n            </table>\n        </div>\n        <div class=clearfix\"></div>\n    </div>\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/unit.tpl.html", "<div class=\"input-group\">\n    <formly-transclude></formly-transclude>\n    <span class=\"input-group-addon\" >{{::options.data.unit}}</span>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/array.tpl.html", "{{$ctrl.arrayCellIterate(column.iterator,\n                         $ctrl.process(column.processor, $parse(column.name)(document_entry.document)))}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/date.tpl.html", "{{$ctrl.process(column.processor, $parse(column.name)(document_entry.document)) | date}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/index.tpl.html", "{{$ctrl.process(column.processor, $row+1)}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/link.tpl.html", "<a href=\"\" ng-click=\"onDocumentSelect(document_entry)\" class=\"proposal-title\" ng-include=\"getCellTemplate(document_entry.document, column, true)\"></a>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/text.tpl.html", "{{$ctrl.process(column.processor, $parse(column.name)(document_entry.document))}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.component.tpl.html", "<ng-include src=\"$ctrl.template\"></ng-include>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.single.tpl.html", "<h2 ng-if=\"$ctrl.listCaption\" translate>{{ $ctrl.listCaption }}</h2>\n<div>\n    <div class=\"eng-loading-box\" ng-show=\"!documents.$resolved\">\n        <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n    </div>\n    <div ng-if=\"documents.$resolved || $ctrl.noParentDocument\" ng-cloak>\n        <table ng-repeat=\"document_entry in documents\" ng-if=\"!documents.$error && !$ctrl.noParentDocument\" ng-init=\"$row=$index\" class=\"proposal-list\">\n            <tr class=\"single-document-top\">\n                <td class=\"text-left\"></td>\n                <td class=\"text-right cog-dropdown\" style=\"padding-top: 5px\">\n                    <div class=\"dropdown\" style=\"height: 9px;\" ng-if=\"document_entry.actions.length > 0\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\"><span class=\"glyphicon glyphicon-cog\"></span></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in document_entry.actions\"><a href=\"\" ng-click=\"engineAction(action, document_entry.document)\" translate>{{action.label}}</a></li>\n                            <li ng-if=\"!document_entry.actions\"><span style=\"margin-left: 5px; margin-right: 5px;\" translate>No actions available</span></li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n            <tr ng-repeat=\"column in columns\" class=\"{{column.css}} {{column.style}}\">\n                <td class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" translate>{{column.caption || column.name}}</td>\n                <td ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n            </tr>\n        </table>\n\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"documents.$error\" translate>\n            {{documents.$errorMessage || 'An error occurred during document loading'}}\n        </div>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"$ctrl.noParentDocument\" translate>\n            {{$ctrl.noParentDocumentMessage || 'Parent document does not exist, save this document first'}}\n        </div>\n        <div class=\"alert alert-info\" role=\"alert\" ng-if=\"documents.$resolved && documents.length == 0 && !documents.$error\" translate>\n            {{ $ctrl.noDocumentsMessage || 'There are no documents to display'}}\n        </div>\n    </div>\n</div>\n<a href=\"\" ng-if=\"$ctrl._showCreateButton && canCreateDocument()\" ng-click=\"onCreateDocument()\" class=\"btn btn-primary\">\n    <span ng-if=\"!$ctrl.options.list.createButtonLabel\" translate>Create {{options.name}}</span>\n    <span ng-if=\"$ctrl.options.list.createButtonLabel\">{{$ctrl.options.list.createButtonLabel | translate}}</span>\n</a>\n<a href=\"\" ng-click=\"customButton.callback($ctrl.options)\" class=\"btn btn-primary\" ng-repeat=\"customButton in customButtons\">\n    <span>{{customButton.label | translate}}</span>\n</a>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.tpl.html", "<h2 ng-if=\"$ctrl.listCaption\" translate>{{ $ctrl.listCaption }}</h2>\n<div>\n    <div class=\"eng-loading-box\" ng-show=\"!documents.$resolved\">\n        <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n    </div>\n    <div ng-if=\"documents.$resolved || $ctrl.noParentDocument\" ng-cloak>\n        <table class=\"proposal-list\">\n            <tr>\n                <th class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" ng-repeat=\"column in columns\" translate>{{column.caption || column.name}}</th>\n                <th class=\"text-right\"></th>\n            </tr>\n            <tr ng-repeat=\"document_entry in documents\" ng-if=\"!documents.$error && !$ctrl.noParentDocument\" ng-init=\"$row=$index\">\n                <td ng-repeat=\"column in columns\" class=\"{{column.css}} {{column.style}}\" ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n                <td class=\"text-right cog-dropdown\">\n                    <div class=\"dropdown\" ng-if=\"document_entry.actions.length > 0\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\"><i class=\"fa fa-cog\" aria-hidden=\"true\"></i></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in document_entry.actions\"><a href=\"\" ng-click=\"engineAction(action, document_entry.document)\" translate>{{action.label}}</a></li>\n                            <li ng-if=\"!document_entry.actions\"><span style=\"margin-left: 5px; margin-right: 5px;\" translate>No actions available</span></li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n        </table>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"documents.$error\" translate>\n            {{documents.$errorMessage || 'An error occurred during document loading'}}\n        </div>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"$ctrl.noParentDocument\" translate>\n            {{$ctrl.noParentDocumentMessage || 'Parent document does not exist, save this document first'}}\n        </div>\n        <div class=\"alert alert-info\" role=\"alert\" ng-if=\"documents.$resolved && documents.length == 0 && !documents.$error\" translate>\n            {{ $ctrl.noDocumentsMessage || 'There are no documents to display'}}\n        </div>\n    </div>\n</div>\n<a href=\"\" ng-if=\"$ctrl._showCreateButton && canCreateDocument()\" ng-click=\"onCreateDocument()\" class=\"btn btn-primary\">\n    <span ng-if=\"!$ctrl.options.list.createButtonLabel\" translate>Create {{options.name}}</span>\n    <span ng-if=\"$ctrl.options.list.createButtonLabel\">{{$ctrl.options.list.createButtonLabel | translate}}</span>\n</a>\n<a href=\"\" ng-click=\"customButton.callback($ctrl.options)\" class=\"btn btn-primary\" ng-repeat=\"customButton in customButtons\">\n    <span>{{customButton.label | translate}}</span>\n</a>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.wrapper.tpl.html", "<h1 translate>{{::options.list.caption}}</h1>\n<div class=\"text-box\" ng-repeat=\"query in queries\">\n    <div class=\"text-content\">\n        <engine-document-list content-template-url=\"query.contentTemplateUrl\"\n                controller=\"{{query.controller || ''}}\"\n                no-documents-message=\"{{query.noDocumentsMessage || options.list.noDocumentsMessage || ''}}\"\n                no-parent-document-message=\"{{query.noParentDocumentMessage || options.list.noParentDocumentMessage || ''}}\"\n                show-create-button=\"$last\" query=\"query.id\" options=\"options\"></engine-document-list>\n    </div>\n</div>");
}]);

//# sourceMappingURL=templates.js.map
;
//# sourceMappingURL=angular-engine.js.map