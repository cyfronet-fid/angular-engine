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

var app = angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'engine.formly', 'ui.bootstrap',
//required for supporting multiselect metrics
'checklist-model', 'engine.common', 'engine.list', 'engine.dashboard', 'engine.steps', 'ngMessages', 'ngFileUpload', 'pascalprecht.translate', 'engine.document']);

/**
 * Optimizating performance in production mode
 */
app.config(["formlyConfigProvider", "formlyApiCheck", "$engLogProvider", "$provide", "productionMode", function (formlyConfigProvider, formlyApiCheck, $engLogProvider, $provide, productionMode) {
    // From version 0.7.12+ api check has been disabled
    // for performance reasons
    formlyApiCheck.config.disabled = true;
    formlyConfigProvider.disableWarnings = true;
    formlyConfigProvider.extras.ngModelAttrsManipulatorPreferBound = true;

    // turn on optimization if in production mode
    if (productionMode) {
        // disable logs if in production mode
        $engLogProvider.setLogLevel('error');
    }
}]);

/**
 * setup hook when user tries to navigate away
 */
app.run(["$engine", "$rootScope", "$engLog", "$translate", function ($engine, $rootScope, $engLog, $translate) {

    function onRelad() {
        $engLog.debug('engine.common.navigateAway');
        var event = $rootScope.$broadcast('engine.common.navigateAway');
        return event.defaultPrevented == true ? true : null;
    }

    if ($engine.disableOnReload == false) {
        window.onbeforeunload = onRelad;

        $rootScope.$on("$locationChangeStart", function (event, next, current) {

            //if routes differ only by GET params don't do anything
            var nextBase = next.match(/^[^?]+/);
            var currBase = current.match(/^[^?]+/);

            if (nextBase.length == 1 && currBase.length == 1 && currBase[0] == nextBase[0]) return;

            if (onRelad() == true && confirm($translate.instant('Do you want to leave this site? Changes you made may not be saved.')) == false) {
                event.preventDefault();
            }
        });
    }
}]);

'use strict';

angular.module('engine.formly', ['ui.select', 'ngSanitize']);

'use strict';

angular.module('engine.list', ['ngRoute']);

'use strict';

app = angular.module('engine.common');

app.component('actionButton', {
    controller: ["$q", function controller($q) {
        var self = this;

        this.loading = false;

        this.invoke = function () {
            //do not allow for double clicks
            if (this.loading) return;

            this.loading = true;
            $q.when(this.onClick()).finally(function () {
                self.loading = false;
            });
        };
    }],
    templateUrl: '/src/common/action-button/action-button.tpl.html',
    bindings: {
        onClick: '&',
        label: '@',
        btnClass: '@'
    }
});

'use strict';

angular.module('engine.common').constant('ENGINE_SAVE_ACTIONS', ['CREATE', 'UPDATE']);

'use strict';

var app = angular.module('engine.common');

app.directive('engIsolateForm', ["$timeout", function IsolateFormDirective($timeout) {
  return {
    restrict: 'A',
    require: '?form',
    link: function link(scope, $element, attrs, formController) {

      if (!formController) {
        return;
      }

      $timeout(function () {
        // Remove this form from parent controller
        var parentFormController = $element.parent().controller('form');

        if (_.isUndefined(parentFormController)) return;

        parentFormController.$removeControl(formController);

        // Replace form controller with a 'null-controller'
        var isolateFormCtrl = {
          $addControl: angular.noop,
          $removeControl: angular.noop,
          $setValidity: angular.noop,
          $setDirty: angular.noop,
          $setPristine: angular.noop
        };

        angular.extend(formController, isolateFormCtrl);
      });
    }
  };
}]);

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
}).factory('engineActionUtils', ["$rootScope", "ErrorEventCtx", "ENGINE_SAVE_ACTIONS", function ($rootScope, ErrorEventCtx, ENGINE_SAVE_ACTIONS) {
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
        if (actions != null) for (var i = 0; i < actions.length; ++i) {
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
}]);

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfirmModalCmpCtrl = function () {
    function ConfirmModalCmpCtrl() {
        _classCallCheck(this, ConfirmModalCmpCtrl);
    }

    _createClass(ConfirmModalCmpCtrl, [{
        key: '$onInit',
        value: function $onInit() {}
    }]);

    return ConfirmModalCmpCtrl;
}();

app.component('confirmModalCmp', {
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controller: ConfirmModalCmpCtrl,
    templateUrl: '/src/common/confirm-modal/common.confirm-modal.tpl.html'
});

var app = angular.module('engine.common');

app.factory('engConfirm', ["$resource", "$uibModal", "$translate", "$timeout", "$engine", function ($resource, $uibModal, $translate, $timeout, $engine) {
    /**
     *
     * @param title
     * @type title string
     * @param content
     * @type content string
     */
    return function engConfirm(_title, _content) {
        var modalInstance = $uibModal.open({
            component: 'confirmModalCmp',
            keyboard: false,
            backdrop: 'static',
            windowTopClass: $engine.GLOBAL_CSS,
            resolve: {
                title: function title() {
                    return _title;
                },
                content: function content() {
                    return _content;
                }
            },
            controller: ConfirmModalCmpCtrl,
            size: 'sm'
        });
        return modalInstance.result;
    };
}]);

'use strict';

angular.module('engine.common').component('engineDocumentActions', {
    templateUrl: '/src/common/document-actions/document-actions.tpl.html',
    controller: ["$rootScope", "$scope", "DocumentActionList", "$engLog", "$timeout", function controller($rootScope, $scope, DocumentActionList, $engLog, $timeout) {
        var self = this;
        var _bindings = [];

        this.$onInit = function () {
            if (self.document != null) self.loadActions();
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
                    if (self.actionList == null) self.loadActions();else self.actionList._setDocument(newDocument);
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
    }],
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

'use strict';

angular.module('engine.common').factory('engActionResource', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', { actionId: '@actionId', documentId: '@documentId' }, {
        invoke: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    var _actionAvailable = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId', { documentId: '@id' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return {
        getAvailable: function getAvailable(document, documentId, otherDocumentId) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.string], arguments);
            return _actionAvailable.post({ documentId: documentId, otherDocumentId: otherDocumentId }, document === null ? null : _.omit(document, '$ext'));
        },
        invoke: function invoke(actionId, document, contextDocumentId, otherDocumentId) {
            $engineApiCheck([$engineApiCheck.string, $engineApiCheck.object], arguments);
            return _action.invoke({ actionId: actionId, documentId: contextDocumentId || document.id, otherDocumentId: otherDocumentId }, document === null ? null : _.omit(document, '$ext'));
        }
    };
}]);

'use strict';

var _module = angular.module('engine.common');

_module.directive('sidebarAddon', ["$compile", function SidebarAddonDirective($compile) {
    return {
        templateUrl: '/src/common/sidebar-addon/sidebar-addon.tpl.html',
        restrict: 'E',
        scope: {
            tag: '@',
            document: '=',
            ctx: '=',
            caption: '@'
        },
        link: function link($scope, $element, attrs) {
            var newElement = $compile('<' + $scope.tag + ' document="document" ctx="ctx"></' + $scope.tag + '>')($scope);
            $element.children().eq(0).children().eq(0).append(newElement);
        }
    };
}]);

'use strict';

angular.module('engine.dashboard').controller('engineDashboardCtrl', ["$scope", "$route", "$engine", function ($scope, $route, $engine) {
    $scope.$engine = $engine;
    $scope.options = $route.current.$$route.options;
    $scope.queries = $scope.options.queries;
    $scope.IMMEDIATE_CREATE = $engine.IMMEDIATE_CREATE;
}]);

'use strict';

angular.module('engine.document').component('engineDocumentDetails', {
    templateUrl: '/src/document/details/details.tpl.html',

    controller: ["$parse", "$window", "$scope", function controller($parse, $window, $scope) {
        var _this = this;

        var self = this;
        this.$parse = $parse;

        self.isVisible = function () {
            return $scope.$parent.sideMenuVisible;
        };

        this.formatEntry = function (entry) {
            var r = _this.$parse(entry.name)(_this.ngModel);

            if (!_.isUndefined(r) && _.isDate(r) && entry.type === 'date') r = $filter('date')(r);
            return r;
        };

        this.saveDocument = function () {
            self.savePromise = self.actions.callSave();
            return self.savePromise;
        };
    }],
    bindings: {
        ngModel: '<',
        options: '=',
        actions: '=',
        dirty: '='
    }
}).filter('conditionFulfiled', ["$parse", function ($parse) {
    return function (items, document) {
        var filtered = [];

        angular.forEach(items, function (item) {
            if (item.condition == null || $parse(item.condition)(document) === true) filtered.push(item);
        });
        return filtered;
    };
}]).directive('scrollRwd', ["$window", "$document", "$timeout", function ($window, $document, $timeout) {
    return {
        restrict: 'AEC',
        link: link
    };
    function link(scope, element, attrs) {
        scope.windowHeight = $window.innerHeight;

        attrs.$observe('isVisible', function (val) {
            if (val) {
                $timeout(function () {
                    scope.windowHeight = $window.innerHeight;
                    updateScroll();
                });
            }
        });

        angular.element($window).on('resize', function () {
            scope.windowHeight = $window.innerHeight;
            updateScroll();
            scope.$digest();
        });

        function updateScroll() {
            var marginBottom = 10;
            var elementHeight = element[0].scrollHeight;
            var elementTop = element[0].getBoundingClientRect().top;

            if (elementHeight > 0 && elementHeight + elementTop > scope.windowHeight) {
                var heightToSave = scope.windowHeight - elementTop - marginBottom + "px";
                element.css("height", heightToSave);
                element.addClass("scroll-rwd");
            } else {
                element.css("height", "auto");
                element.removeClass("scroll-rwd");
            }
        }
    }
}]);

'use strict';

var app = angular.module('engine.document');
app.component('engineDocument', {
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
        parentDocument: '=',
        dirty: '=',
        processing: '=?',
        documentScope: '=?'
    }
});
app.controller('engineDocumentCtrl', ["$scope", "$route", "engineMetric", "$routeParams", "$engine", "engineDocument", "engineActionsAvailable", "$location", "engineActionUtils", "DocumentEventCtx", "engineAction", "engineMetricCategories", "StepList", "DocumentForm", "DocumentActionList", "$q", "$engLog", "$attrs", "Step", "$parse", "$element", "$compile", "$interval", "$http", function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument, engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx, engineAction, engineMetricCategories, StepList, DocumentForm, DocumentActionList, $q, $engLog, $attrs, Step, $parse, $element, $compile, $interval, $http) {
    var self = this;

    $engLog.debug($scope);

    this.$onInit = function () {
        this.document = null;
        this.documentScope = $scope;
        $scope.steps = this.options.document.steps;
        this.processing = false;
        this.actionList = null;
        this.documentForm = new DocumentForm($scope);
        this.dirty = false;

        $scope.$on('engine.common.document.requestReload', function (event) {
            $engLog.debug('request reload for document');

            event.reloadPromise = self.getDocument(true).then(function () {
                self.stepList.setDocument(self.document);
                return self.stepList.$ready;
            })
            // .then(() => self.documentForm._setSteps(self.stepList))
            .then(function () {
                return self.documentForm._setDocument(self.document);
            })
            // .then(() => self.documentForm._onReload())
            .then(function () {
                return self.documentForm.connectFieldToStep();
            }).then(function () {
                self.actionList._setDocument(self.document);
                $scope.$broadcast('engine.list.reload');
            });
        });

        $scope.$on('engine.common.document.validate', function (event) {
            event.$promise = self.documentForm.validate(null, true).then(function (valid) {
                if (!valid) self.step = self.stepList.getFirstInvalidIndex();
            });
        });

        $scope.$on('engine.list.reload', function (event) {
            self.loadMessages();
        });

        $scope.$on('engine.common.document.requestSave', function (event) {
            event.savePromise = self.save();
        });

        $scope.$on('engine.common.action.after', function (event, document, action, result) {
            self.loadMessages();
        });

        $scope.$watch('$ctrl.formlyState.$dirty', function (newValue, oldValue) {
            self.dirty = newValue;
        });

        $scope.$watch('$ctrl.formlyState', function (newValue, oldValue) {
            self.documentForm.setFormlyState(newValue);
        });

        $scope.$watch('$ctrl.formlyOptions', function (newValue, oldValue) {
            self.documentForm.setFormlyOptions(newValue);
        });

        this.$ready = _initDocument();
    };

    function _initDocument(noReloadSteps) {
        return self.getDocument(noReloadSteps).then(function () {
            return $q.all(self.stepList.$ready, self.documentForm.$ready);
        }).then(self.initDocument).then(self.postinitDocument).then(function () {
            $engLog.debug('engineDocumentCtrl initialized: ', self);
            $engLog.log(self.$ready.$$state.status);
        }).then(self.validateAfterInit).then(function () {
            $scope.$emit('engine.common.document.documentLoaded', self.document);
        });
    }

    this.$onChanges = function (changesObject) {
        //this should cover creating new document in modal
        if (!_.isUndefined(changesObject.documentId)) {
            console.log('documentId changed', changesObject.documentId);
            if (changesObject.documentId.currentValue !== '' && !changesObject.documentId.isFirstChange()) {
                self.document = null;
                self.processing = false;
                self.actionList = null;
                self.dirty = false;
                self.documentForm.$destroy();
                self.formlyState = undefined;
                self.formlyOptions = undefined;
                self.documentForm = new DocumentForm($scope);
                self.$ready = _initDocument();
            }
        }
    };

    this.loadMessages = function () {
        $http.get('/document/messages?documentId=' + self.documentId).then(function (res) {
            return self.messages = res.data.data;
        });
    };

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
        return $q.all([self.actionList.$ready]).then(function () {
            //assign actions only if binding is present
            if ($attrs.actions) self.actions = self.actionList;
            self.documentForm.init(self.document, self.options, self.stepList, self.actionList, self.formlyState, self.formlyOptions);
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
        self.processing = true;
        return self.actionList.callSave().finally(function () {
            return self.processing = false;
        });
    };

    this.validateAfterInit = function validateAfterInit() {
        var stepsToValidate = [];
        var currentStep = self.stepList.getCurrentStepIndex();

        for (i = 0; i < currentStep; i++) {
            if (self.stepList.getStep(i).getState() == Step.STATE_BLANK) {
                stepsToValidate.push(i);
            }
        }

        self.documentForm.validate(stepsToValidate, true);
    };
}]);

'use strict';

