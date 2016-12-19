'use strict';

angular.module('engine.common', []);
'use strict';

angular.module('engine.dashboard', ['ngRoute', 'engine.list']);
'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

/**
 * @ngdoc overview
 * @name engine
 *
 * @requires engine
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
'checklist-model', 'engine.common', 'engine.list', 'engine.dashboard', 'engine.steps', 'ngMessages', 'pascalprecht.translate', 'engine.document']);
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
    controller: function controller($rootScope, $scope, DocumentActionList, $log) {
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
            if (!_.isEmpty(newDocument) && newDocument != null) self.actionList._setDocument(newDocument);
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
}).controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument, engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx, engineAction, engineMetricCategories, StepList, DocumentForm, DocumentActionList, $q, $log) {
    var self = this;
    console.log($scope);
    this.document = null;
    self.documentScope = $scope;
    $scope.steps = this.options.document.steps;

    this.actionList = null;
    this.documentForm = new DocumentForm();

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

        var _actionsToPerform = [];

        //if the document exists, the first action will be retriving it
        if (self.documentId && self.documentId != 'new') {
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (data) {
                self.document = data.document;
                // self.documentChange(self.document);
            }));
        } //if document does not exist copy base from optionas, and set the name
        else {
                self.document = angular.copy(self.options.documentJSON);
                self.document.name = (self.options.name || 'Document') + ' initiated on ' + new Date();
            }

        // return chained promise, which will do all other common required operations:
        return $q.all(_actionsToPerform).then(function () {
            self.actionList = new DocumentActionList(self.document, self.parentDocument, $scope);
            return self.actionList.$ready;
        }).then(function () {
            self.documentForm.init(self.document, self.options, self.stepList);
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
                self.documentForm.validate(oldStep);
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
        self.documentForm.validate().then(function (valid) {
            if (!valid) self.step = self.stepList.getFirstInvalidIndex();
        });
    });

    $scope.$on('engine.common.action.after', function (event, document, action, result) {});

    this.$ready = $q.all(this.stepList.$ready, this.documentForm.$ready).then(this.initDocument).then(this.postinitDocument).then(function () {
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
            controller: function controller($scope, documentId, documentOptions, engineActionsAvailable, StepList, $uibModalInstance) {
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

angular.module('engine.document').controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams, StepList) {
    $scope.options = $route.current.$$route.options;

    $scope.stepList = new StepList($route.current.$$route.options.document.steps);

    $scope.document = {};
    $scope.documentId = $routeParams.id;
    if ($routeParams.step === undefined) $routeParams.step = 0;else $routeParams.step = parseInt($routeParams.step);

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

angular.module('engine.document').factory('DocumentActionList', function (DocumentAction, engActionResource, $engineApiCheck, $q, $log) {
    function DocumentActionList(document, parentDocument, $scope) {
        $engineApiCheck([$engineApiCheck.object, $engineApiCheck.object.optional, $engineApiCheck.object.optional], arguments);

        if (parentDocument == null) parentDocument = {};

        var self = this;
        this.$scope = $scope;
        this.parentDocument = parentDocument;
        this.parentDocumentId = document.id ? null : parentDocument.id;
        this.actions = [];

        this.markInit = null;

        this.loadActions = function loadActions() {
            engActionResource.getAvailable(self.document, self.parentDocumentId || self.document.id).$promise.then(function (actions) {
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

    DocumentActionList.prototype._setDocument = function setDocument(document) {
        if (document == null || _.isEmpty(document) || document == this.document) return;

        var prevDoc = this.document;
        this.document = document;
        this.parentDocumentId = document.id ? null : this.parentDocumentId;
        // if(!prevDoc && prevDoc != null && !_.isEmpty(prevDoc))
        this.markInit();
        // else
        if (this.$ready.$$state.status === 0) this.$ready = this.loadActions();
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
}).factory('DocumentAction', function (engActionResource, $engineApiCheck, DocumentActionProcess, $log, $q) {
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

    DocumentAction.prototype.call = function call() {
        var self = this;
        var event = null;
        $log.debug('engine.document.actions', 'action called', this);

        if (this.$scope) {
            var promises = [];

            event = this.$scope.$broadcast('engine.common.action.before', { 'document': this.document,
                'action': this,
                'promises': promises });

            if (event.defaultPrevented) {
                this.$scope.$broadcast('engine.common.action.prevented', { 'document': this.document,
                    'action': this,
                    'event': event });
                return;
            }

            if (this.isSave()) {
                event = self.$scope.$broadcast('engine.common.save.before', { 'document': this.document,
                    'action': this,
                    'promises': promises });

                if (event.defaultPrevented) {
                    self.$scope.$broadcast('engine.common.action.prevented', { 'document': this.document,
                        'action': this,
                        'event': event });
                    return;
                }
            }
        }
        return $q.all(promises).then(function () {
            return engActionResource.invoke(self.actionId, self.document, self.parentDocumentId).$promise;
        }).then(function (result) {
            $log.debug('engine.document.actions', 'action call returned', result);
            if (self.$scope) {
                var ev1 = self.$scope.$broadcast('engine.common.action.after', { 'document': self.document, 'action': self, 'result': result });
                var ev2 = self.$scope.$broadcast('engine.common.save.after', { 'document': self.document, 'action': self, 'result': result });

                if (ev1.defaultPrevented || ev2.defaultPrevented) return result;
            }
            return DocumentActionProcess(self.document, result);
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

angular.module('engine.document').factory('DocumentCategoryFactory', function (DocumentCategory, $log) {
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

    DocumentCategoryFactory.prototype.makeStepCategory = function makeStepCategory() {
        var formStepStructure = {
            fieldGroup: null,
            templateOptions: { 'disabled': true },
            data: { hide: true },
            wrapper: 'step'
        };

        return formStepStructure;
    };

    DocumentCategoryFactory.prototype._registerBasicCategories = function _registerBasicCategories() {
        this.register(new DocumentCategory('row', function (formlyCategory, metricCategory, ctx) {
            formlyCategory.templateOptions.wrapperClass = '';
            formlyCategory.wrapper = 'row';
            formlyCategory.data.$process = function () {
                // TODO INCLUDE OPERATOR DEFINED WIDTHS
                // _.find(formlyCategory.fieldGroup, function (field) {
                //     return field.templateOptions.css == 'col-md-6';
                // });

                var size = Math.floor(12 / formlyCategory.fieldGroup.length);
                size = size < 1 ? 1 : size;

                _.forEach(formlyCategory.fieldGroup, function (field) {
                    field.templateOptions.css = 'col-md-' + size;
                });
            };
            return formlyCategory;
        }));

        this.register(new DocumentCategory('category', function (formlyCategory, metricCategory, ctx) {
            formlyCategory.templateOptions.wrapperClass = 'text-box';
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
                visualClass: metricCategory.visualClass
            },
            fieldGroup: null,
            wrapper: this.categoryWrapper,
            data: {
                hasMetrics: function hasMetrics() {
                    return DocumentCategory.hasMetrics(formlyCategory.fieldGroup);
                }
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

angular.module('engine.document').factory('DocumentFieldFactory', function (DocumentField, $engine, $log) {
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
            r.push({ name: option.value, value: option.value });
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

        this.register(new DocumentField({ visualClass: '@imgMultiSelect', inputType: 'MULTISELECT' }, function (field, metric, ctx) {
            field.type = 'multiSelectImage';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

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
                return new Date(originalValue);
            };
            return field;
        }));

        this.register(new DocumentField('checkbox', function (field, metric, ctx) {
            field.type = 'checkbox';

            return field;
        }));

        this.register(new DocumentField({ inputType: 'NUMBER' }, function (field, metric, ctx) {
            field.type = 'input';

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
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' + 'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + 'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: { ngModel: ctx.document, options: ctx.options }
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({ inputType: 'QUERIED_LIST' }, function (field, metric, ctx) {
            field = {
                data: field.data,
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '" on-select-behavior="' + metric.onSelectBehavior + '"></engine-document-list>',
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
        //emit reload request for dom element which wants to listen (eg. document)
        $scope.$emit('document.form.requestReload');

        $scope.options.data.form._onReload();
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
                position: metric.position,
                isMetric: true,
                form: ctx.documentForm,
                categoryId: metric.categoryId,
                id: metric.id //this is required for DocumentForm
            },
            templateOptions: {
                type: 'text',
                label: metric.label,
                description: metric.description,
                placeholder: 'Enter ' + metric.label,
                required: metric.required
            },
            expressionProperties: {
                'templateOptions.disabled': function templateOptionsDisabled($viewValue, $modelValue, scope) {
                    return scope.options.data.form.disabled;
                }
            },
            validation: {
                messages: {
                    required: function required(viewValue, modelValue, scope) {
                        if (scope.to.serverErrors == null || _.isEmpty(scope.to.serverErrors)) return scope.to.label + "_required";
                        return '';
                    },
                    server: function server(viewValue, modelValue, scope) {
                        return scope.to.serverErrors[0];
                    },
                    date: 'to.label+"_date"'
                }
            }
        };

        if (metric.reloadOnChange == true) {
            formlyField.templateOptions.onChange = DocumentField.onChange;
        }

        var ret = this.fieldCustomizer(formlyField, metric, ctx);

        //if metric uses non standard JSON data type (eg. DATE, call it's prepare method, to preprocess data before loading)
        if (_.isFunction(ret.data.prepareValue)) {
            ctx.document.metrics[metric.id] = ret.data.prepareValue(ctx.document.metrics[metric.id]);
        }

        return ret;
    };

    return DocumentField;
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
                }
            });

            _.forEach(newMetrics, function (newMetric) {
                console.log(self.categoriesDict[newMetric.categoryId]);
                self.addMetric(newMetric);
                var field = DocumentFieldFactory.makeField(self.metricList, newMetric, { document: self.document,
                    options: self.documentOptions,
                    documentForm: self });
                self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 0, field);

                self.categoriesDict[newMetric.categoryId].fieldGroup = _.sortBy(self.categoriesDict[newMetric.categoryId].fieldGroup, 'position');
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
        this.document = document;
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
    DocumentForm.prototype.init = function init(document, options, steps) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object)], arguments);

        this._setDocument(document);
        this._setOptions(options);
        this._setSteps(steps);

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
            var formStepStructure = DocumentCategoryFactory.makeStepCategory();
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
        });
        _.forEach(this.steps.getSteps(), function (step) {
            connectFields(step);
        });

        postprocess();

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

    DocumentForm.prototype.validate = function validate(step) {
        return this.validator.validate(step);
    };

    return DocumentForm;
});
'use strict';

angular.module('engine.document').factory('StepList', function (Step, $q, engineMetricCategories, $engineApiCheck, $log) {
    var _ac = $engineApiCheck;

    function StepList(documentOptionSteps) {
        var self = this;

        this.documentSteps = documentOptionSteps;
        this.steps = [];
        this.singleStep = false;
        this.$ready = null;
        this.currentStep = null;

        this._preprocessDocumentSteps();
    }

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

angular.module('engine.document').factory('DocumentValidator', function (engineDocument, $engineApiCheck, $log, Step) {
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

    DocumentValidator.prototype.makeDocumentForValidation = function makeDocumentForValidation(document, stepsToValidate) {
        var documentForValidation = _.omit(document, 'metrics');

        documentForValidation.metrics = {};

        _.forEach(stepsToValidate, function (step) {
            _.forEach(step.fields, function (field) {
                documentForValidation.metrics[field.data.id] = document.metrics[field.data.id];
                if (documentForValidation.metrics[field.data.id] === undefined) // if field has not been set, set it to null, otherwise it won't be sent
                    documentForValidation.metrics[field.data.id] = null;
            });
        });

        return documentForValidation;
    };

    DocumentValidator.prototype.validate = function validate(step) {
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

        var documentForValidation = this.makeDocumentForValidation(this.document, stepsToValidate);

        return engineDocument.validate(documentForValidation).$promise.then(function (validationData) {
            $log.debug(validationData);

            var _validatedMetrics = _.indexBy(validationData.results, 'metricId');

            _.forEach(stepsToValidate, function (step) {
                _.forEach(step.fields, function (field, fieldId) {
                    if (_validatedMetrics[fieldId].valid == false) {
                        step.setState(Step.STATE_INVALID);
                        if (self.formStructure[field.id] != null) {
                            _.forEach(_validatedMetrics[fieldId].messages, function (message) {
                                self.formStructure[field.id].$setValidity(message, false);
                            });
                            self.formStructure[field.id].$setValidity('server', false);
                            self.formStructure[field.id].$setValidity('required', true);

                            field.validation.show = true;
                        }
                        field.templateOptions.serverErrors = _validatedMetrics[fieldId].messages;
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

    _apiCheck.documentOptions = _apiCheck.shape({
        documentJSON: _apiCheck.object,
        name: _apiCheck.string,
        list: _apiCheck.shape({
            caption: _apiCheck.string,
            templateUrl: _apiCheck.string,
            createButtonLabel: _apiCheck.string.optional
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.object),
            showValidateButton: _apiCheck.bool.optional
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

    /**
     * @ngdoc method
     * @name dashboard
     * @methodOf engine.provider:$engineProvider
     *
     * @description
     * Register dashboard in angular-engine, angular URL will be generated queries to declared documents
     * will be displayed using column definitions in those declarations.
     *
     * @param {string} url Angular url to created dashboard
     * @param {Array} queries list of query objects
     * @param {Object} options Dashboard options
     */
    this.dashboard = function (url, queries, options) {
        var _options = {
            templateUrl: '/src/dashboard/dashboard.tpl.html'
        };

        options = angular.merge(_options, options);

        _apiCheck([_apiCheck.string, _apiCheck.arrayOf(_apiCheck.shape({
            queryId: _apiCheck.string,
            label: _apiCheck.string,
            documentModelId: _apiCheck.string,
            columns: _apiCheck.arrayOf(_apiCheck.shape({ name: _apiCheck.string, label: _apiCheck.string })).optional,
            showCreateButton: _apiCheck.bool.optional
        }), _apiCheck.shape({ templateUrl: _apiCheck.string }))], [url, queries, options]);

        options.queries = queries;

        $routeProvider.when(url, {
            templateUrl: options.templateUrl, controller: 'engineDashboardCtrl',
            options: options
        });

        dashboards.push({ 'url': url, 'queries': queries, 'options': options });
    };

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
     *                                {name: 'id'},
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
     * @param {string} listUrl url to list, which will be added to ngRoute
     * example: ```/simple-document/:id```
     *
     * @param {string} documentUrl url to document, which will be added to ngRoute, has to contain ```:id``` part
     * example: ```/simple-document/:id```
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
     *      Every element in the array should be object containing 'name' attribute which corresponds to
     *      either document property, or document metric. Dotted expression to access nested properties are allowed:
     *      <pre>{name: 'state.documentState'}</pre>
     *      additional properties which can be provided:
     *
     *      * **caption** {String} if set will be displayed in the column header row, will be translated
     *
     *      * **type** {String, one of: ['link', 'text', 'date']} specifies what type of data is stored in this
     *      document field, will be formatted accordingly. 'link' field will be formatted as text, but will be wrapped
     *      in `<a>` tag allowing navigation to the selected document.
     *
     *
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
     *
     *    * **showValidationButton** {Boolean}, *Optional*, default `true` if true shows 'Validate' button at
     *    the end of document form
     *
     *    * **summary** {Boolean}, *Optional*, default `true` if true adds additional step to document form, which
     *    will contain non editable document summary. **(NOT IMPLEMENTED YET)**
     *
     * For example object see this method's description.
     *
     *
     */
    this.document = function (documentModelType, listUrl, documentUrl, query, options) {
        options = angular.merge(angular.copy(_defaultDocumentOptions), options);

        _apiCheck.throw([_apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

        assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

        options.documentModelType = documentModelType;
        options.listUrl = listUrl;
        options.list.url = listUrl;
        options.documentUrl = documentUrl;
        options.document.url = documentUrl;
        options.query = query;
        options.subdocument = false;

        documents.push({ list_route: listUrl, document_route: documentUrl });

        $routeProvider.when(listUrl, {
            templateUrl: options.list.templateUrl, controller: 'engineListWrapperCtrl',
            options: options
        });

        $routeProvider.when(documentUrl, {
            templateUrl: options.document.templateUrl, controller: 'engineDocumentWrapperCtrl',
            options: options,
            reloadOnSearch: false
        });

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
     * **NOTE** The only difference between this method and {@link engine.privider:$engineProvider#methods_document $engineProvider.document(...)}
     * is the fact, that ngRoutes are **not** generated for each registered subdocument.
     *
     * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
     * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
     * if argument is a string it will be treated as a group **metric category** and list of queries will be generated from its children
     * @param {Object} options Document options object conforming to format described in
     * {@link engine.privider:$engineProvider#methods_document $engineProvider.document}
     *
     *
     */
    this.subdocument = function (documentModelType, query, options) {
        options = angular.merge(angular.copy(_defaultDocumentOptions), options);

        _apiCheck.throw([_apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, query, options]);

        assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

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

    var _visibleDocumentFields = [{ name: 'id', caption: 'ID', type: 'link' }, { name: 'name', caption: 'Name' }];

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
    this.$get = function ($engineFormly) {
        var _engineProvider = self;

        return new function ($rootScope, $log) {
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
        }();
    };
});
;'use strict';

angular.module('engine').factory('engineResolve', function () {
    function index(obj, i) {
        return obj[i];
    }

    return function (baseObject, str) {
        return str.split('.').reduce(index, baseObject);
    };
}).service('engineQuery', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {

    var _query = $resource($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=:query&attachAvailableActions=true&documentId=:documentId', { query_id: '@query', documentId: '@documentId' }, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (query, parentDocumentId, callback, errorCallback) {
        $engineApiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments);
        return _query.get({ query: query, documentId: parentDocumentId }, callback, errorCallback);
    };
}).service('engineDashboard', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, engineQuery) {

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
    var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', {
        actionId: '@actionId',
        documentId: '@documentId'
    }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    return function (actionId, document, callback, errorCallback, parentDocumentId) {
        $engineApiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _action.post({ actionId: actionId, documentId: parentDocumentId || document.id }, document, callback, errorCallback);
    };
}).service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _document = $resource('', { documentId: '@documentId' }, {
        getDocument: { url: $engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true',
            method: 'POST', transformResponse: EngineInterceptor.response },
        validate: { url: $engineConfig.baseUrl + '/validate-metric-values',
            method: 'POST', transformResponse: EngineInterceptor.response }
    });

    return {
        get: function get(documentId, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.string, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments, errorCallback);

            //null is passed explicitly to POST data, to ensure engine compatibility
            return _document.getDocument({ documentId: documentId }, null, callback, errorCallback);
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

            return _document.validate({}, document, callback, errorCallback);
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

var ENGINE_COMPILATION_DATE = '2016-12-19T18:55:53.876Z';
var ENGINE_VERSION = '0.6.16';
var ENGINE_BACKEND_VERSION = '1.0.80';

angular.module('engine').value('version', ENGINE_VERSION);
angular.module('engine').value('backendVersion', ENGINE_BACKEND_VERSION);
'use strict';

angular.module('engine.formly').provider('$engineFormly', function () {
    var self = this;

    var _typeTemplateUrls = {
        input: '/src/formly/types/templates/input.tpl.html',
        select: '/src/formly/types/templates/select.tpl.html',
        checkbox: '/src/formly/types/templates/checkbox.tpl.html',
        radio: '/src/formly/types/templates/radio.tpl.html',
        radioGroup: '/src/formly/types/templates/radioGroup.tpl.html',
        textarea: '/src/formly/types/templates/textarea.tpl.html',
        datepicker: '/src/formly/types/templates/datepicker.tpl.html',
        multiCheckbox: '/src/formly/types/templates/multiCheckbox.tpl.html',
        multiSelect: '/src/formly/types/templates/multiSelect.tpl.html',
        multiSelectImage: '/src/formly/types/templates/multiSelectImage.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/wrappers/templates/category.tpl.html',
        label: '/src/formly/wrappers/templates/label.tpl.html',
        hasError: '/src/formly/wrappers/templates/has-error.tpl.html',
        step: '/src/formly/wrappers/templates/step.tpl.html',
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
                    initDate: new Date()
                }
            }
        },
        controller: function controller($scope) {
            $scope.openedDatePopUp = false;

            $scope.today = function () {
                $scope.model[$scope.options.key] = $filter('date')(new Date(), 'yyyy-MM-dd');
            };

            $scope.openPopUp = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.openedDatePopUp = true;
            };

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
        name: 'default',
        templateUrl: $engineFormly.wrapperUrls['default']
    });
});
'use strict';

