'use strict';

angular.module('engine.common', []);
'use strict';

angular.module('engine.dashboard', ['ngRoute', 'engine.list']);
'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'engine.formly', 'ui.bootstrap', 'engine.common', 'engine.list', 'engine.dashboard', 'engine.steps', 'ngMessages', 'pascalprecht.translate', 'engine.document']);
;'use strict';

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
    var isSaveAction = function isSaveAction(action) {
        if (_.contains(ENGINE_SAVE_ACTIONS, action.type)) return true;
        return false;
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
        isSaveAction: isSaveAction
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
            if (!_.isEmpty(newDocument) && newDocument != null && newDocument != oldDocument) self.actionList.setDocument(newDocument);
        });
        self.actionList = new DocumentActionList(self.document, self.documentParentId, self._documentScope);
    },
    bindings: {
        documentScope: '=',
        document: '=',
        options: '=',
        step: '=',
        showValidationButton: '=',
        documentParentId: '@'
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
        ngModel: '=',
        options: '=',
        steps: '=',
        step: '=',
        validatedSteps: '=',
        showValidationButton: '=',
        documentId: '@',
        actions: '=',
        parentDocumentId: '@'
    }
}).controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument, engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx, engineAction, engineMetricCategories, StepList, DocumentForm, DocumentActionList, $q, $log) {
    var self = this;
    console.log($scope);
    $scope.documentScope = $scope;
    $scope.document = null;
    $scope.steps = this.options.document.steps;

    this.actionList = null;
    this.stepList = new StepList($scope.steps);
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
        assert(self.documentForm.$ready, message);

        self.stepList.setCurrentStep(self.step);

        var _actionsToPerform = [];

        //if the document exists, the first action will be retriving it
        if (self.documentId && self.documentId != 'new') {
            _actionsToPerform.push(engineDocument.get(self.documentId).$promise.then(function (data) {
                $scope.document = data.document;
            }));
        } //if document does not exist copy base from optionas, and set the name
        else {
                $scope.document = angular.copy(self.options.documentJSON);
                $scope.document.name = (self.options.name || 'Document') + ' initiated on ' + new Date();
            }

        // return chained promise, which will do all other common required operations:
        return $q.all(_actionsToPerform).then(function () {
            self.actionList = new DocumentActionList($scope.document, self.parentDocumentId);
            return self.actionList.$ready;
        }).then(function () {
            self.documentForm.init($scope.document, self.options, self.stepList);
            //load metrics to form
            return self.documentForm.loadMetrics();
        });
    };

    /**
     * This method is called after whole document was initiated,
     * here all $watch, and other such methods should be defined
     */
    this.postinitDocument = function postinitDocument() {
        self.documentForm.makeForm();

        $scope.$watch('$ctrl.step', function (newStep, oldStep) {
            if (newStep != oldStep) self.save();
            self.documentForm.setStep(newStep);
        });
    };

    this.save = function () {
        return self.actionList.callSave();
    };

    $scope.onChangeStep = function (newStep, oldStep) {
        if (self.isEditable()) {
            if ($scope.document.id) {
                var stepToValidate = oldStep;

                self.validatedSteps[stepToValidate] = 'loading';

                var _documentPart = angular.copy($scope.document);
                _documentPart.metrics = {};

                var _categoriesToValidate = $scope.steps[stepToValidate].categories;

                angular.forEach(self.allMetrics_d, function (metric, metricId) {
                    if (_.contains(_categoriesToValidate, metric.categoryId)) _documentPart.metrics[metricId] = $scope.document.metrics[metricId];
                });

                engineDocument.validate(_documentPart, function (data) {
                    console.log(data);
                    self.form.form.$externalValidated = true;
                    self.form.backendValidation = data;

                    if (self.form.backendValidation.valid) self.validatedSteps[stepToValidate] = 'valid';else self.validatedSteps[stepToValidate] = 'invalid';

                    angular.forEach(self.form.backendValidation.results, function (metric) {
                        if (metric.metricId in $scope.metrics && $scope.metrics[metric.metricId].formControl) {
                            $scope.metrics[metric.metricId].validation.show = true;
                            $scope.metrics[metric.metricId].formControl.$validate();
                        }
                    });

                    // self.form.form.$setValidity('proposalName', false. self.form.form);
                }, function (response) {
                    self.validatedSteps[stepToValidate] = 'invalid';
                });
            }
        } else {
            self.step = newStep;
        }
    };

    $scope.$on('engine.common.document.validate', function () {
        self.documentForm.validate();
    });

    $scope.$on('engine.common.action.after', function (event, document, action, result) {});

    $q.all(this.stepList.$ready, this.documentForm.$ready).then(this.initDocument).then(this.postinitDocument).then(function () {
        $log.debug('engineDocumentCtrl initialized: ', self);
    });
});
'use strict';