angular.module('engine.document').factory('DocumentModal', ["$resource", "$uibModal", "$translate", "$timeout", "$engine", function ($resource, $uibModal, $translate, $timeout, $engine) {
    return function (_documentId, _documentOptions, parentDocument, callback) {
        var modalInstance = $uibModal.open({
            templateUrl: '/src/document/document-modal.tpl.html',
            keyboard: false,
            backdrop: 'static',
            windowTopClass: $engine.GLOBAL_CSS,
            appendTo: $($engine.MODAL_CONTAINER).eq(0),

            controller: ["$scope", "documentId", "documentOptions", "engineActionsAvailable", "StepList", "engineResolve", "$uibModalInstance", function controller($scope, documentId, documentOptions, engineActionsAvailable, StepList, engineResolve, $uibModalInstance) {
                $scope.engineResolve = engineResolve;
                $scope.step = 0;
                $scope.documentOptions = documentOptions;
                //will be filled by document component
                $scope.documentScope = undefined;
                $scope.parentDocument = parentDocument;
                $scope.$scope = $scope;
                $scope.stepList = new StepList($scope.documentOptions.document.steps);
                $scope.document = {};
                $scope.documentId = documentId;

                var registeredListeners = [];

                function _canCloseModal() {
                    if ($scope.documentDirty == false) return true;

                    return confirm($translate.instant('Do you want to close this modal? Changes you made have not been saved.'));
                }

                $scope.closeModal = function () {
                    $uibModalInstance.close();
                };

                $scope.$on('modal.closing', function (event) {
                    if (!_canCloseModal()) event.preventDefault();
                });

                $scope.$watch('documentScope', function (nv, ov) {
                    if (ov != null) {
                        _.each(registeredListeners, function (removeListener) {
                            removeListener();
                        });
                        registeredListeners = [];
                    }
                    if (nv == null) return;

                    registeredListeners.push($scope.documentScope.$on('engine.common.action.after', function (event, ctx) {
                        // don't close modal after save, with exception of create actions
                        // TODO - in the future release create action may close modal, and open new with created document
                        if (ctx.action.isSave() || ctx.action.isCreate()) return;

                        if (ctx.result.type == 'REDIRECT') {
                            event.preventDefault();
                            // this must be done in the next digest cycle, so that form $dirty state is cleared beforehand
                            $timeout($scope.closeModal);
                        }
                    }));

                    registeredListeners.push($scope.documentScope.$on('engine.common.save.after', function (event, ctx) {
                        console.log(event, ctx);
                        if (ctx.action.isCreate() === true && ctx.result.type === 'REDIRECT') {
                            $scope.stepList = new StepList($scope.documentOptions.document.steps);
                            $scope.document = {};
                            $scope.step = 0;
                            $scope.documentId = ctx.result.redirectToDocument;
                        }
                    }));
                });

                $scope.customButtons = [{ label: 'Close', 'action': $scope.closeModal }];
            }],
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
        return modalInstance.result.then(function (result) {
            if (callback) callback(result);
        }, function () {});
    };
}]);

'use strict';

angular.module('engine.document').controller('engineDocumentWrapperCtrl', ["$scope", "$route", "$location", "engineMetric", "$routeParams", "engineResolve", "StepList", "$engine", function ($scope, $route, $location, engineMetric, $routeParams, engineResolve, StepList, $engine) {
    $scope.responsive = $engine.RESPONSIVE;

    $scope.engineResolve = engineResolve;
    $scope.options = $route.current.$$route.options;

    $scope.stepList = new StepList($route.current.$$route.options.document.steps);

    $scope.document = {};
    $scope.documentId = $routeParams.id;

    $scope.processing = false;

    if ($routeParams.step === undefined) $routeParams.step = 0;else $routeParams.step = parseInt($routeParams.step);

    $scope.sideMenuVisible = false;
    $scope.toggleSideMenu = function () {
        $scope.sideMenuVisible = !$scope.sideMenuVisible;
    };

    $scope.$routeParams = $routeParams;

    $scope.conditionFulfilled = function (addon) {
        return addon.condition($scope.document);
    };

    $scope.$watch('$routeParams.step', function (newVal, oldVal) {
        if (angular.isString(newVal)) {
            newVal = parseInt(newVal);
            $routeParams.step = newVal;
        }

        // handle cases where step is "out of bounds" - we'll silently handle the error and
        // substitute it for first step
        if ($routeParams.step > $scope.stepList.steps.length - 1 || $routeParams.step < 0) {
            $routeParams.step = 0;
            newVal = 0;
        }

        if (newVal !== oldVal) {
            $location.search({ step: newVal || 0 });
        }
    });
}]).directive('fixedOnScroll', ["$window", function ($window) {
    var $win = angular.element($window);
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {
            var topClass = attrs.fixedOnScroll;

            $win.on("scroll", function () {
                scope.offsetTop = element[0].parentNode.offsetTop + element[0].getBoundingClientRect().top;
                if ($window.pageYOffset >= scope.offsetTop) {
                    element.addClass(topClass);
                } else {
                    element.removeClass(topClass);
                }
                scope.$digest();
            });
        }
    };
}]);

'use strict';

/**
 * Created by marta on 2/14/18.
 */
angular.module('engine.document').filter('numberFormat', ["$translate", function ($translate) {
    return function (item) {
        var number = Number(item);
        if (!_.isNaN(number)) {
            return number.toLocaleString($translate.use());
        } else {
            return item;
        }
    };
}]);

'use strict';

angular.module('engine.document').factory('DocumentActionList', ["DocumentAction", "engActionResource", "$engineApiCheck", "$q", "$engLog", "$http", "$rootScope", function (DocumentAction, engActionResource, $engineApiCheck, $q, $engLog, $http, $rootScope) {
    function DocumentActionList(actions, document, parentDocument, $scope, dontSendTemp) {
        $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);

        if (parentDocument == null) parentDocument = {};

        var self = this;
        this.dontSendTemp = dontSendTemp || false;
        this.$scope = $scope;
        this.parentDocument = parentDocument;
        this.parentDocumentId = document.id != null ? null : parentDocument.id;
        this.actions = [];

        this.markInit = null;

        this.loadActions = function loadActions() {
            if (actions != null) return self.processActions(actions);
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
}]).factory('DocumentAction', ["engActionResource", "$engineApiCheck", "DocumentActionProcess", "$engLog", "$q", "$rootScope", "$engine", function (engActionResource, $engineApiCheck, DocumentActionProcess, $engLog, $q, $rootScope, $engine) {
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
        var _this = this;

        if (ctx == null) ctx = {};
        var self = this;
        var event = null;
        $engLog.debug('engine.document.actions', 'action called', this);

        var consent = $q.when(true);

        if (this.isDelete()) {
            console.log('delete called');
            consent = $engine.confirm('Delete', 'Do you really want to perform this action?');
        }

        return consent.then(function () {
            if (_this.$scope) {
                var promises = [];

                event = _this.$scope.$broadcast('engine.common.action.before', {
                    'document': _this.document,
                    'action': _this,
                    'ctx': ctx,
                    'promises': promises
                });
                _this.broadcastNotification('engine.notification.action.before');

                if (event.defaultPrevented) {
                    _this.$scope.$broadcast('engine.common.action.prevented', {
                        'document': _this.document,
                        'action': _this,
                        'ctx': ctx,
                        'event': event
                    });

                    _this.broadcastNotification('engine.notification.action.prevented');
                    return $q.reject();
                }

                if (_this.isSave()) {
                    event = self.$scope.$broadcast('engine.common.save.before', {
                        'document': _this.document,
                        'action': _this,
                        'ctx': ctx,
                        'promises': promises
                    });

                    _this.broadcastNotification('engine.notification.save.before');

                    if (event.defaultPrevented) {
                        self.$scope.$broadcast('engine.common.save.prevented', {
                            'document': _this.document,
                            'action': _this,
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

                    if (self.isSave()) self.broadcastNotification('engine.notification.save.after');

                    if (ev1.defaultPrevented || ev2.defaultPrevented) return result;
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
                if (self.isSave()) self.broadcastNotification('engine.notification.save.error');
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
}]).factory('DocumentActionProcess', ["$location", "$engine", "engineDocument", "$engLog", "$q", "DocumentModal", "$rootScope", function ($location, $engine, engineDocument, $engLog, $q, DocumentModal, $rootScope) {
    return function DocumentActionHandler(document, actionResponse, parentDocument, $scope) {
        if (actionResponse.type === 'REDIRECT') {
            if (actionResponse.redirectToDocument === null) return $q.resolve();

            // Reload document
            if (document.id === actionResponse.redirectToDocument && $scope != null) {
                $scope.$broadcast('engine.common.document.requestReload');
                return $q.resolve();
            }

            var promise = null;
            if (actionResponse.redirectContext != null) {
                promise = $q.when(actionResponse.redirectContext);
            } else if (actionResponse.targetDocumentStates != null && actionResponse.targetDocumentStates[$engine.DOCUMENT_MODEL_KEY] != null) {
                promise = $q.when(actionResponse.targetDocumentStates[$engine.DOCUMENT_MODEL_KEY]);
            } else {
                promise = engineDocument.get(actionResponse.redirectToDocument).$promise.then(function (data) {
                    return data.document.states.documentType;
                });
            }

            //before redirecting, load document from engine to ascertain it's document type
            return promise.then(function (documentModelTypeAndSteps) {
                // Split step & model
                documentModelTypeAndSteps = documentModelTypeAndSteps.split('#');
                var documentModelType = documentModelTypeAndSteps[0];
                var step = documentModelTypeAndSteps[1];

                if (document.id != null && document.id !== actionResponse.redirectToDocument) {
                    $location.$$search.step = 0;
                }

                if (step !== undefined) $location.$$search.step = step;

                var documentOptions = $engine.getOptions(documentModelType);

                if (documentOptions == null) {
                    var message = 'Document type to which redirection was requested has not been registrated! ' + 'Make sure to register it in $engineProvider';

                    $engLog.error(message, 'DocumentType=', documentModelType);

                    throw new Error(message);
                }
                if (documentOptions.dashboard == true) {
                    $location.path(documentModelType);
                } else if (documentOptions.subdocument == false) {
                    $location.$$path = $engine.pathToDocument(documentOptions, actionResponse.redirectToDocument);
                    $location.$$compose();
                } else {
                    DocumentModal(actionResponse.redirectToDocument, documentOptions, parentDocument.id, function () {
                        return $rootScope.$broadcast('engine.list.reload');
                    });
                }

                return actionResponse;
            });
        }
    };
}]);

'use strict';

angular.module('engine.document').factory('engAttachment', ["$engineConfig", "$http", "Upload", "$q", "$engLog", function ($engineConfig, $http, Upload, $q, $engLog) {
    var listUrl = 'attachment-list';
    var singleUrl = 'attachment';

    function EngineAttachment(document, metricId, isList) {
        var documentId = document.id;
        var self = this;
        this.isList = isList || false;
        this.baseUrl = this.isList ? listUrl : singleUrl;
        if (this.isList) self.dataDict = {};
        this.documentId = documentId;
        this.metricId = metricId;
        this.metricExists = !_.isEmpty(document.metrics[metricId]);
        this.action = null;
        this.data = null;
        this.label = 'Select file';
        this.ready = $q.all([this.loadActions(), $q.when(function () {
            if (self.documentId == null || !self.metricExists) return;

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
        self.data = null;

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
            if (response.data.data.length == 0) $engLog.error("No Attachment action available for document: ", self.documentId, " and metric ", self.metricId);

            self.action = response.data.data[0];
            self.label = self.action.label;
        }, function (response) {
            //TODO ERROR MANAGEMENT
        });
    };
    EngineAttachment.prototype.upload = function upload(file) {
        var self = this;

        var data = self.isList ? { files: file } : { file: file };

        return Upload.upload({
            url: $engineConfig.baseUrl + '/action/invoke/' + self.baseUrl + '?documentId=' + this.documentId + '&metricId=' + this.metricId + '&actionId=' + this.action.id,
            data: data
        });
    };

    return EngineAttachment;
}]);

angular.module('engine.document').filter('formatFileSize', function () {
    return function (input) {
        if (input == null) return '- ';
        return Math.floor(input / 1024) + 'kB';
    };
});

angular.module('engine.document').controller('engAttachmentCtrl', ["$scope", "Upload", "$engine", "$timeout", "engAttachment", "$engLog", "$translate", function ($scope, Upload, $engine, $timeout, engAttachment, $engLog, $translate) {
    var self = this;
    var STATUS = { loading: 0, uploading: 1, disabled: 2, normal: 3 };

    if ($scope.model[$scope.metric.id] == null) $scope.model[$scope.metric.id] = $scope.isList ? [] : null;

    $scope.$watch('model.' + $scope.metric.id, function (newValue, oldValue) {
        if (newValue == null || newValue == oldValue) return;

        if ($scope.ctx.document.id == null) return;

        if ($scope.attachment == null) return;

        if (!$scope.attachment.metricExists) return;

        $scope.attachment.loadMetadata();
    });

    $scope.$watch('invalidFile', function (newValue) {
        if (!!newValue && newValue.$error === "pattern") {
            $translate('ngfErrorPattern', {
                pattern: newValue.$errorParam
            }).then(function (translation) {
                $scope.error = translation;
            });
            // when newValue is undefined, it means upload was successful
            // null is set when file-chooser is opened after error occurred, so I use it to clear error msg
        } else if (newValue === null) {
            $scope.error = null;
        }
    });

    $scope.delete = function (file) {
        $engine.confirm('Delete file', 'Do you really want to delete this file?').then(function () {
            $scope.status = STATUS.loading;
            if ($scope.isList) {
                var indexOf = _.indexOf($scope.model[$scope.options.key], file);
                if (indexOf !== -1) {
                    $scope.model[$scope.options.key].splice(indexOf, 1);
                }
            } else {
                $scope.model[$scope.options.key] = null;
            }
            $scope.attachment.clear();

            var event = $scope.$emit('engine.common.document.requestSave');

            event.savePromise.then(function () {
                $scope.error = null;
                $scope.status = STATUS.normal;
            }, function () {
                $scope.error = 'Could not save document';
                $scope.status = STATUS.normal;
            });
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
                $engLog.log('Success ' + response.config.data[$scope.isList ? 'files' : 'file'].name + 'uploaded. Response: ' + response.data);
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
                $engLog.log('Error status: ' + response.status);
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
        $scope.acceptedExtensions = $scope.metric.acceptedExtensions || '';
        if ($scope.ctx.document.id != null) {
            $scope.attachment = new engAttachment($scope.ctx.document, $scope.metric.id, $scope.isList);
            $scope.attachment.ready.then(function () {
                $scope.status = STATUS.normal;
            });
        } else {
            $scope.status = STATUS.disabled;
            $scope.disable = true;
        }
    }

    _init();
}]);

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

angular.module('engine.document').factory('DocumentCategoryFactory', ["DocumentCategory", "$engLog", "$parse", function (DocumentCategory, $engLog, $parse) {
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
}]).factory('DocumentCategory', ["ConditionBuilder", function (ConditionBuilder) {
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
}]);

'use strict';

angular.module('engine.document').factory('ConditionBuilder', ["$engineApiCheck", function ($engineApiCheck) {
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
}]);

'use strict';

angular.module('engine.document').factory('DocumentFieldFactory', ["DocumentField", "$engine", "$engLog", "createAttachmentCtrl", function (DocumentField, $engine, $engLog, createAttachmentCtrl) {
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
            $engLog.error(message, "Metric", metric, "Registered types", this._fieldTypeList);
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

        // this is a default handler which will reload metric's options in place according to availableOption
        var optionsReloadHandler = function optionsReloadHandler(newMetricData, field) {
            $engLog.debug('reloading options in place', newMetricData, field);
            field.templateOptions.options = self._engineOptionsToFormly(_.filter(newMetricData.options, function (option) {
                return _.contains(newMetricData.availableOptions, option.value);
            }));
        };

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
            field.data.reloadInPlace = true;
            field.data.reloadHandler = optionsReloadHandler;

            return field;
        }));

        this.register(new DocumentField({ visualClass: 'multiSelect', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelect';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);
            field.data.reloadInPlace = true;
            field.data.reloadHandler = optionsReloadHandler;

            field.data.isDisabled = function () {
                return field.data.form.disabled || metric.nooverwrite;
            };

            return field;
        }));

        this.register(new DocumentField({ visualClass: '@verticalMultiSelect', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelectVertical';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);
            field.data.reloadInPlace = true;
            field.data.reloadHandler = optionsReloadHandler;

            field.data.isDisabled = function () {
                return field.data.form.disabled || metric.nooverwrite;
            };

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

            field.data.isDisabled = function () {
                return field.data.form.disabled || metric.nooverwrite;
            };

            field.data.isActive = function (element) {
                return _.contains(field.model[field.key], element);
            };

            return field;
        }));

        this.register(new DocumentField('radioGroup', function (field, metric, ctx) {

            field.type = 'radioGroup';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            field.data.reloadInPlace = true;
            field.data.reloadHandler = optionsReloadHandler;

            return field;
        }));

        this.register(new DocumentField('radio', function (field, metric, ctx) {
            field.type = 'radio';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);
            field.data.reloadInPlace = true;
            field.data.reloadHandler = optionsReloadHandler;

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
            field.data.onChange = DocumentField.onChange;
            field.data.onReload = DocumentField.onReload;

            // field.data.onValidate = DocumentField.onValidate;
            // field.data.onValidateSelf = DocumentField.onValidateSelf;

            return {
                data: field.data,
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' + 'options="options.templateOptions.options" metric="options.data.metric" errors="fc.$error" ' + 'class="' + metric.visualClass.join(' ') + '" ' + 'ng-disabled="options.data.form.disabled" ' + 'formly-options="options" ' + 'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: { ngModel: ctx.document, options: ctx.options
                    // expressionProperties: {'templateOptions.disabled': false}
                } };
        }));

        this.register(new DocumentField({ inputType: 'QUERIED_LIST' }, function (field, metric, ctx) {
            /**
             * queries don't have real values, but something other than `null` must be provided
             * for validators in the backend to work
             */
            ctx.document.metrics[metric.id] = metric.queryId;

            field = {
                data: _.extend(field.data, { queries: ctx.options.document.queries[metric.id], IMMEDIATE_CREATE: $engine.IMMEDIATE_CREATE }),
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" ' + 'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + ' list-caption="\'' + metric.label + '\'"' + ' metric-id="' + metric.id + '"' + ' immediate-create="options.data.queries.immediateCreate || (options.data.queries.immediateCreate !== false && options.data.IMMEDIATE_CREATE === true)"' + ' single-document="options.data.queries.singleDocument || ' + (_.find(metric.visualClass, function (visualClass) {
                    return visualClass == '@singleDocument';
                }) != null ? true : false) + '"' + ' columns="options.data.queries.columns"' + '' + ' formly-options="options" ' + ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '" on-select-behavior="' + metric.onSelectBehavior + '"></engine-document-list>',
                templateOptions: {
                    options: $engine.getOptions(metric.modelId),
                    document: ctx.document //, expressionProperties: {'templateOptions.disabled': 'false'}
                } };

            return field;
        }));

        this.register(new DocumentField({ inputType: 'LINK' }, function (field, metric, ctx) {
            return {
                data: field.data,
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<engine-link><a class="' + metric.visualClass.join(' ') + '" href="' + metric.url + '" target="' + metric.target + '">"' + metric.label + '"</a></engine-link>',
                templateOptions: { ngModel: ctx.document, options: ctx.options }
            };
        }));
    };

    return new DocumentFieldFactory();
}]).factory('DocumentField', ["ConditionBuilder", "$engLog", "$q", function (ConditionBuilder, $engLog, $q) {
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
        var promise = $q.when();

        _.forEach($scope.options.data.onChangeHandlers, function (callback) {
            promise = promise.then(function () {
                return callback($viewValue, $modelValue, $scope);
            });
        });

        return promise;
    };
    DocumentField.validate = function ($viewValue, $modelValue, $scope) {};
    DocumentField.onReload = function ($viewValue, $modelValue, $scope) {
        //emit reload request for dom element which wants to listen (eg. document)
        $scope.$emit('document.form.requestReload');
        return $scope.options.data.form._onReload();
    };

    DocumentField.onSave = function ($viewValue, $modelValue, $scope) {
        return $scope.$emit('engine.common.document.requestSave').savePromise;
    };

    DocumentField.onValidateSelf = function ($viewValue, $modelValue, $scope) {
        var metricToValidate = {};
        metricToValidate[$scope.options.data.metric.id] = $viewValue == null ? null : $viewValue;
        $scope.options.data.form.validator.validateMetrics($modelValue, metricToValidate);
    };
    DocumentField.onValidate = function ($viewValue, $modelValue, $scope) {
        //emit validate request for dom element which wants to listen (eg. document)
        $scope.$emit('document.form.requestValidate');

        return $scope.options.data.form.validateCurrentStep(false);
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
                onChangeHandlers: [],
                reloadInPlace: false,
                reloadHandler: function reloadHandler(newMetric, field) {}
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
                    return metric.nooverwrite || scope.options.data.form.disabled; //|| !(scope.options.data.metric.editable == true); //enable it when it's supported by the backend
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

        if (metric.saveOnChange === true) {
            formlyField.data.onChangeHandlers.push(DocumentField.onSave);
        }

        if (metric.reloadOnChange === true) {
            formlyField.data.onChangeHandlers.push(DocumentField.onReload);
        }

        //if validateOnChange is true all other metrics should be validated after this one changes
        if (metric.validateOnChange === true) {
            if (['TEXT', 'TEXTAREA', 'NUMBER', 'FLOAT', 'INTEGER'].indexOf(metric.inputType) !== -1) {
                formlyField.templateOptions.onBlur = DocumentField.onValidate;
            } else {
                formlyField.data.onChangeHandlers.push(DocumentField.onValidate);
            }
        }
        //otherwise only this metrics
        else {
                if (['TEXT', 'TEXTAREA', 'NUMBER', 'FLOAT', 'INTEGER'].indexOf(metric.inputType) !== -1) {
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
}]).directive('numberConvert', function () {
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
}).directive('numberFormat', ["$translate", function ($translate) {
    return {
        require: 'ngModel',
        link: function link(scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$formatters.push(function (value) {
                var number = Number(value);

                if (!_.isNaN(number) && (scope.options.data.form.disabled || scope.options.data.metric.nooverwrite)) {
                    return number.toLocaleString($translate.use());
                } else {
                    return value;
                }
            });
        }
    };
}]);

'use strict';

angular.module('engine.document').factory('DocumentForm', ["engineMetricCategories", "engineMetric", "DocumentFieldFactory", "$q", "DocumentCategoryFactory", "$engineApiCheck", "$engLog", "DocumentValidator", function (engineMetricCategories, engineMetric, DocumentFieldFactory, $q, DocumentCategoryFactory, $engineApiCheck, $engLog, DocumentValidator) {
    var _apiCheck = $engineApiCheck;

    /**
     *
     * @param documentScope - scope of the document component (all events will be called on this scope with $broadcast)
     * @constructor
     */
    function DocumentForm(documentScope) {
        assert(documentScope != null);
        this.documentScope = documentScope;
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.parentDocumentId = documentScope.$ctrl.parentDocument ? documentScope.$ctrl.parentDocument.id || documentScope.$ctrl.parentDocument : undefined;
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
        this.$validationReadyDeferred = $q.defer();
        this.$validationReady = this.$validationReadyDeferred.promise;
        this.$ready = $q(function (resolve, reject) {
            self.markInit = resolve;
        }).then(function () {
            return self._loadMetricCategories();
        });

        this.bindings = [];

        this.bindings.push(this.documentScope.$on('engine.common.save.after', function (event) {
            self.formlyState.$setPristine();
        }));

        this.bindings.push(this.documentScope.$on('engine.common.navigateAway', function (event) {
            if (self.formlyState.$dirty) {
                event.preventDefault();
            }
        }));
    }

    DocumentForm.prototype.$destroy = function $destroy() {
        _.each(this.bindings, function (binding) {
            binding();
        });
    };

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
            $engLog.error('DocumentForm._reloadForm called without waiting for DocumentForm.loadForm');
            throw new Error();
        }
        this.documentScope.$broadcast('document.form.reloadingMetrics.before');

        var options = { documentJSON: this.document };
        if (!!self.parentDocumentId) {
            options.otherDocumentId = self.parentDocumentId;
        }

        /**
         * Return promise to the engineMetric loading
         */
        return engineMetric(options, function (metricList) {
            $engLog.log('New loaded metrics: ', metricList);
            var metricDict = _.indexBy(metricList, 'id');

            var newMetrics = _.reject(metricList, function (metric) {
                return metric.id in self.metricDict;
            });

            $engLog.log('New metrics: ', newMetrics);

            //remove metrics, which are not present in metricList
            _.forEach(self.metricList, function (metric) {
                if (!(metric.id in metricDict)) {

                    var metricIndex = _.findIndex(self.categoriesDict[metric.categoryId].fieldGroup, function (field) {
                        return field.data.id === metric.id;
                    });
                    if (metricIndex === -1) return;

                    // also remove fields from form
                    self.fieldList.splice(self.fieldList.findIndex(function (field) {
                        return field.key === metric.id;
                    }), 1);

                    $engLog.log('Metric to remove: ', metric, 'index: ', metricIndex);

                    delete self.steps.getCurrentStep().fields[metric.id];
                    delete self.metricDict[metric.id];
                    self.categoriesDict[metric.categoryId].fieldGroup.splice(metricIndex, 1);
                    delete self.document.metrics[metric.id];
                }
            });

            self.setDefaultMetricValues(newMetrics);

            //add new metrics to the form, with respect to position
            _.forEach(newMetrics, function (newMetric) {
                $engLog.log(self.categoriesDict[newMetric.categoryId]);
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
                        $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
                        continue;
                    }
                    if (step.metrics[field.data.categoryId] === undefined) continue;

                    step.fields[field.data.id] = field;
                    break;
                }
            });

            //reload metrics that can be reload in place (options, selects, etc)
            _.forEach(_.filter(self.fieldList, function (metric) {
                return metric.data.reloadInPlace === true;
            }), function (metric) {
                var newMetricData = _.find(metricList, function (metricData) {
                    return metricData.id === metric.key;
                });
                if (newMetricData == null) {
                    $engLog.error('newMetricData with id ' + metric.key + ' has not been found in ', metricList);
                    return;
                }
                metric.data.reloadHandler(newMetricData, metric);
            });

            // Notify document and every element under it that metrics have been reladed
            self.documentScope.$broadcast('document.form.reloadingMetrics.after');
        }).$promise;
    };

    DocumentForm.prototype.connectFieldToStep = function () {
        var self = this;
        var _categoriesToPostProcess = [];

        self.setFormlyState(self.formlyState);

        _.forEach(self.steps.getSteps(), function (step) {
            reconnectFieldsToStep(step, step.metricCategories);
        });

        _.forEach(self.steps.getSteps(), function (step) {
            _.forEach(self.fieldList, function (field) {

                if (self.categoriesDict[field.data.categoryId] === undefined) {
                    $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
                    return;
                }
                if (step.metrics[field.data.categoryId] === undefined) return;
                if (_.contains(self.fields, field)) self.fields = _.without(self.fields, field);

                step.fields[field.data.id] = field;
            });
        });

        // process categories
        _.forEach(_categoriesToPostProcess, function (entry) {
            return entry.data.$process();
        });

        function reconnectFieldsToStep(step, metricCategories) {
            _.forEach(metricCategories, function (metricCategory) {
                // metricCategory.children can only be a category, not field (metric)
                if (metricCategory.children) reconnectFieldsToStep(step, metricCategory.children);
                // formMetricCategory.fieldGroup =
                var category = self.categoriesDict[metricCategory.id];
                if (category == null) return;

                if (_.isFunction(category.data.$process)) _categoriesToPostProcess.push(category);

                step.metrics[metricCategory.id] = category;
            });
        }
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
            // model must be rebound for every field in form
            _.forEach(this.fieldList, function (field) {
                field.model = document.metrics;
                if (field.data.prepareValue) document.metrics[field.key] = field.data.prepareValue(document.metrics[field.key]);
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
    DocumentForm.prototype.init = function init(document, options, steps, actions, formlyState, formlyOptions) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object), _apiCheck.object, _apiCheck.object], arguments);

        this._setDocument(document);
        this._setOptions(options);
        this._setSteps(steps);
        this._setActions(actions);
        this.setFormlyState(formlyState);
        this.formlyOptions = formlyOptions;
        this.markInit();
    };

    DocumentForm.prototype.setValidator = function (validator) {
        this.validator = validator;
        this.$validationReadyDeferred.resolve();
    };

    DocumentForm.prototype.setFormlyState = function (formlyState) {
        this.formlyState = formlyState;
        if (this.formlyState != null) {
            this.setValidator(new DocumentValidator(this.document, this.parentDocumentId, this.steps, this.formlyState));
        }
    };

    DocumentForm.prototype.setFormlyOptions = function (formlyOptions) {
        this.formlyOptions = formlyOptions;
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
        $engLog.debug('current fields to display in form', this.currentFormlyFields);
    };

    DocumentForm.prototype._assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document' + message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions' + message);
        assert(this.steps != null, 'DocumentForm.steps' + message);
        assert(this.actions != null, 'DocumentForm.actions' + message);
    };

    DocumentForm.prototype._onReload = function onReload() {
        $engLog.debug('Form reload called');
        return this._reloadForm();
    };

    DocumentForm.prototype._makeForm = function makeForm() {
        var self = this;

        $engLog.log('DocumentForm._makeForm', self.fieldList);
        self._assertInit();

        assert(self.metricList.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetrics');
        assert(self.metricCategories.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetricCategories');

        var _categoriesToPostProcess = [];

        _.forEach(self.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory(step);
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
        });
        _.forEach(self.steps.getSteps(), function (step) {
            connectFields(step);
        });

        postprocess();

        reorderFields();

        if (self.formlyState != null) self.setValidator(new DocumentValidator(self.document, self.parentDocumentId, self.steps, self.formlyState));

        $engLog.debug('DocumentForm form structure', self.formStructure);

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
                    $engLog.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
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

        function reorderFields() {
            _.forEach(self.categoriesDict, function (metricCategory) {
                metricCategory.fieldGroup = _.sortBy(metricCategory.fieldGroup, function (field) {
                    return field.data.position;
                });
            });
        }
    };

    DocumentForm.prototype.setDefaultMetricValues = function (metrics) {
        var self = this;
        metrics.forEach(function (metric) {
            if (!!metric.defaultValue && !self.document.metrics[metric.id]) {
                self.document.metrics[metric.id] = metric.defaultValue;
            }
        });
    };

    DocumentForm.prototype._updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, { document: this.document, options: this.documentOptions, documentForm: this });
    };

    DocumentForm.prototype._loadMetrics = function loadMetrics() {
        var self = this;
        var options = { documentJSON: this.document };
        if (!!self.parentDocumentId) {
            options.otherDocumentId = self.parentDocumentId;
        }

        return engineMetric(options, function (metricList) {
            self.metricList = metricList;
            self.metricDict = _.indexBy(self.metricList, 'id');
            self.setDefaultMetricValues(self.metricList);
            self._updateFields(self.metricList);
        }).$promise;
    };

    DocumentForm.prototype.prepareMetrics = function () {
        $engLog.debug(this);
    };

    DocumentForm.prototype.validateCurrentStep = function validateCurrentStep(fillNull) {
        var self = this;
        return this.$validationReady.then(function () {
            return self.validator.validate(self.currentStep, fillNull);
        });
    };

    DocumentForm.prototype.validate = function validate(step, fillNull) {
        var self = this;
        return this.$validationReady.then(function () {
            return self.validator.validate(step, fillNull);
        });
    };

    return DocumentForm;
}]);

'use strict';

angular.module('engine.document').factory('StepList', ["Step", "$q", "engineMetricCategories", "$engineApiCheck", "$engLog", "$parse", function (Step, $q, engineMetricCategories, $engineApiCheck, $engLog, $parse) {
    var _ac = $engineApiCheck;

    function StepList(documentOptionSteps) {
        var self = this;

        this.documentSteps = documentOptionSteps;
        this.steps = [];
        this.singleStep = false;
        this._$readyDeferred = $q.defer();
        this.$ready = this._$readyDeferred.promise;
        this.currentStep = null;
    }

    StepList.prototype.setDocument = function setDocument(document) {
        var self = this;
        this.document = document;

        if (this.steps != []) this.steps = [];

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

        engineMetricCategories.then(function (metricCategories) {
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
                        $engLog.error(step.categories, ' not in ', metricCategories.metrics, '. Make sure that metric category registered in document.steps exists');
                        throw new Error();
                    }

                    self.steps.push(new Step(metricCategories.metrics[step.categories].children, step, index));
                }
            });

            self._$readyDeferred.resolve();
        }, function (error) {
            self._$readyDeferred.reject(error);
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
}]).factory('Step', ["$engineApiCheck", function ($engineApiCheck) {

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
}]);

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
.factory('DocumentValidator', ["engineDocument", "$engineApiCheck", "$engLog", "Step", function (engineDocument, $engineApiCheck, $engLog, Step) {
    function DocumentValidator(document, parentDocumentId, stepList, formStructure) {
        this.document = document;
        this.parentDocumentId = parentDocumentId;
        this.stepList = stepList;
        this.formStructure = formStructure;
    }

    DocumentValidator.prototype.setStepsState = function setStepsState(steps, state) {
        $engineApiCheck([$engineApiCheck.arrayOf($engineApiCheck.instanceOf(Step)), $engineApiCheck.oneOf(Step.validStates)], arguments);
        _.forEach(steps, function (step) {
            step.setState(state);
        });
    };

    DocumentValidator.prototype.cleanDocumentMetrics = function makeDocumentForValidation() {
        var documentForValidation = _.omit(this.document, ['metrics', '$ext']);
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
        return engineDocument.validate({
            document: documentForValidation,
            otherDocumentId: self.parentDocumentId
        }).$promise.then(function (validatedMetrics) {
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

        $engLog.debug('DocumentValidator.validate called');

        var stepsToValidate = [];

        if (step == null) stepsToValidate = this.stepList.getSteps();else {
            if (!_.isArray(step)) step = [step];

            _.forEach(step, function (stepIndex) {
                stepsToValidate.push(self.stepList.getStep(stepIndex));
            });
        }

        this.setStepsState(stepsToValidate, Step.STATE_LOADING);

        var documentForValidation = this.makeDocumentForValidation(this.document, stepsToValidate, fillNull);

        return engineDocument.validate({
            document: documentForValidation,
            otherDocumentId: self.parentDocumentId
        }).$promise.then(function (validationData) {
            $engLog.debug(validationData);

            var _validatedMetrics = _.indexBy(validationData.results, 'metricId');

            _.forEach(stepsToValidate, function (step) {
                _.forEach(step.fields, function (field, fieldId) {
                    if (fieldId in _validatedMetrics) {
                        if (_validatedMetrics[fieldId].valid == false) step.setState(Step.STATE_INVALID);

                        self.setMetricValidation(field, _validatedMetrics);
                    }
                });

                $engLog.debug(self.formStructure.$error);

                if (step.getState() == Step.STATE_LOADING) step.setState(Step.STATE_VALID);
            });

            return validationData.valid;
        });

        //
        // engineDocument.validate($scope.document, function (data) {
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
}]);

'use strict';

angular.module('engine.steps').component('engineSteps', {
    templateUrl: '/src/document/steps.tpl.html',
    controller: ["$timeout", function controller($timeout) {
        var self = this;

        this.changeStep = function (newStep) {
            if (this.processing === true) return;
            self.step = newStep;
        };
    }],
    bindings: {
        ngModel: '=',
        step: '=',
        stepList: '=',
        options: '=',
        processing: '<'
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
angular.module('engine').controller('engineMainCtrl', ["$rootScope", "engineResourceLoader", function ($rootScope, engineResourceLoader) {
    $rootScope.resourcesLoaded = false;

    if (engineResourceLoader.resources == 0) $rootScope.resourcesLoaded = true;else $rootScope.$on('engine.common.resourcesLoaded', function () {
        $rootScope.resourcesLoaded = true;
    });
}]);

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Here are placed components which should be exposed to the library user
 */

var app = angular.module('engine');

app.factory('engActionButton', ["$timeout", "DocumentActionList", "$rootScope", function ($timeout, DocumentActionList, $rootScope) {
    var ActionButton = function () {
        function ActionButton(actionId, requestJson) {
            var label = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            _classCallCheck(this, ActionButton);

            this.actionId = actionId;
            this.requestJson = requestJson;
            this.callback = null;
            this.label = label;
            this._$scope = $rootScope.$new(true);
            this._actionList = null;

            this.refresh();
        }

        _createClass(ActionButton, [{
            key: 'refresh',
            value: function refresh() {
                var _this = this;

                this.callback = null;
                this._actionList = new DocumentActionList(null, this.requestJson, null, this._$scope);

                this._actionList.$ready.then(function () {
                    var action = _.find(_this._actionList.actions, function (action) {
                        return action.actionId === _this.actionId;
                    });

                    if (action) {
                        _this.callback = function () {
                            return action.call();
                        };
                        _this.label = _this.label || action.label;
                    }
                });
            }
        }]);

        return ActionButton;
    }();

    return ActionButton;
}]);

'use strict';

angular.module('engine').provider('$engLog', function () {
    var _logLevel = 'debug';
    var _provider = this;
    this.setLogLevel = function (level) {
        _logLevel = level;
    };

    var _logLevels = ['debug', 'log', 'info', 'warning', 'error', null];

    function canLog(level) {
        return _logLevels.indexOf(level) >= _logLevels.indexOf(_logLevel);
    }

    this.$get = ["$log", function ($log) {
        return new function () {
            this.setLogLevel = _provider.setLogLevel;

            this.debug = function () {

                if (canLog('debug')) $log.debug(arguments);
            };
            this.info = function () {

                if (canLog('info')) $log.info(arguments);
            };
            this.log = function () {

                if (canLog('log')) $log.log(arguments);
            };
            this.warn = function () {

                if (canLog('warning')) $log.warn(arguments);
            };
            this.error = function () {

                if (canLog('error')) $log.error(arguments);
                throw new Error(arguments);
            };
            this.warning = this.warn;
        }();
    }];
}).provider('$engineConfig', function () {
    var self = this;
    var _baseUrl = '';
    var _loggingLevel = 'debug';
    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    this.setLoggingLevel = function (level) {
        _loggingLevel = level;
    };

    this.$get = function () {
        return {
            baseUrl: _baseUrl,
            setBaseUrl: self.setBaseUrl
        };
    };
}).provider('$engineApiCheck', ["productionMode", function (productionMode) {
    var self = this;
    this.apiCheck = apiCheck({
        output: {
            prefix: 'angular-engine'
        },
        // From version 0.7.12+ api check has been depreciated
        // it will be removed in the future
        // disabled: productionMode
        disabled: true
    });

    this.$get = function () {
        return self.apiCheck;
    };
}]).service('engineResourceLoader', ["$rootScope", "$engLog", function ($rootScope, $engLog) {
    var _resourcesCount = 0;

    return {
        register: function register(promise) {
            $engLog.debug('registered resource', promise);
            ++_resourcesCount;
            promise.then(function () {
                --_resourcesCount;
                if (_resourcesCount == 0) $rootScope.$broadcast('engine.common.resourcesLoaded');
            });
        },
        resources: _resourcesCount
    };
}])
/**
 * @ngdoc service
 * @name engine.provider:$engineProvider
 *
 * @description
 * Basic means of configuration
 */
.provider('$engine', ["$routeProvider", "$engineApiCheckProvider", "$engineFormlyProvider", "$injector", function ($routeProvider, $engineApiCheckProvider, $engineFormlyProvider, $injector) {
    var _this = this;

    var self = this;

    var dashboards = [];
    var dashboards_d = {};
    var documents = [];
    var documents_d = {};
    var QUERY_PAGE_SIZE = 50;
    var GLOBAL_CSS = '';
    var MODAL_CONTAINER = 'body';
    var RESPONSIVE = true;
    var DOCUMENT_MODEL_KEY = 'documentType';
    var IMMEDIATE_CREATE = false;

    var _apiCheck = $engineApiCheckProvider.apiCheck;
    _apiCheck.columnOptions = _apiCheck.arrayOf(_apiCheck.shape({
        name: _apiCheck.string,
        caption: _apiCheck.string.optional,
        style: _apiCheck.string.optional,
        type: _apiCheck.string.optional
    })).optional;
    _apiCheck.documentOptions = _apiCheck.shape({
        documentJSON: _apiCheck.object,
        immediateCreate: _apiCheck.bool.optional,
        name: _apiCheck.string,
        list: _apiCheck.shape({
            caption: _apiCheck.string,
            templateUrl: _apiCheck.string,
            createButtonLabel: _apiCheck.string.optional,
            customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({
                'label': _apiCheck.string,
                'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string])
            })).optional
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.object),
            showValidateButton: _apiCheck.bool.optional,
            caption: _apiCheck.string.optional,
            queries: _apiCheck.object.optional,
            sidebarAddons: _apiCheck.arrayOf(_apiCheck.shape({
                'component': _apiCheck.string,
                'position': _apiCheck.object.optional,
                'ctx': _apiCheck.string.optional
            })).optional
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

    this.confirmModal = 'engConfirm';

    this.registerConfirmModal = function (confirmModalMethod) {
        _this.confirmModal = confirmModalMethod;
    };

    function prepareDocumentOptions(options) {
        if (options.list.customButtons == null) options.list.customButtons = [];

        if (!_.isArray(options.list.customButtons)) options.list.customButtons = [options.list.customButtons];

        if (options.document.sidebarAddons == null) options.document.sidebarAddons = [];

        options.document.sidebarAddons = options.document.sidebarAddons.map(function (addon) {
            return {
                position: addon.position || 'middle',
                caption: addon.caption || '',
                condition: addon.condition || function (document) {
                    return true;
                },
                component: addon.component,
                ctx: addon.ctx || {}
            };
        });
    }

    self._disableOnReload = false;

    this.disableOnReload = function () {
        self._disableOnReload = true;
    };

    this.enableOnReload = function () {
        self._disableOnReload = false;
    };

    this.setQueryPageSize = function (queryPageSize) {
        QUERY_PAGE_SIZE = queryPageSize;
    };

    this.setGlobalCSS = function (css) {
        GLOBAL_CSS = css;
    };
    this.setModalContainer = function (containerSelector) {
        MODAL_CONTAINER = containerSelector;
    };

    this.setResponsive = function (responsive) {
        RESPONSIVE = responsive;
    };

    this.setDocumentModelKey = function (key) {
        DOCUMENT_MODEL_KEY = key;
    };

    this.setImmediateCreate = function (immediate) {
        IMMEDIATE_CREATE = immediate;
    };

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
            immediateCreate: _apiCheck.bool.optional,
            customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({
                'label': _apiCheck.string,
                'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string])
            })).optional
        }), _apiCheck.shape({
            templateUrl: _apiCheck.string,
            caption: _apiCheck.string.optional
        }))], [url, queries, options]);

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
        dashboards_d[url] = { dashboard: true };
        dashboards.push({ 'url': url, 'queries': queries, 'options': options });
    };

    function _checkDocumentOptions(options) {
        if (options.document != null) {
            if (options.document.queries != null) _.each(options.document.queries, function (metric) {
                _apiCheck.throw([_apiCheck.shape({
                    'columns': _apiCheck.columnOptions,
                    'singleDocument': _apiCheck.bool.optional
                })], [metric]);
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
     *                                {name: 'beamlineChoice', filterKey: 'beamlineChoiceB',
     *                                 filterChoices: [{id: 'draft', caption: 'Draft'}]},
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
     *      * **filterKey** {String} this field will be used instead of name when constructing filtering query for the list
     *
     *      * **filterChoices** {Array} array of: {id: {String}, caption: {String}} if specified in table filter
     *        selectbox with provided options will be shown. Caption parameter will be translated
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
     *    * **sidebarAddons** {Array}, *Optional*, default `[]`. Specifies additional custom components which will
     *    be displayed in the sidebar. Custom components can be specified using following fields:
     *      * **caption** {String}, *Optional* Displayed caption, will be translated
     *      * **component** {String}, Component which will be injected must be in `dasherized-notation`
     *      * **condition** {Function}, *Optional* function taking as an argument document and returning boolean,
     *      if returned value is false this particular addon will not be displayed
     *      * **ctx** {Object}, *Optional* context object which will be passed to the addon
     *
     *      Component which will be injected should have 2 bindings specified: ctx: '=' and document: '='
     *
     *    Example:
     *      [{component: 'chat-sidebar-addon', ctx: {debug: true}, caption: 'Chat', condition: document => true]
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

    var _visibleDocumentFields = [{ name: 'id', caption: 'ID', type: 'link', style: 'monospace' }, {
        name: 'name',
        caption: 'Name'
    }];

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
    this.$get = ["$engineFormly", "engineDocument", "$rootScope", "$engLog", "engineQuery", "$injector", function ($engineFormly, engineDocument, $rootScope, $engLog, engineQuery, $injector) {
        var _engineProvider = self;

        return new function () {
            var self = this;
            this.QUERY_PAGE_SIZE = QUERY_PAGE_SIZE;
            this.GLOBAL_CSS = GLOBAL_CSS;
            this.MODAL_CONTAINER = MODAL_CONTAINER;
            this.RESPONSIVE = RESPONSIVE;
            this.DOCUMENT_MODEL_KEY = DOCUMENT_MODEL_KEY;
            this.IMMEDIATE_CREATE = IMMEDIATE_CREATE;
            this.apiCheck = _apiCheck;
            this.formly = $engineFormly;
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;

            this.confirm = function (title, content) {
                if (_.isString(_engineProvider.confirmModal)) {
                    return $injector.invoke([_engineProvider.confirmModal, function (_confirmModalMethod) {
                        return _confirmModalMethod(title, content);
                    }]);
                } else return _engineProvider.confirmModal(title, content);
            };

            /**
             * true if user disabled onReloadFunction during configuration phase
             * false otherwise
             */
            this.disableOnReload = _engineProvider._disableOnReload;

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
                var r = dashboards_d[documentModelId];
                if (r != null) return r;
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
                    if (_engineProvider._debug) $engLog.error(errorEvent);
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
    }];
}]);

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
}).factory('$engResource', ["$engineConfig", function ($engineConfig) {

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
}]).service('engineQuery', ["$engineConfig", "$engLog", "$engineApiCheck", "$http", "EngineInterceptor", "$q", function ($engineConfig, $engLog, $engineApiCheck, $http, EngineInterceptor, $q) {

    var request_processors = [];
    var response_processors = [];

    return {
        request_processors: request_processors,
        response_processors: response_processors,
        get: function get(query, parentDocument, callback, errorCallback, skip, limit, sort, filters) {
            $engineApiCheck.throw([$engineApiCheck.string, $engineApiCheck.object.optional, $engineApiCheck.func.optional, $engineApiCheck.func.optional, $engineApiCheck.number.optional, $engineApiCheck.number.optional, $engineApiCheck.array.optional, $engineApiCheck.any.optional], arguments);

            var parentDocumentId = parentDocument != null && parentDocument.id != null ? parentDocument.id : '';

            var res = [];
            res.$resolved = 0;

            $engLog.debug('searching', filters);

            var q = $http.post($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=' + query + '&attachAvailableActions=true&otherDocumentId=' + parentDocumentId + '&documentId=' + parentDocumentId + (!_.isUndefined(skip) && !_.isUndefined(limit) ? '&skip=' + skip + '&limit=' + limit : '') + (!_.isUndefined(sort) && !_.isEmpty(sort) ? '&sort=' + sort.join(',') : '') + (!_.isUndefined(filters) && !_.isEmpty(filters) ? '&constraints=' + btoa(angular.toJson(filters)) : '')).then(function (response) {
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
}]).service('engineDashboard', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {

    var _queryCategory = $resource($engineConfig.baseUrl + '/query?queryCategoryId=:queryCategoryId', { queryCategoryId: '@queryCategoryId' }, { get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true } });

    return {
        fromList: function fromList(queryIds) {
            $engineApiCheck([$engineApiCheck.arrayOf($engineApiCheck.string)], arguments);
        },
        fromCategory: function fromCategory(queryCategoryId, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.string], arguments);

            return _queryCategory.get({ 'queryCategoryId': queryCategoryId }, callback, errorCallback);
        }
    };
}]).service('engineMetric', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    function metricSorter(data, headersGetter, status) {
        var data = EngineInterceptor.response(data, headersGetter, status);
        data = _.sortBy(data, 'position');

        return data;
    }

    var _query = $resource($engineConfig.baseUrl + '/metrics?documentId=:id', { id: '@id' }, {
        post: { method: 'POST', transformResponse: metricSorter, isArray: true }
    });

    return function (options, callback, errorCallback) {
        $engineApiCheck([$engineApiCheck.shape({
            documentJSON: $engineApiCheck.object,
            otherDocumentId: $engineApiCheck.string.optional
        }), $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

        var params = {};
        if (!!options.otherDocumentId) {
            params.otherDocumentId = options.otherDocumentId;
        }

        return _query.post(params, _.omit(options.documentJSON, '$ext'), callback, errorCallback);
    };
}]).service('engineMetricCategories', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", "$engLog", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $engLog) {
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
        $engLog.debug(_metricCategories);
        return {
            $resolved: true,
            metrics: _metricCategories,
            getNames: function getNames(metricCategoryId) {
                if (!(metricCategoryId in _names)) $engLog.error('You tried to access metricCategory which does not exist, check whether metric references existsing metric category. Wrong key: ' + metricCategoryId);
                return _names[metricCategoryId];
            }
        };
    });

    return _promise;
}]).service('engineActionsAvailable', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId', { documentId: '@id' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return {
        forDocument: function forDocument(document, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

            return _action.post({ documentId: document.id }, document, callback, errorCallback);
        },
        forType: function forType(documentJson, parentDocumentId, callback, errorCallback) {
            return _action.post({ otherDocumentId: parentDocumentId }, documentJson, callback, errorCallback);
        }
    };
}]).service('engineAction', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId&otherDocumentId=:otherDocumentId', {
        actionId: '@actionId',
        documentId: '@documentId',
        otherDocumentId: '@otherDocumentId'
    }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    return function (actionId, document, callback, errorCallback, parentDocumentId, documentId) {
        $engineApiCheck([$engineApiCheck.string, $engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

        return _action.post({
            actionId: actionId,
            documentId: documentId || document.id,
            otherDocumentId: parentDocumentId
        }, document, callback, errorCallback);
    };
}]).service('engineDocument', ["$engineConfig", "$engineApiCheck", "$resource", "EngineInterceptor", "$http", function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $http) {
    var _document = $resource('', { documentId: '@documentId' }, {
        getDocument: {
            url: $engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true',
            method: 'POST', transformResponse: EngineInterceptor.response
        },
        validate: {
            url: $engineConfig.baseUrl + '/validate-metric-values' + '?documentId=:documentId',
            method: 'POST', transformResponse: EngineInterceptor.response
        }
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
         * @param options
         * @param callback
         * @param errorCallback
         * @returns {*|{url, method, transformResponse}}
         */
        validate: function validate(options, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.shape({
                document: $engineApiCheck.object,
                otherDocumentId: $engineApiCheck.string.optional
            }), $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

            return _document.validate({
                documentId: options.document.id,
                otherDocumentId: options.otherDocumentId
            }, options.document, callback, errorCallback);
        }
    };
}]).service('EngineInterceptor', ["$engLog", function ($engLog) {

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
            $engLog.log('parsing request');
            if (site && site.id) {
                data.site = site.id;
                data.siteName = site.value.provider_id;
            }

            return angular.toJson(data);
        }
    };
}]).service('MetricToFormly', function () {
    return function (data, headersGetter, status) {};
});