angular.module('engine.list').component('engineDocumentList', {
    templateUrl: '/src/list/list.tpl.html',
    controller: 'engineListCtrl',
    bindings: {
        options: '=',
        query: '=',
        formWidget: '@',
        parentDocument: '=',
        showCreateButton: '=',
        listCaption: '=',
        columns: '=',
        onSelectBehavior: '@'
    }
}).controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction, engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal, $log) {
    var self = this;
    self.engineResolve = engineResolve;
    //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
    this.formWidget = this.formWidget === 'true';

    $scope.$watch('$ctrl.showCreateButton', function (oldVal, newVal) {
        if (self.showCreateButton == undefined) self._showCreateButton = true;else self._showCreateButton = newVal;
    });

    $scope.options = this.options;
    $scope.columns = this.columns || $scope.options.list.columns;

    $scope.query = self.query || $scope.options.query;

    var _parentDocumentId = this.parentDocument ? this.parentDocument.id : undefined;
    $scope.documents = engineQuery($scope.query, _parentDocumentId);

    $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON, _parentDocumentId);

    $scope.engineAction = function (action, document) {

        if (action.type == 'LINK') {
            return engineAction(action.id, self.parentDocument).$promise.then(function (data) {
                $scope.documents = engineQuery($scope.query);
            }, undefined, document.id);
        } else {
            return engineAction(action.id, document).$promise.then(function (data) {
                $scope.documents = engineQuery($scope.query);
            });
        }
    };

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

    $scope.renderCell = function (document, column) {
        return document[column.name];
    };
    $scope.getCellTemplate = function (document, column, force_type) {
        if (!force_type && column.type == 'link') {
            return '/src/list/cell/link.tpl.html';
        }

        if (column.type) {
            if (column.type == 'date') return '/src/list/cell/date.tpl.html';
        }
        return '/src/list/cell/text.tpl.html';
    };
    $scope.onDocumentSelect = function (document) {
        if (_parentDocumentId) {
            if (self.onSelectBehavior == 'LINK') {
                var linkAction = engineActionUtils.getLinkAction(document.actions);

                if (linkAction != null) $scope.engineAction(linkAction, document);else $log.warn(self.query, ' QueriedList onSelectBehavior set as Link, but document does not have link action available');
            } else {
                DocumentModal(document.id, $scope.options, _parentDocumentId, function () {
                    $scope.documents = engineQuery($scope.query, _parentDocumentId);
                });
            }
        } else {
            $location.path($scope.genDocumentLink(document.id));
        }
    };

    $scope.genDocumentLink = function (documentId) {
        return $scope.options.documentUrl.replace(':id', documentId);
    };

    $scope.onCreateDocument = function () {
        if ($scope.options.subdocument == true) DocumentModal(undefined, $scope.options, self.parentDocument, function () {
            $scope.documents = engineQuery($scope.query, self.parentDocument.id);
        });else $location.path($scope.genDocumentLink('new'));
    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };
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
  $templateCache.put("/src/common/document-actions/document-actions.tpl.html", "<button type=\"submit\" class=\"btn btn-primary dark-blue-btn\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"!$ctrl.steps.isLast($ctrl.step)\" translate>Next Step:</button>\n<button type=\"submit\" class=\"btn btn-primary\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"!$ctrl.steps.isLast($ctrl.step)\">{{$ctrl.step+2}}. {{$ctrl.steps.getStep($ctrl.step).name}}</button>\n\n<button type=\"submit\" ng-if=\"$ctrl.showValidationButton && $ctrl.steps.isLast($ctrl.step)\"\n        class=\"btn btn-default\" ng-click=\"$ctrl.validate()\" translate>Validate</button>\n\n<button type=\"submit\" ng-repeat=\"action in $ctrl.actionList.actions\" ng-if=\"$ctrl.steps.isLast($ctrl.step)\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"action.call()\" translate>{{action.label}}</button>\n\n<button type=\"submit\" ng-repeat=\"button in $ctrl.customButtons\" ng-if=\"$ctrl.steps.isLast($ctrl.step)\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"button.action()\" translate>{{button.label}}</button>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/dashboard/dashboard.tpl.html", "<engine-document-list ng-repeat=\"query in queries\" show-create-button=\"query.showCreateButton\" columns=\"query.columns\"\n                      query=\"query.queryId\" options=\"$engine.getOptions(query.documentModelId)\" list-caption=\"query.label\"></engine-document-list>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 class=\"modal-title\" id=\"myModalLabel\">CREATE {{options.name}}</h4>\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document parent-document=\"parentDocument\" step-list=\"stepList\" document=\"document\" document-id=\"{{::documentId}}\" step=\"step\" options=\"documentOptions\"></engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" custom-buttons=\"customButtons\"\n                             document=\"document\" document-scope=\"$scope\" document-parent=\"parentDocument\"\n                             steps=\"stepList\" step=\"step\" class=\"btn-group float-left\"></engine-document-actions>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div class=\"eng-loading-box\" ng-show=\"$ctrl.$ready.$$state.status === 0\">\n    <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n</div>\n\n<div ng-show=\"$ctrl.$ready.$$state.status === 1\" ng-cloak>\n    <form ng-submit=\"$ctrl.onSubmit()\" name=\"$ctrl.documentForm.formlyState\" novalidate>\n        <formly-form model=\"$ctrl.document\" fields=\"$ctrl.documentForm.formStructure\" class=\"horizontal\"\n                     options=\"$ctrl.documentForm.formlyOptions\" form=\"$ctrl.documentForm.formlyState\">\n\n            <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" ng-if=\"!$ctrl.options.subdocument\"\n                                     document=\"$ctrl.document\" document-scope=\"documentScope\"\n                                     steps=\"$ctrl.stepList\" step=\"$ctrl.step\" class=\"btn-group\"></engine-document-actions>\n        </formly-form>\n    </form>\n</div>\n\n<div ng-show=\"!$ctrl.$ready.$$state.status === 2\" ng-cloak>\n    REJECTED\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <h1>CREATE {{ options.name }}: <span class=\"bold\" ng-if=\"steps.length > 0\">{{steps[$routeParams.step].name}} {{$routeParams.step + 1}}/{{steps.length}}</span></h1>\n    <engine-document step-list=\"stepList\" show-validation-button=\"options.document.showValidationButton\" document-id=\"{{::documentId}}\" document=\"document\" step=\"$routeParams.step\" options=\"options\" class=\"col-md-8\"></engine-document>\n    <engine-steps ng-model=\"document\" step=\"$routeParams.step\" step-list=\"stepList\" options=\"options\" class=\"col-md-4\"></engine-steps>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.stepList.steps\" ng-class=\"{active: $ctrl.stepList.getCurrentStep() == _step}\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\">\n                    <i class=\"fa\" aria-hidden=\"true\" style=\"display: inline-block\"\n                       ng-class=\"{'fa-check-circle' : _step.getState() == 'valid',\n                                  'fa-circle-o': _step.getState() == 'blank',\n                                  'fa-cog fa-spin': _step.getState() == 'loading',\n                                  'fa-times-circle-o': _step.getState() == 'invalid'}\"></i>\n                </span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/checkbox.tpl.html", "<div class=\"checkbox\">\n\t<label>\n\t\t<input type=\"checkbox\"\n           class=\"formly-field-checkbox\"\n\t\t       ng-model=\"model[options.key]\">\n\t\t{{to.label}}\n\t\t{{to.required ? '*' : ''}}\n\t</label>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/datepicker.tpl.html", "<p class=\"input-group input-group-datepicker\">\n    <input id=\"{{::id}}\"\n           name=\"{{::id}}\"\n           ng-model=\"model[options.key]\"\n           class=\"form-control datepicker\"\n           type=\"text\"\n           uib-datepicker-popup=\"{{to.datepickerOptions.format || 'yyyy-MM-dd'}}\"\n           is-open=\"openedDatePopUp\"\n           show-button-bar=\"false\"\n           datepicker-options=\"to.datepickerOptions || todayMinValueDateOptions\"\n           ng-click=\"openPopUp($event)\"/>\n    <span class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"openPopUp($event)\">\n            <i class=\"glyphicon glyphicon-calendar\"></i>\n        </button>\n    </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/input.tpl.html", "<input class=\"form-control\" ng-model=\"model[options.key]\" placeholder=\"{{options.templateOptions.placeholder | translate}}\">");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiCheckbox.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\"\n             id=\"{{id + '_'+ $index}}\"\n             ng-model=\"multiCheckbox.checked[$index]\"\n             ng-change=\"multiCheckbox.change()\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelect.tpl.html", "<div>\n    <div class=\"radio-box\" ng-class=\"{'radio-box-last': $last, 'radio-box-first': $first, 'radio-box-active': model[options.key] == option.value}\"\n         ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <span class=\"radio-desc\">{{::option.name}}</span>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiSelectImage.tpl.html", "<div>\n    <div ng-repeat=\"option in to.options\">\n        <input type=\"checkbox\" id=\"{{id}}_{{::option.value}}\" checklist-model=\"model[options.key]\" checklist-value=\"option.value\">\n        <label class=\"\" style=\"top: -3px; position: relative;\" for=\"{{id}}_{{::option.value}}\">\n            <span class=\"\" >{{::option.name}}</span>\n        </label>\n    </div>\n</div>");
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
  $templateCache.put("/src/formly/wrappers/templates/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\" ng-show=\"options.data.hasMetrics()\">\n    <h3 ng-if=\"options.templateOptions.label\" translate>{{options.templateOptions.label}}</h3>\n    <div>\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/default.tpl.html", "<div class=\"{{::options.to.categoryWrapperCSS}}\">\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/has-error.tpl.html", "<div class=\"form-group {{::to.css}}\" ng-class=\"{'has-error': showError }\">\n  <formly-transclude></formly-transclude>\n  <div ng-if=\"showError\" class=\"error-messages\">\n    <div ng-repeat=\"(key, error) in fc.$error\" class=\"message help-block ng-binding ng-scope\" translate>{{options.validation.messages[key](fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  <!-- after researching more about ng-messages integrate it\n  <div ng-messages=\"fc.$error\" ng-if=\"showError\" class=\"error-messages\">\n    <div ng-message=\"{{ ::name }}\" ng-repeat=\"(name, message) in ::options.validation.messages\" class=\"message help-block ng-binding ng-scope\" translate>{{ message(fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n  -->\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/label.tpl.html", "<div class=\"\">\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        <span translate>{{to.label}}</span>\n        {{to.required ? '*' : ''}}\n        <span translate class=\"grey-text\" ng-if=\"to.description\" translate>({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/row.tpl.html", "<div>\n    <div class=\"row  {{options.templateOptions.wrapperClass}}\">\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/step.tpl.html", "<div ng-hide=\"options.data.hide\">\n    <formly-transclude></formly-transclude>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/date.tpl.html", "{{$ctrl.engineResolve(document_entry.document, column.name) | date}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/link.tpl.html", "<a href=\"\" ng-click=\"onDocumentSelect(document_entry.document)\" class=\"proposal-title\" ng-include=\"getCellTemplate(document_entry.document, column, true)\"></a>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/text.tpl.html", "{{$ctrl.engineResolve(document_entry.document, column.name)}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.tpl.html", "<h1>{{ $ctrl.listCaption || options.list.caption }}</h1>\n\n<div class=\"text-box\">\n    <div class=\"eng-loading-box\" ng-show=\"!documents.$resolved\">\n        <i class=\"fa fa-spinner fa-spin\" aria-hidden=\"true\"></i>\n    </div>\n    <div ng-if=\"documents.$resolved\" ng-cloak>\n        <table class=\"proposal-list\">\n            <tr>\n                <th class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" ng-repeat=\"column in columns\">{{column.caption || column.name}}</th>\n                <th class=\"text-right\"></th>\n            </tr>\n            <tr ng-repeat=\"document_entry in documents\">\n                <td ng-repeat=\"column in columns\" class=\"{{column.css}}\" ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n                <td class=\"text-right\" style=\"padding-top: 5px\">\n                    <div class=\"dropdown\" style=\"height: 9px;\" ng-if=\"document_entry.actions.length > 0\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\"><span class=\"glyphicon glyphicon-cog\"></span></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in document_entry.actions\"><a href=\"\" ng-click=\"engineAction(action, document_entry.document)\">{{action.label}}</a></li>\n                            <li ng-if=\"!document_entry.actions\"><span style=\"margin-left: 5px; margin-right: 5px;\">No actions available</span></li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n        </table>\n    </div>\n</div>\n<a href=\"\" ng-if=\"$ctrl._showCreateButton && canCreateDocument()\" ng-click=\"onCreateDocument()\" class=\"btn btn-primary\">\n    <span ng-if=\"!$ctrl.options.list.createButtonLabel\">create {{options.name}}</span>\n    <span ng-if=\"$ctrl.options.list.createButtonLabel\">{{$ctrl.options.list.createButtonLabel | translate}}</span>\n</a>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.wrapper.tpl.html", "<engine-document-list ng-repeat=\"query in queries\" show-create-button=\"$last\" query=\"query.id\" options=\"options\" list-caption=\"query.label\"></engine-document-list>");
}]);

//# sourceMappingURL=templates.js.map
;
//# sourceMappingURL=angular-engine.js.map