angular.module('engine.document').factory('DocumentModal', function ($resource, $uibModal) {
    return function (_documentOptions, parentDocumentId, callback) {
        var modalInstance = $uibModal.open({
            templateUrl: '/src/document/document-modal.tpl.html',
            controller: function controller($scope, documentOptions, engineActionsAvailable, $uibModalInstance) {
                $scope.documentOptions = documentOptions;
                $scope.parentDocumentId = parentDocumentId;
                $scope.validatedSteps = [];

                $scope.engineAction = function (action) {
                    $scope.$broadcast('engine.common.action.invoke', action, $scope.closeModal);
                };

                $scope.closeModal = function () {
                    $uibModalInstance.close();
                };
            },
            size: 'lg',
            resolve: {
                documentOptions: function documentOptions() {
                    return _documentOptions;
                }
            }
        });
        modalInstance.result.then(function (result) {
            if (callback) callback(result);
        }, function () {});
    };
});
'use strict';

angular.module('engine.document').controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams) {
    $scope.validatedSteps = [];
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    if (angular.isArray($scope.steps)) angular.forEach($scope.steps, function (step) {
        $scope.validatedSteps.push('blank');
    });
    $scope.document = {};
    $scope.documentId = $routeParams.id;
    if ($routeParams.step === undefined) $routeParams.step = 0;
    $scope.$routeParams = $routeParams;

    $scope.$watch('$routeParams.step', function (newVal, oldVal) {
        if (angular.isString(newVal)) {
            newVal = parseInt(newVal);
            $routeParams.step = newVal;
        }
        if (newVal !== oldVal) {
            $location.search({ step: newVal || 0 });
        }
    });
});
'use strict';