'use strict';

var ENGINE_COMPILATION_DATE = '2018-04-04T13:24:10.010Z';
var ENGINE_VERSION = '0.8.14';
var ENGINE_BACKEND_VERSION = '1.2.9';

var ENGINE_ENV = 'development';
var ENGINE_PRODUCTION_MODE = ENGINE_ENV == 'production';

angular.module('engine').constant('version', ENGINE_VERSION);
angular.module('engine').constant('backendVersion', ENGINE_BACKEND_VERSION);
angular.module('engine').constant('productionMode', ENGINE_PRODUCTION_MODE);

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

angular.module('engine.formly').run(["formlyConfig", "$engineFormly", "$engine", "$engLog", function (formlyConfig, $engineFormly, $engine, $engLog) {
    var attributes = ['date-disabled', 'custom-class', 'show-weeks', 'starting-day', 'init-date', 'min-mode', 'max-mode', 'format-day', 'format-month', 'format-year', 'format-day-header', 'format-day-title', 'format-month-title', 'year-range', 'shortcut-propagation', 'datepicker-popup', 'show-button-bar', 'current-text', 'clear-text', 'close-text', 'close-on-date-selection', 'datepicker-append-to-body'];

    var bindings = ['datepicker-mode', 'min-date', 'max-date'];

    var ngModelAttrs = {};

    angular.forEach(attributes, function (attr) {
        ngModelAttrs[camelize(attr)] = { attribute: attr };
    });

    angular.forEach(bindings, function (binding) {
        ngModelAttrs[camelize(binding)] = { bound: binding };
    });

    $engLog.log(ngModelAttrs);

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
                // $event.preventDefault();
                // $event.stopPropagation();
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
}]);

'use strict';

angular.module('engine.formly').run(["formlyConfig", "$engineFormly", "$engineApiCheck", function (formlyConfig, $engineFormly, $engineApiCheck) {
    var _apiCheck = $engineApiCheck;

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
            noFormControl: false,
            templateOptions: {
                className: 'radioGroup'
            }
        }
        // apiCheck: _apiCheck({
        // templateOptions: {
        //     options: _apiCheck.arrayOf(_apiCheck.object),
        //     labelProp: _apiCheck.string.optional,
        //     valueProp: _apiCheck.string.optional
        // }
        // })
    });

    formlyConfig.setType({
        name: 'radioGroup',
        templateUrl: $engineFormly.templateUrls['radioGroup'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            noFormControl: false,
            templateOptions: {
                className: 'radioGroup'
            }
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
        // apiCheck: check => ({
        // templateOptions: {
        //     options: check.arrayOf(check.object),
        //     optionsAttr: check.string.optional,
        //     labelProp: check.string.optional,
        //     valueProp: check.string.optional,
        //     groupProp: check.string.optional
        // }
        // })
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
}]);

'use strict';

angular.module('engine.formly').config(["$engineFormlyProvider", function ($engineFormlyProvider) {
    $engineFormlyProvider.setWrapperTemplateUrl('row', '/src/formly/wrappers/templates/row.tpl.html');
}]).run(["formlyConfig", "$engineFormly", function (formlyConfig, $engineFormly) {
    formlyConfig.setWrapper({
        name: 'row',
        templateUrl: $engineFormly.wrapperUrls['row']
    });
}]);