angular.module('engine.document').factory('DocumentActionList', function (DocumentAction, engActionResource, $engineApiCheck, $q, $log) {
    function DocumentActionList(document, parentDocumentId, $scope) {
        $engineApiCheck([$engineApiCheck.object, $engineApiCheck.string.optional, $engineApiCheck.object.optional], arguments);

        var self = this;
        this.$scope = $scope;
        this.document = document;
        this.parentDocumentId = parentDocumentId;
        this.actions = [];

        this.$ready = this.loadActions();
    }

    DocumentActionList.prototype.loadActions = function loadActions() {
        var self = this;
        engActionResource.getAvailable(this.document, this.parentDocumentId || this.document.id).$promise.then(function (actions) {
            self.actions = [];
            _.forEach(actions, function (action) {
                self.actions.push(new DocumentAction(action, self.document, self.parentDocumentId, self.$scope));
            });
        });
    };

    DocumentActionList.prototype.setDocument = function setDocument(document) {
        this.document = document;
        this.loadActions();
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
}).factory('DocumentAction', function (engActionResource, $engineApiCheck, DocumentActionProcess, $log) {
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

        if (this.$scope) {
            event = this.$scope.$broadcast('engine.common.action.before', this.document, this);

            if (event.defaultPrevented) {
                this.$scope.$broadcast('engine.common.action.prevented', new this.document(), this, event);
                return;
            }

            if (this.isSave()) {
                event = this.$scope.$broadcast('engine.common.save.before', this.document, this);

                if (event.defaultPrevented) {
                    this.$scope.$broadcast('engine.common.action.prevented', this.document, this, event);
                    return;
                }
            }
        }
        return engActionResource.invoke(this.actionId, this.document, this.parentDocumentId).$promise.then(function (result) {
            $log.debug('engine.document.actions', 'action call returned', result);
            if (self.$scope) {
                self.$scope.$broadcast('engine.common.action.after', self.document, self, result);
                self.$scope.$broadcast('engine.common.save.after', self.document, self, result);
            }
            return DocumentActionProcess(self.document, result);
        });
    };

    DocumentAction.prototype.isSave = function isSave() {
        return _.contains(this.SAVE_ACTIONS, this.type);
    };

    return DocumentAction;
}).factory('DocumentActionProcess', function ($location, $engine, engineDocument, $log, $q) {

    return function DocumentActionHandler(document, actionResponse) {
        if (actionResponse.type == 'REDIRECT') {
            if (document.id == actionResponse.redirectToDocument) return $q.resolve();

            //before redirecting, load document from engine to ascertain it's document type
            return engineDocument.get(actionResponse.redirectToDocument).$promise.then(function (data) {
                var search = {};

                if (document.id != null && document.id != actionResponse.redirectToDocument) {
                    search.step = 0;
                }

                var documentOptions = $engine.getOptions(data.document.states.documentType);

                if (documentOptions == null) {
                    var message = 'Document type to which redirection was requested has not been registrated! ' + 'Make sure to register it in $engineProvider';

                    $log.error(message, 'DocumentType=', data.document.states.documentType);

                    throw new Error(message);
                }

                $location.$$search = search;
                $location.$$path = $engine.pathToDocument(documentOptions, actionResponse.redirectToDocument);
                $location.$$compose();

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
        for (var i = 0; i < this._categoryTypeList.length; ++i) {
            if (this._categoryTypeList[i].matches(category)) return this._categoryTypeList[i].makeCategory(category, ctx);
        }

        return this._defaultCategory.makeCategory(category, ctx);
    };

    DocumentCategoryFactory.prototype._registerBasicCategories = function _registerBasicCategories() {
        this.register(new DocumentCategory('row', function (formlyCategory, metricCategory, ctx) {
            formlyCategory.templateOptions.wrapperClass = '';
            formlyCategory.wrapper = 'row';
            formlyCategory.data.$process = function () {
                $log.debug('calling $process on DocumentCategory', formlyCategory);

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

        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';
    }

    DocumentCategory.prototype.matches = function matches(metricCategory) {
        return this.categoryCondition(metricCategory);
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
            data: {}
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

    DocumentFieldFactory.prototype.makeField = function makeField(metricList, metric, ctx) {
        for (var i = 0; i < this._fieldTypeList.length; ++i) {
            if (this._fieldTypeList[i].matches(metric)) return this._fieldTypeList[i].makeField(metricList, metric, ctx);
        }
        if (!this.allowDefaultField) {
            var message = "DocumentFieldFactory.allowDefaultField is false but there was a metric which could not be matched to registered types: ";
            $log.error(message, "Metric", metric, "Registered types", this._fieldTypeList);
            throw new Error(message);
        }
        return this._defaultField.makeField(metricList, metric, ctx);
    };

    /**
     *
     * @param metricList
     * @returns {Array}
     */
    DocumentFieldFactory.prototype.makeFields = function make(metricList, ctx) {
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

        this.register(new DocumentField('select', function (field, metric, ctx) {
            field.type = 'select';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField('radioGroup', function (field, metric, ctx) {
            field.type = 'radio';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({ visualClass: 'date', inputType: 'DATE' }, function (field, metric, ctx) {
            field.type = 'datepicker';

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
                data: {
                    categoryId: metric.categoryId,
                    id: metric.id //this is required for DocumentForm
                },
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' + 'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + 'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: { ngModel: ctx.document, options: ctx.options }
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({ inputType: 'QUERIED_LIST' }, function (field, metric, ctx) {
            field = {
                data: {
                    categoryId: metric.categoryId,
                    id: metric.id //this is required for DocumentForm
                },
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '"></engine-document-list>',
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
            // expressionProperties: {
            // 'templateOptions.disabled': self.isDisabled
            // },
            // validators: {
            // },
            validation: {
                // show: true,
                messages: {
                    required: 'to.label+"_required"'
                }
            }
        };

        if (metric.reloadOnChange) {
            //:TODO: make reload listener
        }

        return this.fieldCustomizer(formlyField, metric, ctx);
    };

    return DocumentField;
});
'use strict';

angular.module('engine.document').factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, DocumentCategoryFactory, $engineApiCheck, $log, DocumentValidator) {
    var _apiCheck = $engineApiCheck;

    function DocumentForm() {
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.documentOptions = null;
        this.steps = null;
        this.disabled = true;
        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';
        this.formStructure = [];
        this.formlyFields = [];
        this.validator = null;
        this.currentStep = null;
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {object}
         */
        this.formlyState = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {{}}
         */
        this.formlyOptions = {};

        this.$ready = this.loadMetricCategories();
    }

    DocumentForm.prototype.loadMetricCategories = function loadMetricCategories() {
        var self = this;

        return engineMetricCategories.then(function (metricCategories) {
            self.metricCategories = metricCategories;
        });
    };
    DocumentForm.prototype.setDocument = function setDocument(document) {
        this.document = document;
    };
    DocumentForm.prototype.setOptions = function setOptions(documentOptions) {
        this.documentOptions = documentOptions;
    };
    DocumentForm.prototype.setSteps = function setSteps(steps) {
        this.steps = steps;
    };
    DocumentForm.prototype.init = function init(document, options, steps) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object)], arguments);

        this.setDocument(document);
        this.setOptions(options);
        this.setSteps(steps);
    };

    DocumentForm.prototype.setEditable = function setEditable(editable) {
        this.disabled = !editable;
    };

    DocumentForm.prototype.setStep = function setStep(step) {
        this.formlyFields = this.formStructure[step];
        this.currentStep = step;
        $log.debug('current fields to display in form', this.formlyFields);
    };

    DocumentForm.prototype.assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document' + message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions' + message);
        assert(this.steps != null, 'DocumentForm.steps' + message);
    };

    DocumentForm.prototype.makeForm = function makeForm() {
        var self = this;

        console.log('DocumentForm.makeForm', this.fieldList);
        this.assertInit();

        assert(this.metricList.$resolved == true, 'Called DocumentForm.makeForm() before calling DocumentForm.loadMetrics');
        assert(this.metricCategories.$resolved == true, 'Called DocumentForm.makeForm() before calling DocumentForm.loadMetricCategories');

        var _metricDict = {};
        var _categoriesToPostProcess = [];

        _.forEach(this.steps.getSteps(), function (step) {
            self.formStructure.push(parseMetricCategories(step.metricCategories));
        });

        connectFields();
        postprocess();

        this.validator = new DocumentValidator(this.steps, this.formlyFields);

        console.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(metricCategories) {
            var formCategories = [];

            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, { document: self.document });

                formMetricCategory.fieldGroup = parseMetricCategories(metricCategory.children);

                _metricDict[metricCategory.id] = formMetricCategory;
                if (_.isFunction(formMetricCategory.data.$process)) _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields() {
            _.forEach(self.fieldList, function (field) {
                if (_metricDict[field.data.categoryId] === undefined) {
                    $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!', 'field', field, 'categoryId', field.data.categoryId);
                    return;
                }

                _metricDict[field.data.categoryId].fieldGroup.push(field);
            });
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            });
        }
    };

    DocumentForm.prototype.updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, { document: this.document, options: this.documentOptions });
    };

    DocumentForm.prototype.loadMetrics = function loadMetrics() {
        var self = this;

        return engineMetric(this.document, function (metricList) {
            self.metricList = metricList;

            angular.forEach(self.metricList, function (metric) {
                self.metricDict[metric.id] = metric;
            });

            self.updateFields(self.metricList);
        }).$promise;
    };

    DocumentForm.prototype.validate = function validate() {
        return this.validator.validate(this.currentStep);
    };

    return DocumentForm;
});
'use strict';

angular.module('engine.document').factory('StepList', function (Step, $q, engineMetricCategories, $engineApiCheck) {
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

                    self.steps.push(new Step(_categories));
                } else {
                    //is string (metricCategory) so we have to retrieve its children
                    self.steps.push(new Step(metricCategories.metrics[step.categories].children));
                }
            });
        });
    };

    StepList.prototype.isLast = function isLast(step) {
        return step == this.steps.length - 1;
    };

    StepList.prototype.getFirstInvalid = function getFirstInvalid() {
        _.find(this.steps, function (step) {
            return step.state == Step.STATE_INVALID;
        });
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

    return StepList;
}).factory('Step', function () {

    function Step(metricCategories, visible) {
        this.metricCategories = metricCategories;
        this.fields = [];
        this.visible = visible != null;
        this.state = this.defaultState;
        this.$valid = false;
    }

    Step.prototype.STATE_VALID = 'valid';
    Step.prototype.STATE_INVALID = 'invalid';
    Step.prototype.STATE_BLANK = 'blank';
    Step.prototype.STATE_LOADING = 'loading';
    Step.prototype.validStates = [this.STATE_VALID, this.STATE_INVALID, this.STATE_LOADING, this.STATE_BLANK];
    Step.prototype.defaultState = 'blank';

    Step.prototype.setState = function setState(state) {
        _ac([_ac.oneOf(this.validStates)], arguments);
        this.state = state;
    };

    return Step;
});
'use strict';