'use strict';

angular.module('engine.formly').run(["formlyConfig", "$engineFormly", function (formlyConfig, $engineFormly) {

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
}]).controller('engineFormlyWrapperCtrl', ["$scope", "$engLog", function ($scope, $engLog) {
    $scope.$on('document.form.reloadingMetrics.before', function (event) {
        $engLog.debug('document.form.reloadingMetrics.before');
        $scope.loading = true;
    });
    $scope.$on('document.form.reloadingMetrics.after', function (event) {
        $engLog.debug('document.form.reloadingMetrics.after');
        $scope.loading = false;
    });
}]);

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var app = angular.module('engine.list');

app.component('filterInput', {
    bindings: {
        options: '<',
        column: '<',
        ngModel: '=',
        ngChange: '&'
    },
    templateUrl: '/src/list/filter/filter.component.tpl.html',
    controller: function () {
        function FilterInputControl() {
            _classCallCheck(this, FilterInputControl);

            this.openedDatePopUp = false;
            this._choices = [];
            this._ngModel = undefined;
        }

        _createClass(FilterInputControl, [{
            key: '$onInit',
            value: function $onInit() {}
        }, {
            key: '$onChanges',
            value: function $onChanges(changes) {
                if (changes.options && changes.options.currentValue.choices) {
                    this._choices = this.addNoOption(changes.options.currentValue.choices);
                }
            }
        }, {
            key: 'addNoOption',
            value: function addNoOption(array) {
                if (array === undefined) return;
                var a = Array.from(array);
                a.splice(0, 0, { id: undefined, caption: '' });
                return a;
            }
        }, {
            key: 'formatText',
            value: function formatText(val) {
                if (!val) return null;
                return { $regex: val, $options: 'i' };
            }
        }, {
            key: 'formatDate',
            value: function formatDate(val) {
                if (val == null) return null;
                // return only date, skip time information, engine stores dates as strings,
                // so this regexp should find all documents created on a given date
                // let date = `^${val.getFullYear()}-${val.getMonth()}-${val.getDate()}`;
                return { $regex: '^' + val.toISOString().substr(0, 10) };
            }
        }, {
            key: 'formatChoice',
            value: function formatChoice(val) {
                if (val == null) return null;
                return { $eq: val };
            }
        }, {
            key: '_ngChange',
            value: function _ngChange(val) {
                this.ngModel = val;
                this.ngChange();
            }
        }]);

        return FilterInputControl;
    }()
});

'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var app = angular.module('engine.list');

app.component('engineDocumentList', {
    template: '<ng-include src="$ctrl.contentTemplateUrl || \'/src/list/list.component.tpl.html\'"></ng-include>',
    controller: 'engineListCtrl',
    bindings: {
        immediateCreate: '<',
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
        contentTemplateUrl: '=',
        formlyOptions: '='
    }
});

app.controller('engineListCtrl', ["$scope", "$route", "$location", "engineMetric", "$engine", "engineQuery", "engineAction", "engineActionsAvailable", "engineActionUtils", "engineResolve", "DocumentModal", "$engLog", "DocumentActionList", "$timeout", "DocumentAction", "$injector", "$rootScope", "$parse", "$controller", function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction, engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal, $engLog, DocumentActionList, $timeout, DocumentAction, $injector, $rootScope, $parse, $controller) {
    var _this = this;

    var self = this;
    var _parentDocumentId = null;

    this.$onInit = function () {
        this.sort = { column: null, direction: '-' };
        this.loadedOnce = false;
        this.biggestDocumentSize = 0;
        /** These vars below are required for pagination */
        this.documentPages = [];
        this.currentPage = 0;
        this.allDocumentsLoaded = false;
        this.DOCUMENT_QUERY_LIMIT = $engine.QUERY_PAGE_SIZE;
        this.FILTER_DEBOUNCE_TIME = 1000;

        /** These are required for filtering and sorting */
        this.showFilters = false;
        this.filters = {};
        this.ordering = [];

        $scope.documentActions = {};

        this.filterQueryAction = null;
        $scope.documents = [];
        self.engineResolve = engineResolve;
        //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
        this.formWidget = this.formWidget === 'true';

        if (self.singleDocument) self.template = '/src/list/list.single.tpl.html';else self.template = '/src/list/list.tpl.html';

        $scope.$parse = $parse;
        $scope.options = this.options;
        $scope.columns = this.columns;
        if ($scope.options != null && $scope.options.document != null) $scope.columns = this.columns || (this.metricId && $scope.options.document.queries != null && $scope.options.document.queries[this.metricId] != null ? $scope.options.document.queries[this.metricId].columns : $scope.options.list.columns);

        $scope.query = self.query;
        if ($scope.query == null && $scope.options != null && $scope.options.query != null) $scope.query = $scope.options.query;

        $scope.customButtons = self.customButtons;

        if ($scope.customButtons != null && $scope.options != null && $scope.options.customButtons != null) $scope.customButtons = $scope.options.customButtons;

        /**
         * If inject all custom buttons callback which were defined as strings
         */

        var _loop = function _loop(i) {
            var customButton = $scope.customButtons[i];
            if (_.isString(customButton)) {
                $injector.invoke([customButton, function (component) {
                    $scope.customButtons[i] = component;
                }]);
            } else if (_.isFunction(customButton.refresh)) customButton.refresh();

            if (_.isString(customButton.callback)) {
                callbackName = customButton.callback;

                customButton.callback = function (documentOptions) {
                    // handling return value like this is required
                    // in case callback returns promise - used for showing loader on the button

                    var returnVal = void 0;
                    $injector.invoke([callbackName, function (callback) {
                        returnVal = callback(documentOptions);
                    }]);
                    return returnVal;
                };
            }
        };

        for (var i = 0; i < ($scope.customButtons ? $scope.customButtons.length : 0); ++i) {
            var callbackName;

            _loop(i);
        }

        _parentDocumentId = this.parentDocument ? this.parentDocument.id : undefined;

        $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON, _parentDocumentId);
        $scope.documentActions = {};

        $scope.$on('engine.list.reload', function (event, query) {
            // if($scope == event.currentScope)
            //     return;
            $engLog.debug('engine.list.reload received, reloading documents', 'queryId', $scope.query);
            self.loadDocuments(true);
        });

        init();

        if (this.controller) $controller(this.controller, { $scope: $scope });
    };

    this.canShowPagination = function () {
        if (self.biggestDocumentSize < this.DOCUMENT_QUERY_LIMIT && this.documentPages.length <= 1) return false;

        if (this.noParentDocument === true) return false;

        if ($scope.documents.$error != null) return false;

        if (!$scope.documents.$resolved && !self.loadedOnce) return false;

        return true;
    };

    this.sortByColumn = function (column) {
        self.skip = 0;
        if (_this.sort.column === column) {
            if (_this.sort.direction === '%2B') _this.sort.column = null;else _this.sort.direction = '%2B';
        } else {
            _this.sort = { column: column, direction: '-' };
        }
        if (_this.sort.column === null) _this.ordering = [];else _this.ordering = [(_this.sort.column.filterKey || _this.sort.column.name) + _this.sort.direction];

        _this.loadDocuments(true);
    };

    this.filterQuery = function () {
        $engLog.debug(this.filters);

        if (this.filterQueryAction !== null) $timeout.cancel(this.filterQueryAction);

        this.filterQueryAction = $timeout(function () {
            self.loadDocuments(true);
        }, this.FILTER_DEBOUNCE_TIME);
    };

    this.setShowFilters = function (show) {
        this.showFilters = show;
    };

    this.calculateVirtualDocumentCount = function () {
        if ($scope.documents.length % this.DOCUMENT_QUERY_LIMIT === 0 && this.allDocumentsLoaded === false) return (this.documentPages.length + 1) * this.DOCUMENT_QUERY_LIMIT;
        return this.documentPages.length * this.DOCUMENT_QUERY_LIMIT;
    };

    this.onPageChanged = function () {
        if (this.currentPage > this.documentPages.length) {
            this.loadDocuments();
            return;
        }

        $scope.documents = this.documentPages[this.currentPage - 1];
    };

    this.canShowInputFilterForColumn = function (column) {
        return column.name !== '@index' && column.filter !== false;
    };

    this.arrayCellIterate = function (iterator, array) {
        if (array == null) return '';
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

    this.loadDocuments = function (clear) {
        if (clear === true) {
            $scope.documents = [];
            self.documentPages = [];
            self.currentPage = 1;
            self.allDocumentsLoaded = false;
        }

        var filters = _.pick(this.filters, function (value) {
            return value != null;
        });

        filters = _.isEmpty(filters) ? null : { $and: _.map(filters, function (val, key) {
                return _defineProperty({}, key, val);
            }) };

        if (this.parentDocument == null || this.parentDocument != null && this.parentDocument.id != null) {
            $scope.documents = engineQuery.get($scope.query, this.parentDocument, undefined, undefined, self.documentPages.length * self.DOCUMENT_QUERY_LIMIT, self.DOCUMENT_QUERY_LIMIT, this.ordering, filters);
            $scope.documents.$promise.then(function (documents) {
                if (documents == null) return;

                self.loadedOnce = true;
                self.biggestDocumentSize = documents.length > self.biggestDocumentSize ? documents.length : self.biggestDocumentSize;
                $scope.documents = documents;
                // there are no documents for this page, loaded everything
                if (documents.length === 0) {
                    self.allDocumentsLoaded = true;
                    self.currentPage = self.documentPages.length;
                    if (!_.isEmpty(self.documentPages)) $scope.documents = _.last(self.documentPages);
                    return;
                }

                self.documentPages.push($scope.documents);
                self.currentPage = self.documentPages.length;

                if ($scope.documents.length !== self.DOCUMENT_QUERY_LIMIT) self.allDocumentsLoaded = true;
                angular.forEach(documents, function (document) {
                    $scope.documentActions[document.document.id] = new DocumentActionList(document.actions, document.document, self.parentDocument, $scope, true);
                });

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

    $scope.getActionsForDocument = function (documentEntry) {
        return $scope.documentActions[documentEntry.document.id];
    };

    $scope.engineAction = function (action) {
        return action.call().then(function () {
            $rootScope.$broadcast('engine.list.reload', $scope.query);
        });
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
    $scope.onDocumentSelect = function (documentEntry, $event) {
        if (_parentDocumentId) {
            if (self.onSelectBehavior == 'LINK') {
                $scope.getActionsForDocument(documentEntry).callLink().then(function () {
                    $rootScope.$broadcast('engine.list.reload', $scope.query);
                });
            } else {
                if ($scope.options.subdocument == true) DocumentModal(documentEntry.document.id, $scope.options, self.parentDocument, function () {
                    // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                    $rootScope.$broadcast('engine.list.reload', $scope.query);
                });else {
                    // $location.$$search.step = 0;
                    // $location.$$path = $scope.genDocumentLink(documentEntry.document.id);
                    // $location.$$compose();
                }
            }
        } else {}
    };

    $scope.canGenerateHref = function () {
        if (_parentDocumentId && self.onSelectBehavior === 'LINK') return false;else if ($scope.options.subdocument === true) return false;
        return true;
    };

    $scope.genDocumentLink = function (documentId, hash) {
        if (!$scope.options.documentUrl || !$scope.canGenerateHref()) return '';
        return (hash == true ? '#' : '') + $scope.options.documentUrl.replace(':id', documentId);
    };

    $scope.onCreateDocument = function () {
        console.log('onCreateDocument');
        if ($scope.options.subdocument === true) {
            if (self.immediateCreate === true) {
                // modal is created in DocumentActionProcess
                return new DocumentAction(engineActionUtils.getCreateUpdateAction($scope.actions), $scope.options.documentJSON, self.parentDocument).call();
            } else {
                return DocumentModal(undefined, $scope.options, self.parentDocument, function () {
                    return $rootScope.$broadcast('engine.list.reload', $scope.query);
                });
            }
        } else {
            if (self.immediateCreate === true) {
                return new DocumentAction(engineActionUtils.getCreateUpdateAction($scope.actions), $scope.options.documentJSON).call();
            } else $location.path($scope.genDocumentLink('new'));
        }
    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) !== null;
    };

    function init() {
        if ($scope.columns === null || $scope.columns === undefined) {
            $scope.columns = [];

            $engine.visibleDocumentFields.forEach(function (field) {
                if (field.caption === undefined && field.id === undefined) $scope.columns.push({ name: field });else $scope.columns.push(field);
            });

            engineMetric({ documentJSON: $scope.options.documentJSON }, function (data) {
                angular.forEach(data, function (metric) {
                    $scope.columns.push({ name: metric.id, caption: metric.label });
                });
            });
        }
        self.loadDocuments();
    }
}]);

'use strict';

angular.module('engine.list').controller('engineListWrapperCtrl', ["$scope", "$route", "engineDashboard", "$engine", function ($scope, $route, engineDashboard, $engine) {
    $scope.options = $route.current.$$route.options;
    $scope.IMMEDIATE_CREATE = $engine.IMMEDIATE_CREATE;
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
}]);

'use strict';

var app = angular.module('engine.list');

/**
 * This directive will save element width, which is usefull for tables, so their columns
 * won't change size
 */
app.directive('engSaveColWidth', ["$timeout", function ($timeout) {
    var POSTLINK_TIMEOUT = 1000;
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {
            $timeout(function () {
                jQuery(element).css('width', jQuery(element).width() + 'px');
            }, POSTLINK_TIMEOUT);
        }
    };
}]);

"use strict";

angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/action-button/action-button.tpl.html", "<button type=\"submit\"\n        class=\"btn {{$ctrl.btnClass || 'btn-default'}}\"\n        ng-click=\"$ctrl.invoke()\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\" ng-show=\"$ctrl.loading\"></i>\n    <translate translate=\"{{$ctrl.label}}\"></translate>\n</button>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/confirm-modal/common.confirm-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"$ctrl.dismiss()\">&times;</button>\n    <h4 class=\"modal-title\" id=\"confirm-modal-label\" translate>{{::$ctrl.resolve.title}}</h4>\n\n</div>\n<div class=\"modal-body\" ng-bind-html=\"$ctrl.resolve.content | translate\"></div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-default\" ng-click=\"$ctrl.dismiss()\" translate>Cancel</button>\n    <button class=\"btn btn-primary\" ng-click=\"$ctrl.close()\" translate>Ok</button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/document-actions/document-actions.tpl.html", "<div class=\"eng-loading-box\" ng-show=\"$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n</div>\n\n<button type=\"submit\" class=\"btn btn-primary dark-blue-btn\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\"\n        ng-if=\"$ctrl.steps.getSteps().length >= 1\"\n        ng-show=\"!$ctrl.steps.isLast($ctrl.step)\" translate>Next Step:</button>\n\n<button type=\"submit\" class=\"btn btn-primary\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\"\n        ng-if=\"$ctrl.steps.getSteps().length >= 1\"\n        ng-show=\"!$ctrl.steps.isLast($ctrl.step)\">\n    {{$ctrl.step+2}}. {{$ctrl.steps.getStep($ctrl.step+1).name}}\n</button>\n\n<span ng-if=\"$ctrl.saveAlertLeft == true\" ng-show=\"!$ctrl.loading && $ctrl.dirty && $ctrl.steps.isLast($ctrl.step)\" class=\"document-changes-info document-dirty-warning-left\" translate>You must save document to perform actions</span>\n\n<!--Always show save button-->\n<action-button ng-show=\"$ctrl.actionList.getSaveAction() != null && $ctrl.dirty == true && !$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\"\n               on-click=\"$ctrl.actionList.callSave()\" label=\"{{$ctrl.actionList.getSaveAction().label}}\"></action-button>\n\n<!--Validate should be visible only on pristine document-->\n<action-button ng-show=\"$ctrl.dirty == false && !$ctrl.loading && $ctrl.actionList.getSaveAction()!=null && $ctrl.showValidationButton && $ctrl.steps.isLast($ctrl.step)\"\n               on-click=\"$ctrl.validate()\" label=\"Validate\"></action-button>\n\n<!--Show all engine actions-->\n<action-button ng-repeat=\"action in $ctrl.actionList.actions\" ng-show=\"$ctrl.dirty == false && !$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\"\n               on-click=\"action.call()\" label=\"{{action.label}}\"></action-button>\n\n<!--Show custom user actions-->\n<action-button ng-repeat=\"button in $ctrl.customButtons\" ng-show=\"!$ctrl.loading && $ctrl.steps.isLast($ctrl.step)\"\n               on-click=\"button.action()\" label=\"{{button.label}}\"></action-button>\n\n\n<span ng-if=\"$ctrl.saveAlertLeft == false\" ng-show=\"!$ctrl.loading && $ctrl.dirty && $ctrl.steps.isLast($ctrl.step)\" class=\"document-changes-info document-dirty-warning-right\" translate>You must save document to perform actions</span>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/sidebar-addon/sidebar-addon.tpl.html", "<div scroll-rwd class=\"text-box sidebar-details\">\n    <div class=\"text-content\">\n        <h3 style=\"margin-top: 0\" ng-if=\"caption\">{{caption | translate}}</h3>\n\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/dashboard/dashboard.tpl.html", "<div class=\"row\">\n    <div class=\"col-md-12\">\n        <h1 translate>{{options.caption}}</h1>\n    </div>\n</div>\n<div class=\"text-box\" ng-repeat=\"query in queries\">\n    <div class=\"text-content\">\n        <engine-document-list show-create-button=\"query.showCreateButton\" columns=\"query.columns\"\n                              custom-buttons=\"query.customButtons\"\n                              content-template-url=\"query.contentTemplateUrl\"\n                              controller=\"{{query.controller || ''}}\"\n                              no-documents-message=\"{{query.noDocumentsMessage || $engine.getOptions(query.documentModelId).list.noDocumentsMessage || ''}}\"\n                              no-parent-document-message=\"{{query.noParentDocumentMessage || $engine.getOptions(query.documentModelId).list.noParentDocumentMessage || ''}}\"\n                              immediate-create=\"query.immediateCreate === true || (query.immediateCreate !== false && IMMEDIATE_CREATE === true)\"\n                              query=\"query.queryId\" options=\"$engine.getOptions(query.documentModelId)\"\n                              list-caption=\"query.label\"></engine-document-list>\n\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/details/details.tpl.html", "<div  scroll-rwd  is-visible=\"{{$ctrl.isVisible()}}\" class=\"text-box sidebar-details\">\n    <div class=\"text-content\" ng-clock>\n        <h3 style=\"margin-top: 0px\">{{$ctrl.options.document.details.caption || $ctrl.options.name}}</h3>\n\n        <span ng-show=\"$ctrl.dirty || $ctrl.ngModel.id == null\" class=\"document-changes-info document-dirty\" translate>Document has unsaved changes</span>\n        <span ng-show=\"!$ctrl.dirty && $ctrl.ngModel.id != null\" class=\"document-changes-info document-pristine\" translate>All changes have been saved</span>\n\n        <ul class=\"list-group\">\n            <li ng-repeat=\"entry in $ctrl.options.document.details.entries | conditionFulfiled : $ctrl.ngModel\" class=\"list-group-item\">\n                <span translate>{{entry.caption || entry.name}}</span>\n                <span translate>{{$ctrl.formatEntry(entry) || 'Not specified yet' | numberFormat}}</span>\n            </li>\n        </ul>\n\n        <action-button style=\"width: 100%\" btn-class=\"btn-primary full-width\" ng-if=\"$ctrl.actions.getSaveAction() != null\"\n                       on-click=\"$ctrl.saveDocument()\"\n                       label=\"{{$ctrl.options.document.details.saveCaption || 'Save' }}\">\n        </action-button>\n\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 ng-if=\"!documentId\" class=\"modal-title\" id=\"myModalLabel\" translate>{{ documentOptions.document.caption || 'CREATE ' + documentOptions.name }}</h4>\n    <h4 ng-if=\"documentId\" ><span translate>{{documentOptions.name}}</span> {{engineResolve(document, documentOptions.document.titleSrc)}}</h4>\n\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document parent-document=\"parentDocument\" dirty=\"documentDirty\"\n                         document-scope=\"documentScope\" step-list=\"stepList\"\n                         document=\"document\" document-id=\"{{documentId}}\"\n                         step=\"step\" options=\"documentOptions\">\n        </engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <engine-document-actions show-validation-button=\"documentOptions.document.showValidationButton\" custom-buttons=\"customButtons\"\n                             document=\"document\" document-scope=\"documentScope\" document-parent=\"parentDocument\" dirty=\"documentDirty\"\n                             steps=\"stepList\" step=\"step\" class=\"btn-group float-right\" save-alert-left=\"true\">\n    </engine-document-actions>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div class=\"eng-loading-box\" ng-show=\"$ctrl.$ready.$$state.status === 0\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n</div>\n\n<div ng-if=\"$ctrl.$ready.$$state.status === 1\" ng-cloak>\n    <div ng-repeat=\"message in $ctrl.messages\" class=\"alert alert-{{message.type}} alert-document\" role=\"alert\" translate>{{message.body}}</div>\n    <form ng-submit=\"$ctrl.onSubmit()\" name=\"$ctrl.documentForm.formlyState\" novalidate>\n        <formly-form model=\"$ctrl.document\" fields=\"$ctrl.documentForm.formStructure\" class=\"horizontal\"\n                     options=\"$ctrl.formlyOptions\" form=\"$ctrl.formlyState\">\n\n            <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" ng-if=\"!$ctrl.options.subdocument\"\n                                     document=\"$ctrl.document\" document-scope=\"$ctrl.documentScope\" dirty=\"$ctrl.dirty\"\n                                     actions=\"$ctrl.actions\"\n                                     steps=\"$ctrl.stepList\" step=\"$ctrl.step\" class=\"btn-group\"\n                                     save-alert-left=\"false\"></engine-document-actions>\n        </formly-form>\n    </form>\n</div>\n\n<div ng-show=\"!$ctrl.$ready.$$state.status === 2\" ng-cloak translate>\n    REJECTED\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <h1>\n                <span ng-if=\"!document.id\" translate>{{ options.document.caption || 'CREATE ' + options.name }}</span>\n                <span ng-if=\"document.id\" ><span translate>{{options.name}}</span>{{engineResolve(document, options.document.titleSrc)}}</span>\n\n                <span class=\"bold\" ng-if=\"stepList.getSteps().length > 0\">{{stepList.getStep($routeParams.step).name | translate}} {{$routeParams.step + 1}}/{{stepList.getSteps().length}}</span>\n            </h1>\n        </div>\n    </div>\n    <div class=\"row\">\n        <engine-document step-list=\"stepList\" show-validation-button=\"options.document.showValidationButton\" processing=\"processing\"\n                         document-id=\"{{::documentId}}\" document=\"document\" step=\"$routeParams.step\" options=\"options\"\n                         ng-class=\"{'col-sm-8': !responsive, 'col-xs-8': !responsive, 'col-sm-12': responsive, 'col-xs-12': responsive}\"\n                         class=\"col-lg-8 col-md-8 engine-document\" actions=\"actions\" dirty=\"documentDirty\"></engine-document>\n        <div class=\"col-lg-4 col-md-4 sidebar-document\"\n             ng-class=\"{'hidden-sm': responsive, 'hidden-xs': responsive, 'col-sm-4': !responsive, 'col-xs-4': !responsive}\">\n            <div fixed-on-scroll=\"fixed-sidebar-on-scroll\">\n            <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'top' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n            <engine-steps ng-model=\"document\" processing=\"processing\" step=\"$routeParams.step\" step-list=\"stepList\" options=\"options\"></engine-steps>\n            <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'middle' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n            <engine-document-details ng-model=\"document\" options=\"options\" actions=\"actions\" dirty=\"documentDirty\"></engine-document-details>\n            <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'bottom' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n        </div>\n    </div>\n\n    <div class=\"document-navi-toggle hidden-md-up\" ng-click=\"toggleSideMenu()\" ng-if=\"responsive\" ng-class=\"{active: sideMenuVisible}\">\n        <i class=\"fa fa-file-text\" aria-hidden=\"true\"></i>\n    </div>\n    <div class=\"sidebar-document-rwd\" ng-show=\"sideMenuVisible\" ng-if=\"responsive\">\n        <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'top' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n        <engine-steps class=\"sidebar-box-shadow\" ng-model=\"document\" step=\"$routeParams.step\" step-list=\"stepList\" options=\"options\"></engine-steps>\n        <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'middle' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n        <engine-document-detail class=\"sidebar-box-shadow\" ng-model=\"document\" options=\"options\" actions=\"actions\" dirty=\"documentDirty\"></engine-document-details>\n        <sidebar-addon ng-repeat=\"addon in options.document.sidebarAddons | filter: { position: 'bottom' } | filter: conditionFulfilled\" caption=\"{{::addon.caption}}\" tag=\"{{::addon.component}}\" document=\"document\" ctx=\"addon.ctx\"></sidebar-addon>\n    </div>\n\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <div ng-show=\"$ctrl.processing\" class=\"category-loading\">\n        <i class=\"category-loading-spinner fa fa-spinner fa-spin\" style=\"\" aria-hidden=\"true\"></i>\n    </div>\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.stepList.steps\" ng-class=\"{active: $ctrl.stepList.getCurrentStep() == _step}\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\">\n                    <i class=\"fa\" aria-hidden=\"true\" style=\"display: inline-block\"\n                       ng-class=\"{'fa-check-circle' : _step.getState() == 'valid',\n                                  'fa-circle-o': _step.getState() == 'blank',\n                                  'fa-cog fa-spin': _step.getState() == 'loading',\n                                  'fa-times-circle': _step.getState() == 'invalid'}\"></i>\n                </span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/attachment.tpl.html", "<div class=\"tpl-attachment\">\n    <!--ng-model=\"model[options.key]\"-->\n    <!--<input type=\"text\" ng-model=\"username\"><br/><br/>-->\n    <!--watching model:-->\n    <table>\n        <tr>\n            <th translate>Filename</th>\n            <th>Size</th>\n            <th class=\"attachment-actions\">Actions</th>\n        </tr>\n        <tr ng-if=\"model[options.key]\">\n            <td><a href=\"{{attachment.getDownloadLink()}}\">{{ attachment.getFilename() }}</a></td>\n            <td>{{ attachment.getSize() | formatFileSize }}</td>\n            <td class=\"attachment-actions\">\n                <a href=\"\" class=\"\" ng-click=\"delete()\"><span class=\"fa fa-trash-o\"></span></a>\n            </td>\n        </tr>\n\n    </table>\n\n    <button type=\"file\" class=\"btn btn-primary btn-file\"\n            ngf-model-invalid=\"invalidFile\"\n            ngf-select=\"upload($file)\"\n            ng-disabled=\"status != STATUS.normal\"\n            ngf-multiple=\"false\"\n            ngf-pattern=\"acceptedExtensions\"\n            ngf-accept=\"acceptedExtensions\"\n            ng-show=\"model[options.key] == null\">\n        <i class=\"fa fa-cloud-upload\" aria-hidden=\"true\"></i>\n        <span ng-if=\"status == STATUS.uploading\">{{ 'Uploading' | translate}} {{progress}}%</span>\n        <span ng-if=\"status == STATUS.normal\">{{ (attachment.label || 'Select File') | translate}}</span>\n        <span ng-if=\"status == STATUS.disabled\">{{ 'You must save document first' | translate}}</span>\n    </button>\n    <p ng-if=\"error\" class=\"error-text\">{{error}}</p>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/attachmentList.tpl.html", "<div class=\"tpl-attachment\">\n    <!--ng-model=\"model[options.key]\"-->\n    <!--<input type=\"text\" ng-model=\"username\"><br/><br/>-->\n    <!--watching model:-->\n    <table>\n        <tr>\n            <th translate>Filename</th>\n            <th>Size</th>\n            <th class=\"attachment-actions\">Actions</th>\n        </tr>\n        <tr ng-if=\"model[options.key]\" ng-repeat=\"file in model[options.key]\">\n            <td><a href=\"{{attachment.getDownloadLink(file)}}\">{{ attachment.getFilename(file) }}</a></td>\n            <td>{{ attachment.getSize(file) | formatFileSize }}</td>\n            <td class=\"attachment-actions\">\n                <a href=\"\" class=\"\" ng-click=\"delete(file)\"><span class=\"fa fa-trash-o\"></span></a>\n            </td>\n        </tr>\n\n    </table>\n\n    <button type=\"file\" class=\"btn btn-primary btn-file\"\n            ngf-model-invalid=\"invalidFile\"\n            ngf-select=\"upload($file)\"\n            ng-disabled=\"status != STATUS.normal\"\n            ngf-multiple=\"false\"\n            ngf-pattern=\"acceptedExtensions\"\n            ngf-accept=\"acceptedExtensions\">\n        <i class=\"fa fa-cloud-upload\" aria-hidden=\"true\"></i>\n        <span ng-if=\"status == STATUS.uploading\">{{ 'Uploading' | translate}} {{progress}}%</span>\n        <span ng-if=\"status == STATUS.normal\">{{ (attachment.label || 'Select File') | translate}}</span>\n        <span ng-if=\"status == STATUS.disabled\">{{ 'You must save document first' | translate}}</span>\n    </button>\n    <p ng-if=\"error\" class=\"error-text\">{{error}}</p>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/checkbox.tpl.html", "<div class=\"checkbox\">\n\t<label>\n\t\t<input type=\"checkbox\"\n           class=\"formly-field-checkbox\"\n\t\t       ng-model=\"model[options.key]\">\n\t\t{{to.label | translate}}\n\t\t{{to.required ? '*' : ''}}\n\t</label>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/datepicker.tpl.html", "<p class=\"input-group input-group-datepicker\">\n    <input id=\"{{::id}}\"\n           name=\"{{::id}}\"\n           ng-model=\"model[options.key]\"\n           class=\"form-control datepicker\"\n           type=\"text\"\n           uib-datepicker-popup=\"{{to.datepickerOptions.format || 'yyyy-MM-dd'}}\"\n           is-open=\"openedDatePopUp\"\n           datepicker-popup-template-url=\"/src/formly/types/templates/overrides/datepickerPopup.tpl.html\"\n           ng-required=\"false\"\n           show-button-bar=\"false\"\n           datepicker-options=\"to.datepickerOptions\"\n           on-open-focus=\"false\"\n           placeholder=\"{{options.templateOptions.placeholder | translate}}\"\n           ng-click=\"openPopUp($event)\"/>\n    <span class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"openPopUp($event)\">\n            <i class=\"glyphicon glyphicon-calendar\"></i>\n        </button>\n    </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/input.tpl.html", "<input class=\"form-control\"  ng-model=\"model[options.key]\" placeholder=\"{{options.templateOptions.placeholder | translate}}\" number-format>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiCheckbox.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\"\n             id=\"{{id + '_'+ $index}}\"\n             ng-model=\"multiCheckbox.checked[$index]\"\n             ng-change=\"multiCheckbox.change()\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelect.tpl.html", "<ui-select multiple ng-model=\"model[options.key]\" ng-class=\"{'disabled': options.data.isDisabled()}\" theme=\"bootstrap\" class=\"multiple-ui-select\">\n    <ui-select-match placeholder=\"Select option...\" close-on-select=\"false\">{{$item.value}}</ui-select-match>\n    <ui-select-choices repeat=\"option.value as option in to.options | filter:$select.search\">\n        <div value=\"option.value\"><span ng-bind-html=\"option.name\">dddd</span>\n    </ui-select-choices>\n</ui-select>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelectImage.tpl.html", "<!--<div>\n    <div ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" id=\"{{id}}_{{::option.value}}\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <label class=\"\" style=\"top: -3px; position: relative;\" for=\"{{id}}_{{::option.value}}\">\n            <span class=\"\" >{{::option.name}}</span>\n        </label>\n    </div>\n</div>-->\n\n<div>\n    <div class=\"content\">\n        <div class=\"row\">\n            <div ng-repeat=\"col in options.templateOptions.cols\" class=\"{{::options.templateOptions.colClass}}\">\n               <div class=\"multiselect-image {{::element.css}} {{options.data.isActive(element.value) ? 'alert-success' : 'alert-default'}} form-control\"\n                     role=\"alert\" ng-repeat=\"element in col\"\n                     ng-class=\"{'disabled': options.data.isDisabled()}\"\n                     ng-click=\"options.data.isDisabled() || addRemoveModel(element.value)\">\n                    <span>{{::element.label}}</span>\n                    <i class=\"fa fa-check-circle\" aria-hidden=\"true\"></i>\n                </div>\n            </div>\n            <!-- we need ng-model for proper usage of multiSelectImage by formly -->\n            <input type=\"hidden\" ng-model=\"model\">\n        </div>\n    </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelectVertical.tpl.html", "<div>\n    <div ng-repeat=\"option in to.options\">\n        <input ng-disabled=\"options.data.isDisabled()\" ng-class=\"{'disabled': options.data.isDisabled()}\"\n               type=\"checkbox\" id=\"{{id}}_{{::option.value}}\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <label class=\"\" style=\"top: -3px; position: relative;\" for=\"{{options.data.isDisabled()?'':id+'_'+option.value}}\">\n            <span class=\"\" >{{::option.name}}</span>\n        </label>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/overrides/datepickerPopup.tpl.html", "<ul role=\"presentation\" class=\"uib-datepicker-popup dropdown-menu uib-position-measure engine-popup\" dropdown-nested ng-if=\"isOpen\" ng-keydown=\"keydown($event)\" ng-click=\"$event.stopPropagation()\">\n    <li ng-transclude></li>\n    <li ng-if=\"showButtonBar\" class=\"uib-button-bar\">\n    <span class=\"btn-group pull-left\">\n      <button type=\"button\" class=\"btn btn-sm btn-info uib-datepicker-current\" ng-click=\"select('today', $event)\" ng-disabled=\"isDisabled('today')\">{{ getText('current') }}</button>\n      <button type=\"button\" class=\"btn btn-sm btn-danger uib-clear\" ng-click=\"select(null, $event)\">{{ getText('clear') }}</button>\n    </span>\n        <button type=\"button\" class=\"btn btn-sm btn-success pull-right uib-close\" ng-click=\"close($event)\">{{ getText('close') }}</button>\n    </li>\n</ul>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/radio.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"radio\">\n    <label class=\"radio-label\">\n      <input type=\"radio\"\n             id=\"{{id + '_'+ $index}}\"\n             tabindex=\"0\"\n             ng-value=\"option[to.valueProp || 'value']\"\n             ng-model=\"model[options.key]\">\n      <span class=\"radio-label\">{{option[to.labelProp || 'name']}}<span>\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/radioGroup.tpl.html", "<div>\n    <div class=\"pr-category btn-group row row-compensate\">\n            <label class=\"btn btn-radio btn-default\" ng-repeat=\"(key, option) in to.options\">\n                <input type=\"radio\"\n                       class=\"radio-group-button\"\n                       id=\"{{id + '_'+ $index}}\"\n                       tabindex=\"0\"\n                       ng-value=\"option[to.valueProp || 'value']\"\n                       ng-model=\"model[options.key]\">\n                <span class=\"radio-desc\" translate>{{option[to.labelProp || 'name']}}</span>\n            </label>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/select.tpl.html", "<select class=\"form-control\" ng-model=\"model[options.key]\"></select>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/textarea.tpl.html", "<textarea class=\"form-control engine-input\" ng-model=\"model[options.key]\" placeholder=\"{{options.templateOptions.placeholder | translate}}\"></textarea>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\" style=\"position: relative\" ng-show=\"options.data.hasMetrics()\" ng-controller=\"engineFormlyWrapperCtrl\">\n    <div ng-show=\"loading\" class=\"category-loading\">\n        <i class=\"category-loading-spinner fa fa-spinner fa-spin\" style=\"\" aria-hidden=\"true\"></i>\n    </div>\n    <div class=\"{{::options.templateOptions.wrapperInnerClass}}\">\n        <h2 ng-if=\"options.templateOptions.label\" translate>{{options.templateOptions.label}}</h2>\n        <formly-transclude></formly-transclude>\n    </div>\n    <div class=clearfix\"></div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/default.tpl.html", "<div class=\"{{::options.to.categoryWrapperCSS}}\">\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/has-error.tpl.html", "<div class=\"form-group\" ng-class=\"{'has-error': showError }\">\n  <formly-transclude></formly-transclude>\n  <div ng-if=\"showError\" class=\"error-messages\">\n    <div ng-repeat=\"(key, error) in fc.$error\" class=\"message help-block ng-binding ng-scope\" translate>{{options.validation.messages[key](fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  <!-- after researching more about ng-messages integrate it\n  <div ng-messages=\"fc.$error\" ng-if=\"showError\" class=\"error-messages\">\n    <div ng-message=\"{{ ::name }}\" ng-repeat=\"(name, message) in ::options.validation.messages\" class=\"message help-block ng-binding ng-scope\" translate>{{ message(fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  -->\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/label.tpl.html", "<div class=\"\">\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        <span class=\"eng-text-label\" translate>{{to.label}}</span>\n        <span class=\"text-danger\">{{options.data.metric.required ? '*' : ''}}</span>\n        <span translate class=\"grey-text\" ng-if=\"to.description\" translate>({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/row.tpl.html", "<div ng-if=\"options.data.hasMetrics()\">\n    <p class=\"row-label\" ng-if=\"to.label\" translate>{{to.label}}</p>\n    <div class=\"row  {{options.templateOptions.wrapperClass}}\">\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/step.tpl.html", "<div ng-hide=\"options.data.hide\">\n    <div class=\"text-box\" ng-if=\"options.data.hasEntries()\">\n        <div class=\"{{::options.templateOptions.wrapperInnerClass}}\">\n            <h2 ng-if=\"options.data.step.data.summary.caption\" translate>{{options.data.step.data.summary.caption}}</h2>\n            <table class=\"table\">\n                <tr ng-repeat=\"entry in options.data.step.data.summary.entries\">\n                    <td translate>{{entry.caption || entry.name}}</td>\n                    <td translate>{{options.data.$parse(entry.name)(model) || 'Not specified yet'}}</td>\n                </tr>\n            </table>\n        </div>\n        <div class=clearfix\"></div>\n    </div>\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/unit.tpl.html", "<div class=\"input-group\">\n    <formly-transclude></formly-transclude>\n    <span class=\"input-group-addon\" ng-bind-html=\"::options.data.unit\"></span>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/array.tpl.html", "{{$ctrl.arrayCellIterate(column.iterator,\n                         $ctrl.process(column.processor, $parse(column.name)(document_entry.document)))}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/date.tpl.html", "{{$ctrl.process(column.processor, $parse(column.name)(document_entry.document)) | date}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/index.tpl.html", "{{$ctrl.process(column.processor, (($ctrl.currentPage - 1) * $ctrl.DOCUMENT_QUERY_LIMIT) + $row+1)}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/link.tpl.html", "<a ng-href=\"{{::genDocumentLink(document_entry.document.id, true)}}\" ng-click=\"onDocumentSelect(document_entry)\" class=\"proposal-title\" ng-include=\"getCellTemplate(document_entry.document, column, true)\"></a>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/text.tpl.html", "{{$ctrl.process(column.processor, $parse(column.name)(document_entry.document)) | numberFormat}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/filter/filter.component.tpl.html", "<input ng-if=\"$ctrl.options.type === 'text' || $ctrl.options.type === 'link'\"\n       ng-change=\"$ctrl._ngChange($ctrl.formatText($ctrl._ngModel))\"\n       ng-model=\"$ctrl._ngModel\"\n       type=\"text\"\n       class=\"form-control input-sm eng-table-filter-header-input\" />\n\n<input ng-if=\"$ctrl.options.type === 'date'\"\n       ng-change=\"$ctrl._ngChange($ctrl.formatDate($ctrl._ngModel))\"\n       ng-model=\"$ctrl._ngModel\"\n       type=\"text\"\n       uib-datepicker-popup=\"dd-MM-yyyy\"\n       ng-model-options=\"{timezone: '+0000'}\"\n       datepicker-popup-template-url=\"/src/formly/types/templates/overrides/datepickerPopup.tpl.html\"\n       show-button-bar=\"false\"\n       on-open-focus=\"false\"\n       is-open=\"$ctrl.openedDatePopUp\"\n       ng-click=\"$ctrl.openedDatePopUp = !$ctrl.openedDatePopUp\"\n       class=\"form-control eng-table-filter-header-input datepicker\" />\n\n<select ng-if=\"$ctrl.options.type === 'choice'\"\n        class=\"form-control input-sm eng-table-filter-header-input\"\n        ng-change=\"$ctrl._ngChange($ctrl.formatChoice($ctrl._ngModel))\"\n        ng-model=\"$ctrl._ngModel\"\n        ng-options=\"op.id as op.caption | translate for op in $ctrl._choices\">\n</select>\n\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.component.tpl.html", "<ng-include src=\"$ctrl.template\"></ng-include>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.single.tpl.html", "<h2 ng-if=\"$ctrl.listCaption\" translate>{{ $ctrl.listCaption }}</h2>\n<div>\n    <div class=\"eng-loading-box\" ng-show=\"!documents.$resolved\">\n        <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n    </div>\n    <div ng-if=\"documents.$resolved || $ctrl.noParentDocument\" ng-cloak>\n        <table ng-repeat=\"document_entry in documents\" ng-if=\"!documents.$error && !$ctrl.noParentDocument\"\n               ng-init=\"$row=$index\" class=\"proposal-list\">\n            <thead>\n            <tr class=\"single-document-top\">\n                <td class=\"text-left\"></td>\n                <td class=\"text-right cog-dropdown\" style=\"padding-top: 5px\">\n                    <div class=\"dropdown\" style=\"height: 9px;\"\n                         ng-if=\"getActionsForDocument(document_entry).actions.length > 0\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\"\n                           aria-expanded=\"true\"><span class=\"glyphicon glyphicon-cog\"></span></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in getActionsForDocument(document_entry).actions\">\n                                <a href=\"\"\n                                   ng-click=\"engineAction(action)\"\n                                   translate>{{action.label}}</a>\n                            </li>\n                            <li ng-if=\"!getActionsForDocument(document_entry).actions\"><span\n                                    style=\"margin-left: 5px; margin-right: 5px;\" translate>No actions available</span>\n                            </li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n            </thead>\n            <tbody>\n            <tr ng-repeat=\"column in columns\" class=\"{{column.css}} {{column.style}}\">\n                <td class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" translate>\n                    {{column.caption || column.name}}\n                </td>\n                <td ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n            </tr>\n            </tbody>\n        </table>\n\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"documents.$error\" translate>\n            {{documents.$errorMessage || 'An error occurred during document loading'}}\n        </div>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"$ctrl.noParentDocument\" translate>\n            {{$ctrl.noParentDocumentMessage || 'Parent document does not exist, save this document first'}}\n        </div>\n        <div class=\"alert alert-info\" role=\"alert\"\n             ng-if=\"documents.$resolved && documents.length == 0 && !documents.$error\" translate>\n            {{ $ctrl.noDocumentsMessage || 'There are no documents to display'}}\n        </div>\n    </div>\n</div>\n\n<action-button ng-if=\"$ctrl.showCreateButton !== false && canCreateDocument()\"\n               btn-class=\"btn-primary\" on-click=\"onCreateDocument()\"\n               label=\"{{$ctrl.options.list.createButtonLabel ? $ctrl.options.list.createButtonLabel : 'Create '+options.name}}\"></action-button>\n\n<action-button ng-repeat=\"customButton in customButtons\"\n               btn-class=\"btn-primary\" on-click=\"customButton.callback($ctrl.options)\"\n               label=\"{{customButton.label}}\"></action-button>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.tpl.html", "<ng-form eng-isolate-form>\n    <h2 ng-show=\"$ctrl.listCaption\" class=\"eng-list-header\"><span\n            class=\"eng-caption\" ng-if=\"$ctrl.listCaption\" translate>{{ $ctrl.listCaption }}</span>\n        <div class=\"pull-right\">\n            <ul uib-pagination\n                ng-show=\"$ctrl.canShowPagination()\"\n                style=\"margin-top: 0px;\"\n                class=\"pagination-sm eng-list-pagination-top\"\n                total-items=\"$ctrl.calculateVirtualDocumentCount()\"\n                items-per-page=\"$ctrl.DOCUMENT_QUERY_LIMIT\"\n                boundry-links=\"false\"\n                max-size=\"6\"\n                rotate=\"true\"\n                ng-model=\"$ctrl.currentPage\"\n                ng-change=\"$ctrl.onPageChanged()\">\n            </ul>\n        </div>\n\n        <button ng-show=\"$ctrl.canShowPagination()\"\n                class=\"btn btn-default btn-sm pull-right list-filter\"\n                ng-class=\"{active: $ctrl.showFilters === true}\"\n                ng-click=\"$ctrl.setShowFilters(!$ctrl.showFilters)\"\n                title=\"{{ 'Filter' | translate}}\">\n            <span class=\"glyphicon glyphicon-filter\"></span>\n        </button>\n    </h2>\n\n    <div class=\"eng-loading-box clear\" ng-show=\"!documents.$resolved\">\n        <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n    </div>\n    <div class=\"clear\" ng-if=\"$ctrl.loadedOnce || documents.$resolved || $ctrl.noParentDocument\" ng-cloak>\n        <table class=\"proposal-list table\">\n            <thead>\n            <tr>\n                <th class=\"{{column.css_header || column.css}} engine-table-header\" style=\"text-transform: uppercase;\"\n                    eng-save-col-width\n                    ng-class=\"{'eng-col-index': column.name === '@index'}\"\n                    ng-repeat=\"column in columns\">\n                    <span ng-class=\"{'table-header-sort': column.name !== '@index'}\" ng-click=\"$ctrl.sortByColumn(column)\">\n                        <span translate>{{column.caption || column.name}}</span>\n                        <span class=\"glyphicon\"\n                              ng-class=\"{'glyphicon-chevron-up': $ctrl.sort.column === column && $ctrl.sort.direction === '%2B', 'glyphicon-chevron-down': $ctrl.sort.column === column && $ctrl.sort.direction === '-'}\">\n                        </span>\n                    </span>\n                    <filter-input\n                            ng-show=\"$ctrl.showFilters === true\"\n                            ng-change=\"$ctrl.filterQuery()\"\n                            ng-if=\"$ctrl.canShowInputFilterForColumn(column)\"\n                            column=\"column\"\n                            options=\"{choices: column.filterChoices, type: column.filterChoices != null ? 'choice' : (column.type || 'text')}\"\n                            ng-model=\"$ctrl.filters[column.filterKey || column.name]\">\n                    </filter-input>\n                </th>\n                <th class=\"text-right eng-cog-col\"></th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr ng-if=\"documents.$resolved && documents.length == 0 && !documents.$error\" class=\"query-info\">\n                <td colspan=\"{{::columns.length + 1}}\" translate>\n                    {{ $ctrl.noDocumentsMessage || 'There are no documents to display'}}\n                </td>\n            </tr>\n            <tr ng-repeat=\"document_entry in documents\" ng-if=\"!documents.$error && !$ctrl.noParentDocument\"\n                ng-init=\"$row=$index\">\n                <td ng-repeat=\"column in columns\" class=\"{{column.css}} {{column.style}}\"\n                    ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n                <td class=\"text-right cog-dropdown eng-cog-col\">\n                    <div class=\"dropdown\" ng-if=\"getActionsForDocument(document_entry).actions.length > 0\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\"\n                           aria-expanded=\"true\"><i\n                                class=\"fa fa-cog\" aria-hidden=\"true\"></i></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in getActionsForDocument(document_entry).actions\">\n                                <a href=\"\"\n                                   ng-click=\"engineAction(action)\"\n                                   translate>{{action.label}}</a>\n                            </li>\n                            <li ng-if=\"!getActionsForDocument(document_entry).actions\"><span\n                                    style=\"margin-left: 5px; margin-right: 5px;\" translate>No actions available</span>\n                            </li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"documents.$error\" translate>\n            {{documents.$errorMessage || 'An error occurred during document loading'}}\n        </div>\n        <div class=\"alert alert-warning\" role=\"alert\" ng-if=\"$ctrl.noParentDocument\" translate>\n            {{$ctrl.noParentDocumentMessage || 'Parent document does not exist, save this document first'}}\n        </div>\n        <!--<div class=\"alert alert-info\" role=\"alert\"-->\n        <!--ng-if=\"documents.$resolved && documents.length == 0 && !documents.$error\"-->\n        <!--translate>-->\n        <!--{{ $ctrl.noDocumentsMessage || 'There are no documents to display'}}-->\n        <!--</div>-->\n        <div ng-if=\"$ctrl.formlyOptions.templateOptions.serverErrors!=0\"\n             ng-repeat=\"error in $ctrl.formlyOptions.templateOptions.serverErrors\">\n            <div class=\"alert alert-danger\"><span translate>{{ error }}</span></div>\n        </div>\n    </div>\n\n    <div class=\"eng-list-bottom-bar\"\n         ng-if=\"customButtons || ($ctrl.showCreateButton !== false && canCreateDocument()) || $ctrl.canShowPagination()\">\n        <action-button ng-if=\"$ctrl.showCreateButton !== false && canCreateDocument()\"\n                       ng-show=\"documents.$resolved\"\n                       btn-class=\"btn-primary\" on-click=\"onCreateDocument()\"\n                       label=\"{{$ctrl.options.list.createButtonLabel ? $ctrl.options.list.createButtonLabel : 'Create '+options.name }}\"></action-button>\n\n        <action-button ng-repeat=\"customButton in customButtons\"\n                       ng-show=\"documents.$resolved && customButton.callback\"\n                       btn-class=\"btn-primary\" on-click=\"customButton.callback($ctrl.options)\"\n                       label=\"{{customButton.label | translate}}\"></action-button>\n\n\n        <ul uib-pagination\n            ng-show=\"$ctrl.canShowPagination()\"\n            style=\"margin-top: 0px;\"\n            class=\"pagination-sm pull-right\"\n            total-items=\"$ctrl.calculateVirtualDocumentCount()\"\n            items-per-page=\"$ctrl.DOCUMENT_QUERY_LIMIT\"\n            boundry-links=\"false\"\n            rotate=\"true\"\n            ng-model=\"$ctrl.currentPage\"\n            ng-change=\"$ctrl.onPageChanged()\">\n        </ul>\n    </div>\n</ng-form>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.wrapper.tpl.html", "<h1 translate>{{::options.list.caption}}</h1>\n<div class=\"text-box\" ng-repeat=\"query in queries\">\n    <div class=\"text-content\">\n        <engine-document-list content-template-url=\"query.contentTemplateUrl\"\n                controller=\"{{query.controller || ''}}\"\n                no-documents-message=\"{{query.noDocumentsMessage || options.list.noDocumentsMessage || ''}}\"\n                no-parent-document-message=\"{{query.noParentDocumentMessage || options.list.noParentDocumentMessage || ''}}\"\n                immediate-create=\"query.immediateCreate === true || (query.immediateCreate !== false && IMMEDIATE_CREATE === true)\"\n                show-create-button=\"$last\" query=\"query.id\" options=\"options\"></engine-document-list>\n    </div>\n</div>");
}]);

//# sourceMappingURL=templates.js.map

;
//# sourceMappingURL=angular-engine.js.map