angular.module('engine.document').factory('DocumentValidator', function ($log) {
    function DocumentValidator(stepList, fieldList) {
        this.stepList = stepList;
        this.fieldList = fieldList;
    }

    DocumentValidator.prototype.validate = function validate(step) {
        $log.debug('DocumentValidator.validate called');

        if (self.validatedSteps) for (var i = 0; i < self.validatedSteps.length; ++i) {
            self.validatedSteps[i] = 'loading';
        } // engineDocument.validate($scope.document, function (data) {
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
            $timeout(self.ngChange);
        };
    },
    bindings: {
        ngModel: '=',
        step: '=',
        steps: '=',
        options: '=',
        ngChange: '&',
        validatedSteps: '='
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
}).provider('$engine', function ($routeProvider, $engineApiCheckProvider, $engineFormlyProvider) {
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
            createButtonLabel: _apiCheck.string
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.shape({
                name: _apiCheck.string,
                categories: _apiCheck.arrayOf(_apiCheck.string)
            })),
            showValidateButton: _apiCheck.bool.optional
        })
    });

    /**
     * Register dashboard in angular-engine, angular URL will be generated queries to declared documents
     * will be displayed using column definitions in those declarations.
     *
     * @param {string} url Angular url to created dashboard
     * @param {Array} queries list of query objects
     * @param {Object} options
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
     * Register document in angular-engine, angular URLs will be generated, and document will become available for
     * inclusion in other documents via ```queried_list``` metric
     *
     * **NOTE** The only difference between this method and $engineProvider.subdocument(...) is the fact, that ngRoutes are
     * generated for each registered document.
     *
     * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
     * @param {string} listUrl url to list, which will be added to ngRoute
     * example: ```/simple-document/:id```
     * @param {string} documentUrl url to document, which will be added to ngRoute, has to contain ```:id``` part
     * example: ```/simple-document/:id```
     * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
     * if argument is a string it will be treated as a group **metric category** and list of queries will be generated from its children
     * @param {object} options Document options object conforming to format set by ```_apiCheck.documentOptions```
     */
    this.document = function (documentModelType, listUrl, documentUrl, query, options) {

        var _options = {
            list: {
                templateUrl: '/src/list/list.wrapper.tpl.html'
            },
            document: {
                templateUrl: '/src/document/document.wrapper.tpl.html',
                steps: null,
                showValidationButton: true
            }
        };

        options = angular.merge(_options, options);

        _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

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
     * Register subdocument in angular-engine, subdocument will become available for
     * inclusion in other documents via ```queried_list``` metric
     *
     * **NOTE** The only difference between this method and $engineProvider.document(...) is the fact, that ngRoutes are
     * **not** generated for each registered subdocument.
     *
     * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
     * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
     * if argument is a string it will be treated as a group **metric category** and list of queries will be generated from its children
     * @param {object} options Document options object conforming to format set by ```_apiCheck.documentOptions```
     */
    this.subdocument = function (documentModelType, query, options) {
        _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.documentOptions], [documentModelType, query, options]);

        options.query = query;
        options.subdocument = true;

        documents_d[documentModelType] = options;
    };

    this.formly = $engineFormlyProvider;

    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    var _visibleDocumentFields = [{ name: 'id', caption: 'ID', type: 'link' }, { name: 'name', caption: 'Name' }];

    this.setDocumentFields = function (document_fields) {
        _visibleDocumentFields = document_fields;
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

    this.$get = function ($engineFormly, engineMetricCategories) {
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

            this.enableDebug = function () {
                _engineProvider._debug = true;
                $rootScope.$on('engine.common.error', function (event, errorEvent) {
                    if (_engineProvider._debug) $log.error(errorEvent);
                });
            };

            this.disableDebug = function () {
                _engineProvider._debug = false;
            };

            /**
             * Returns path to the document with given ```documentId``` and type included in
             * ```options.document.documentUrl```
             *
             * @param options Options of the document (options with which document has been registrated using
             * ```$engineProvider.document(...)```
             * @param {object|string} documentId id of the document to which path should be generated
             * @returns {string} angular URL to given document form
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
    var _query = $resource($engineConfig.baseUrl + '/metrics', {}, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (documentJSON, callback, errorCallback) {
        $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _query.post(documentJSON, callback, errorCallback);
    };
}).service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $log, engineResourceLoader) {
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

            return _document.validate({}, document, function (data) {
                document.$valid = data.valid;

                if (callback) callback(data);
            }, errorCallback);
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

angular.module('engine.formly').provider('$engineFormly', function () {
    var self = this;

    var _typeTemplateUrls = {
        input: '/src/formly/types/templates/input.tpl.html',
        select: '/src/formly/types/templates/select.tpl.html',
        checkbox: '/src/formly/types/templates/checkbox.tpl.html',
        radio: '/src/formly/types/templates/radio.tpl.html',
        textarea: '/src/formly/types/templates/textarea.tpl.html',
        datepicker: '/src/formly/types/templates/datepicker.tpl.html',
        multiCheckbox: '/src/formly/types/templates/multiCheckbox.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/wrappers/templates/category.tpl.html',
        label: '/src/formly/wrappers/templates/label.tpl.html',
        hasError: '/src/formly/wrappers/templates/has-error.tpl.html'
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
                    format: 'dd.MM.yyyy',
                    initDate: new Date()
                }
            }
        },
        controller: function controller($scope) {
            $scope.openedDatePopUp = false;

            $scope.today = function () {
                $scope.$parent.metricFormValues[metricId] = $filter('date')(new Date(), 'yyyy-MM-dd');
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
        columns: '='
    }
}).controller('engineListWrapperCtrl', function ($scope, $route, engineDashboard) {
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
}).controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction, engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal) {
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

    $scope.engineAction = function (actionId, document) {
        engineAction(actionId, document).$promise.then(function (data) {
            $scope.documents = engineQuery($scope.query);
        });
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
    $scope.genDocumentLink = function (document) {
        return $scope.options.documentUrl.replace(':id', document);
    };
    $scope.onCreateDocument = function () {
        if ($scope.options.subdocument == true) DocumentModal($scope.options, _parentDocumentId, function () {
            $scope.documents = engineQuery($scope.query, _parentDocumentId);
        });else $location.path($scope.genDocumentLink('new'));
    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };
});
"use strict";

angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/document-actions/document-actions.tpl.html", "<button type=\"submit\" class=\"btn btn-primary dark-blue-btn\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"$ctrl.step < $ctrl.steps.length - 1\" translate>Next Step:</button>\n<button type=\"submit\" class=\"btn btn-primary\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"$ctrl.step < $ctrl.steps.length - 1\">{{$ctrl.step+2}}. {{$ctrl.steps[$ctrl.step+1].name | translate}}</button>\n\n<button type=\"submit\" ng-if=\"$ctrl.showValidationButton && (!$ctrl.steps || $ctrl.step == $ctrl.steps.length - 1)\"\n        class=\"btn btn-default\" ng-click=\"$ctrl.validate()\" translate>Validate</button>\n\n<button type=\"submit\" ng-repeat=\"action in $ctrl.actionList.actions\" ng-if=\"!$ctrl.steps || $ctrl.step == $ctrl.steps.length - 1\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"action.call()\" translate>{{action.label}}</button>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/dashboard/dashboard.tpl.html", "<engine-document-list ng-repeat=\"query in queries\" show-create-button=\"query.showCreateButton\" columns=\"query.columns\"\n                      query=\"query.queryId\" options=\"$engine.getOptions(query.documentModelId)\" list-caption=\"query.label\"></engine-document-list>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 class=\"modal-title\" id=\"myModalLabel\">CREATE {{options.name}}</h4>\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document parent-document-id=\"{{::parentDocumentId}}\" validatedSteps=\"validatedSteps\" actions=\"actions\" ng-model=\"document\" options=\"documentOptions\"></engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"closeModal()\" translate>Cancel</button>\n    <button type=\"submit\" ng-repeat=\"action in actions\" style=\"margin-left: 5px\" class=\"btn btn-default\" ng-click=\"engineAction(action)\" translate>{{action.label}}</button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div>\n    <form ng-submit=\"$ctrl.onSubmit()\" name=\"$ctrl.documentForm.formlyState\" novalidate>\n        <formly-form model=\"document\" fields=\"$ctrl.documentForm.formlyFields\" class=\"horizontal\"\n                     options=\"$ctrl.documentForm.formlyOptions\" form=\"$ctrl.documentForm.formlyState\">\n\n            <engine-document-actions show-validation-button=\"$ctrl.showValidationButton\" ng-if=\"!$ctrl.options.subdocument\"\n                                     document=\"document\" document-scope=\"documentScope\"\n                                     steps=\"$ctrl.stepList\" step=\"$ctrl.step\" class=\"btn-group\"></engine-document-actions>\n        </formly-form>\n    </form>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <h1>CREATE {{ options.name }}: <span class=\"bold\" ng-if=\"steps.length > 0\">{{steps[$routeParams.step].name}} {{$routeParams.step + 1}}/{{steps.length}}</span></h1>\n    <engine-document actions=\"actions\" validated-steps=\"validatedSteps\" show-validation-button=\"options.document.showValidationButton\" document-id=\"{{::documentId}}\" ng-model=\"document\" step=\"$routeParams.step\" options=\"options\" class=\"col-md-8\"></engine-document>\n    <engine-steps ng-model=\"document\" validated-steps=\"validatedSteps\" step=\"$routeParams.step\" steps=\"options.document.steps\" options=\"options\" class=\"col-md-4\"></engine-steps>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.steps\" ng-class=\"{active: $ctrl.step == $index}\" class=\"ng-scope\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\">\n                    <i class=\"fa\" aria-hidden=\"true\" style=\"display: inline-block\"\n                       ng-class=\"{'fa-check-circle' : $ctrl.validatedSteps[$index] == 'valid',\n                                  'fa-circle-o': $ctrl.validatedSteps[$index] == 'blank',\n                                  'fa-cog fa-spin': $ctrl.validatedSteps[$index] == 'loading',\n                                  'fa-times-circle-o': $ctrl.validatedSteps[$index] == 'invalid'}\"></i>\n                </span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/checkbox.tpl.html", "<div class=\"checkbox\">\n\t<label>\n\t\t<input type=\"checkbox\"\n           class=\"formly-field-checkbox\"\n\t\t       ng-model=\"model[options.key]\">\n\t\t{{to.label}}\n\t\t{{to.required ? '*' : ''}}\n\t</label>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/datepicker.tpl.html", "<p class=\"input-group input-group-datepicker\">\n    <input id=\"{{::id}}\"\n           name=\"{{::id}}\"\n           ng-model=\"model[options.key]\"\n           class=\"form-control datepicker\"\n           type=\"text\"\n           uib-datepicker-popup=\"{{to.datepickerOptions.format || 'yyyy-MM-dd'}}\"\n           datepicker-localdate\n           is-open=\"openedDatePopUp\"\n           show-button-bar = false\n           datepicker-options=\"to.datepickerOptions || todayMinValueDateOptions\"\n           ng-click=\"openPopUp($event)\"/>\n    <span class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"openPopUp($event)\">\n            <i class=\"glyphicon glyphicon-calendar\"></i>\n        </button>\n    </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/input.tpl.html", "<input class=\"form-control\" ng-model=\"model[options.key]\" placeholder=\"{{options.templateOptions.placeholder | translate}}\">");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/multiCheckbox.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\"\n             id=\"{{id + '_'+ $index}}\"\n             ng-model=\"multiCheckbox.checked[$index]\"\n             ng-change=\"multiCheckbox.change()\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/radio.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"radio\">\n    <label>\n      <input type=\"radio\"\n             id=\"{{id + '_'+ $index}}\"\n             tabindex=\"0\"\n             ng-value=\"option[to.valueProp || 'value']\"\n             ng-model=\"model[options.key]\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/select.tpl.html", "<select class=\"form-control\" ng-model=\"model[options.key]\"></select>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/types/templates/textarea.tpl.html", "<textarea class=\"form-control\" ng-model=\"model[options.key]\"></textarea>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\">\n    <h3 ng-if=\"options.templateOptions.label\" translate>{{options.templateOptions.label}}</h3>\n    <div>\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/has-error.tpl.html", "<div class=\"form-group {{::to.css}}\" ng-class=\"{'has-error': showError}\">\n  <formly-transclude></formly-transclude>\n  <div ng-messages=\"fc.$error\" ng-if=\"showError\" class=\"error-messages\">\n    <div ng-message=\"{{ ::name }}\" ng-repeat=\"(name, message) in ::options.validation.messages\" class=\"message help-block ng-binding ng-scope\" translate>{{ message(fc.$viewValue, fc.$modelValue, this)}}</div>\n  </div>\n\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/label.tpl.html", "<div class=\"\">\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        <span translate>{{to.label}}</span>\n        {{to.required ? '*' : ''}}\n        <span translate class=\"grey-text\" ng-if=\"to.description\" translate>({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/wrappers/templates/row.tpl.html", "<div>\n    <div class=\"row  {{options.templateOptions.wrapperClass}}\">\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/date.tpl.html", "{{$ctrl.engineResolve(document_entry.document, column.name) | date}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/link.tpl.html", "<a href=\"#{{ genDocumentLink(document_entry.document.id) }}\" class=\"proposal-title\" ng-include=\"getCellTemplate(document_entry.document, column, true)\"></a>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/text.tpl.html", "{{$ctrl.engineResolve(document_entry.document, column.name)}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.tpl.html", "<h1>{{ $ctrl.listCaption || options.list.caption }}</h1>\n\n<div class=\"text-box\">\n    <div>\n        <table class=\"proposal-list\">\n            <tr>\n                <th class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" ng-repeat=\"column in columns\">{{column.caption || column.name}}</th>\n                <th class=\"text-right\"></th>\n            </tr>\n            <tr ng-repeat=\"document_entry in documents\">\n                <td ng-repeat=\"column in columns\" class=\"{{column.css}}\" ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n                <td class=\"text-right\" style=\"padding-top: 5px\">\n                    <!--<a href=\"\" ng-click=\"$ctrl.destroy(document_entry.document)\" class=\"table-options\">-->\n                        <!--<i class=\"fa fa-trash-o\" aria-hidden=\"true\"></i>-->\n                    <!--</a>-->\n                    <div class=\"dropdown\" style=\"height: 9px;\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\"><span class=\"glyphicon glyphicon-cog\"></span></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in document_entry.actions\"><a href=\"\" ng-click=\"engineAction(action.id, document_entry.document)\">{{action.label}}</a></li>\n                            <li ng-if=\"!document_entry.actions\"><span style=\"margin-left: 5px; margin-right: 5px;\">No actions available</span></li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n        </table>\n        <!--<td><a ng-href=\"#/proposals/{{proposal.id}}\" class=\"proposal-title\">{{ proposal.title }}</a></td>-->\n        <!--<td class=\"text-center\">{{ proposal.beamline }}</td>-->\n        <!--<td class=\"text-center table-status\">{{ proposal.status }}</td>-->\n        <!--<td class=\"text-center\">{{ proposal.createdAt | date }}</td>-->\n        <!--<td class=\"text-center\"><a href=\"\" class=\"blue-button\"></a></td>-->\n\n    </div>\n</div>\n<a href=\"\" ng-if=\"$ctrl._showCreateButton && canCreateDocument()\" ng-click=\"onCreateDocument()\" class=\"btn btn-primary\">\n    <span ng-if=\"!$ctrl.options.list.createButtonLabel\">create {{options.name}}</span>\n    <span ng-if=\"$ctrl.options.list.createButtonLabel\">{{$ctrl.options.list.createButtonLabel | translate}}</span>\n</a>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.wrapper.tpl.html", "<engine-document-list ng-repeat=\"query in queries\" show-create-button=\"$last\" query=\"query.id\" options=\"options\" list-caption=\"query.label\"></engine-document-list>");
}]);

//# sourceMappingURL=templates.js.map
;
//# sourceMappingURL=angular-engine.js.map