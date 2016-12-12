'use strict';

angular.module('engine.common', []);
'use strict';

angular.module('engine.dashboard', ['ngRoute', 'engine.list']);
'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'engine.formly', 'ui.bootstrap', 'engine.common', 'engine.list', 'engine.dashboard', 'engine.steps', 'pascalprecht.translate', 'engine.document']).run(function (formlyConfig) {
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
        templateUrl: '/src/document/fields/datepicker.tpl.html',
        // wrapper: ['bootstrapLabel', 'bootstrapHasError'],
        defaultOptions: {
            ngModelAttrs: ngModelAttrs,
            templateOptions: {
                datepickerOptions: {
                    format: 'dd.MM.yyyy',
                    initDate: new Date()
                }
            }
        },
        controller: ['$scope', function ($scope) {
            $scope.datepicker = {};

            $scope.datepicker.opened = false;

            $scope.datepicker.open = function ($event) {
                $scope.datepicker.opened = !$scope.datepicker.opened;
            };
        }]
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
    controller: function controller($timeout, $rootScope, engineAction, $scope, DocumentEventCtx, ErrorEventCtx, ENGINE_SAVE_ACTIONS, $log) {
        var self = this;

        if (!this.documentScope) {
            $log.warn('engineDocumentActions document-scope argument not specified, using local $scope, which may be not what you want');
            this._documentScope = $scope;
        } else this._documentScope = this.documentScope;

        this.engineAction = function (action) {
            $scope.$emit('engine.common.action.invoke', action, self.document);
        };

        this.changeStep = function (newStep) {
            $scope.$emit('engine.common.step.change', newStep, self.document);
            // self.engineAction(self.getCreateUpdateAction(), self.document, function () {
            //     self.step = newStep;
            // $timeout(self.stepChange);
            // });
        };
    },
    bindings: {
        documentScope: '=',
        document: '=',
        options: '=',
        actions: '=',
        step: '=',
        steps: '=',
        stepChange: '&'
    }
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
        documentId: '@'
    }
}).controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams) {
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    $scope.step = parseInt($routeParams.step) || 0;
    $scope.document = {};
    $scope.documentId = $routeParams.id;

    $scope.changeStep = function (step) {
        $scope.$broadcast('engine.common.step.before', step);
    };
}).controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineDocument, engineActionsAvailable, $location, engineActionUtils, DocumentEventCtx, engineAction, engineMetricCategories) {
    var self = this;
    console.log($scope);
    $scope.documentScope = $scope;
    $scope.document = {};
    $scope.steps = this.options.document.steps;
    $scope.actions = [];
    $scope.step = this.step;
    //if categoryGroup (string) will be overriten in this.init()
    $scope.currentCategories = $scope.steps == null || angular.isArray($scope.steps) && $scope.steps.length == 0 ? [] : $scope.steps[$scope.step].categories || [];

    this.init = function () {
        return engineMetricCategories.then(function (data) {
            engineMetricCategories = data;

            if (angular.isArray(self.options.document.steps)) {
                angular.forEach(self.options.document.steps, function (step) {
                    if (!angular.isArray(step.categories)) {
                        var _categoryGroup = step.categories;
                        step.categories = [];
                        angular.forEach(data.metrics[_categoryGroup].children, function (category) {
                            step.categories.push(category.id);
                        });
                        $scope.currentCategories = step.categories;
                    }
                });
            }

            if (self.documentId && self.documentId != 'new') {
                engineDocument.get(self.documentId, function (data) {
                    $scope.document = data.document;
                    $scope.actions = engineActionsAvailable.forDocument($scope.document);
                    self.loadMetrics();
                });
            } else {
                $scope.document = angular.copy(self.options.documentJSON);
                $scope.actions = engineActionsAvailable.forDocument($scope.document);
                self.loadMetrics();
            }
        });
    };

    this.isEditable = function () {
        if (engineActionUtils.getCreateUpdateAction($scope.actions) != null) return true;
        return false;
    };
    this.isDisabled = function () {
        return !self.isEditable();
    };

    function _engineOptionsToFormly(engineOptions) {
        var r = [];
        angular.forEach(engineOptions, function (option) {
            r.push({ name: option.value, value: option.value });
        });
        return r;
    }

    this.loadMetrics = function () {
        $scope.metrics = engineMetric(self.options.documentJSON, function (data) {

            var categories = {};

            angular.forEach(data, function (metric) {
                // console.log(metric)
                if ($scope.steps == null || $scope.currentCategories.indexOf(metric.categoryId) != -1) {
                    var field = {
                        model: $scope.document.metrics,
                        key: metric.id,
                        type: 'input',
                        className: metric.visualClass.join(' '),
                        templateOptions: {
                            type: 'text',
                            label: metric.label,
                            description: metric.description,
                            placeholder: 'Enter ' + metric.label
                        },
                        expressionProperties: {
                            'templateOptions.disabled': self.isDisabled
                        }
                    };

                    if (_.contains(metric.visualClass, 'select')) {
                        field.type = 'select';
                        field.templateOptions.options = _engineOptionsToFormly(metric.options);
                    } else if (_.contains(metric.visualClass, 'radioGroup')) {
                        field.type = 'radio';
                        field.templateOptions.options = _engineOptionsToFormly(metric.options);
                    } else if (_.contains(metric.visualClass, 'date') && metric.inputType == 'DATE') {
                        field.type = 'datepicker';
                    } else if (_.contains(metric.visualClass, 'checkbox')) {
                        field.type = 'checkbox';
                    } else if (metric.inputType == 'NUMBER') {
                        field.type = 'input';
                    } else if (metric.inputType == 'TEXTAREA') {
                        field.type = "textarea";
                        field.templateOptions = {
                            "placeholder": "",
                            "label": "",

                            //these needs to be specified somewhere?
                            "rows": 4,
                            "cols": 15
                        };
                    } else if (metric.inputType == 'EXTERNAL') {
                        field = { template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' + 'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + 'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                            templateOptions: { ngModel: $scope.document, options: self.options }, expressionProperties: { 'templateOptions.disabled': self.isDisabled } };
                    } else if (metric.inputType == 'QUERIED_LIST') {
                        field.type = undefined;
                        field.model = undefined;
                        field = { template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' + ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '"></engine-document-list>',
                            templateOptions: { options: $engine.getOptions(metric.modelId),
                                document: $scope.document
                            }, expressionProperties: { 'templateOptions.disabled': self.isDisabled }
                        };
                    }

                    if (categories[metric.categoryId] == undefined) categories[metric.categoryId] = { templateOptions: { wrapperClass: categoryClass, label: engineMetricCategories.names[metric.categoryId].label }, fieldGroup: [], wrapper: 'category' };

                    categories[metric.categoryId].fieldGroup.push(field);
                }
            });
            // console.log('categories');
            // console.log(categories);

            angular.forEach(categories, function (category) {
                $scope.documentFields.push(category);
            });
        });
    };

    this.onChange = function () {};

    $scope.isLastStep = function (step) {
        if ($scope.steps == null || parseInt(step) == $scope.steps.length) return true;
    };

    $scope.documentFields = [];

    // var categoryClass = options.document.categoryClass || 'text-box';
    var categoryClass = 'text-box';;

    this._handleActionResonse = function (actionResponse) {
        if (actionResponse.type == 'REDIRECT') {
            //before redirecting, load document from engine to ascertain it's document type
            engineDocument.get(actionResponse.redirectToDocument, function (_data) {

                $location.path($engine.pathToDocument($engine.getOptions(_data.document.states.documentType), actionResponse.redirectToDocument));

                //if redirecting to new document, clear steps
                if ($scope.document.id != null && $scope.document.id != actionResponse.redirectToDocument) $location.search({ step: 0 });
            });
        }
    };

    $scope.saveDocument = function (onSuccess, onError) {

        var saveAction = engineActionUtils.getCreateUpdateAction($scope.actions);

        if (saveAction) self.engineAction(saveAction, $scope.document, function (data) {
            if (onSuccess) onSuccess(data);

            self._handleActionResonse(data);
        }, onError);
    };

    $scope.onChangeStep = function (newStep) {
        if (self.isEditable()) $scope.saveDocument(function () {
            $routeParams.step = newStep;
            $location.search({ step: newStep });
        });else {
            $routeParams.step = newStep;
            $location.search({ step: newStep });
        }
    };

    /**
     * Invokes engine action on the document, also broadcasts events to subcomponents
     *
     * @param {string} action
     * @param {object} document
     * @param {Function} callback
     * @param {Function} errorCallback
     */
    this.engineAction = function (action, document, callback, errorCallback) {

        var actionId = action.id;

        var eventBeforeAction = $scope.$broadcast('engine.common.action.before', new DocumentEventCtx(document, action));

        if (eventBeforeAction.defaultPrevented) return;

        if (engineActionUtils.isSaveAction(action)) {
            var eventBeforeSave = $scope.$broadcast('engine.common.save.before', new DocumentEventCtx(document, action));

            if (eventBeforeSave.defaultPrevented) return;
        }

        //calls engineAction Service
        engineAction(actionId, document, function (data) {
            $scope.$broadcast('engine.common.action.after', new DocumentEventCtx(document, action));

            if (engineActionUtils.isSaveAction(action)) $scope.$broadcast('engine.common.save.after', new DocumentEventCtx(document, action));

            if (callback) callback(data);

            self._handleActionResonse(data);
        }, function (response) {
            $scope.$broadcast('engine.common.action.error', new DocumentEventCtx(document, response));

            if (engineActionUtils.isSaveAction(action)) $scope.$broadcast('engine.common.save.error', new DocumentEventCtx(document, action));

            if (errorCallback) errorCallback(response);
        });
    };

    $scope.$on('engine.common.step.before', function (event, newStep) {
        $scope.onChangeStep(newStep);
    });

    $scope.$on('engine.common.step.change', function (event, newStep) {
        $scope.onChangeStep(newStep);
    });

    $scope.$on('engine.common.action.invoke', function (event, action) {
        self.engineAction(action, $scope.document);
    });

    this.init();
});
'use strict';

angular.module('engine.document').factory('DocumentModal', function ($resource, $uibModal) {
    return function (_documentOptions, documentId, callback) {
        var modalInstance = $uibModal.open({
            templateUrl: '/src/document/document-modal.tpl.html',
            controller: function controller($scope, documentOptions, $uibModalInstance) {
                $scope.documentOptions = documentOptions;

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
        ngChange: '&'
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
            }))
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
                steps: null
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
            options: options
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
            this.visibleDocumentFields = _visibleDocumentFields;

            /**
             * Returns document options defined via ```document()``` method
             *
             * @param {string} documentModelId Document model ID (same as the one registered with ```.document``` and ```.subdocument``` methods)
             * @returns {object} options associated with specified dicumentModelId
             */
            this.getOptions = function (documentModelId) {
                _apiCheck.string(documentModelId);

                return documents_d[documentModelId] || {};
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
}).service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, engineResourceLoader) {
    var _query = $resource($engineConfig.baseUrl + '/metric-categories', {}, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true }
    });

    var _metricCategories = {};
    var _names = {};

    function collectMetrics(metrics) {
        function writeMetric(_metric) {
            _names[_metric.id] = { label: _metric.label, position: _metric.position, visualClass: _metric.visualClass };
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
        return { metrics: _metricCategories, names: _names };
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

    return function (actionId, document, callback, errorCallback) {
        $engineApiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _action.post({ actionId: actionId, documentId: document.id }, document, callback, errorCallback);
    };
}).service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
    var _document = $resource($engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true', { documentId: '@documentId' }, {
        getDocument: { method: 'POST', transformResponse: EngineInterceptor.response }
    });

    return {
        get: function get(documentId, callback, errorCallback) {
            $engineApiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments, errorCallback);

            //null is passed explicitly to POST data, to ensure engine compatibility
            return _document.getDocument({ documentId: documentId }, null, callback, errorCallback);
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
        input: '/src/formly/input.tpl.html',
        select: '/src/formly/select.tpl.html',
        checkbox: '/src/formly/checkbox.tpl.html',
        radio: '/src/formly/radio.tpl.html',
        textarea: '/src/formly/textarea.tpl.html',
        multiCheckbox: '/src/formly/multiCheckbox.tpl.html'
    };
    var _wrapperTemplateUrls = {
        category: '/src/formly/category.tpl.html',
        label: '/src/formly/label.tpl.html',
        hasError: '/src/formly/has-error.tpl.html'
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
        templateUrl: '/src/formly/radio.html',
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
        defaultOptions: {
            ngModelAttrs: {
                rows: { attribute: 'rows' },
                cols: { attribute: 'cols' }
            }
        }
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
        if ($scope.options.subdocument == true) DocumentModal($scope.options);else $location.path($scope.genDocumentLink('new'));
    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };
});
"use strict";

angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/common/document-actions/document-actions.tpl.html", "<button type=\"submit\" class=\"btn btn-primary dark-blue-btn\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"$ctrl.step < $ctrl.steps.length - 1\">Next Step:</button>\n<button type=\"submit\" class=\"btn btn-primary\" ng-click=\"$ctrl.changeStep($ctrl.step+1)\" ng-if=\"$ctrl.step < $ctrl.steps.length - 1\">{{$ctrl.step+2}}. {{$ctrl.steps[$ctrl.step+1].name}}</button>\n\n<button type=\"submit\" ng-repeat=\"action in $ctrl.actions\" ng-if=\"!$ctrl.steps || $ctrl.step == $ctrl.steps.length - 1\" style=\"margin-left: 5px\"\n        class=\"btn btn-default\" ng-click=\"$ctrl.engineAction(action)\">{{action.label}}</button>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/dashboard/dashboard.tpl.html", "<engine-document-list ng-repeat=\"query in queries\" show-create-button=\"query.showCreateButton\" columns=\"query.columns\"\n                      query=\"query.queryId\" options=\"$engine.getOptions(query.documentModelId)\" list-caption=\"query.label\"></engine-document-list>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 class=\"modal-title\" id=\"myModalLabel\">CREATE {{options.name}}</h4>\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document ng-model=\"document\" options=\"documentOptions\"></engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"closeModal()\">Anuluj</button>\n    <button type=\"submit\" ng-repeat=\"action in actions\" style=\"margin-left: 5px\" class=\"btn btn-default\" ng-click=\"engineAction(action.id, document)\">{{action.label}}</button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div>\n    <formly-form model=\"document\" fields=\"documentFields\" class=\"horizontal\">\n\n        <engine-document-actions ng-if=\"!$ctrl.options.subdocument\" document=\"document\" document-scope=\"documentScope\" steps=\"$ctrl.options.document.steps\" step=\"step\" step-change=\"onChangeStep(step)\" actions=\"actions\" class=\"btn-group\"></engine-document-actions>\n    </formly-form>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <h1>CREATE {{ options.name }}: <span class=\"bold\">{{steps[step].name}} {{step + 1}}/{{steps.length}}</span></h1>\n    <engine-document document-id=\"{{::documentId}}\" ng-model=\"document\" step=\"step\" options=\"options\" class=\"col-md-8\"></engine-document>\n    <engine-steps ng-model=\"document\" step=\"step\" steps=\"options.document.steps\" options=\"options\" ng-change=\"changeStep(step)\" class=\"col-md-4\"></engine-steps>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/fields/datepicker.tpl.html", "<p class=\"input-group\">\n    <input  type=\"text\"\n            id=\"{{::id}}\"\n            name=\"{{::id}}\"\n            ng-model=\"model[options.key]\"\n            class=\"form-control\"\n            ng-click=\"datepicker.open($event)\"\n            uib-datepicker-popup=\"{{to.datepickerOptions.format}}\"\n            is-open=\"datepicker.opened\"\n            datepicker-options=\"to.datepickerOptions\" />\n    <span class=\"input-group-btn\">\n            <button type=\"button\" class=\"btn btn-default\" ng-click=\"datepicker.open($event)\" ng-disabled=\"to.disabled\"><i class=\"glyphicon glyphicon-calendar\"></i></button>\n        </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.steps\" ng-class=\"{active: $ctrl.step == $index}\" class=\"ng-scope\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\"><i class=\"fa fa-circle-o\" aria-hidden=\"true\"></i><i class=\"fa fa-check-circle\" aria-hidden=\"true\"></i></span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\">\n    <h3 ng-if=\"options.templateOptions.label\" translate>{{options.templateOptions.label}}</h3>\n    <div>\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/checkbox.tpl.html", "<div class=\"checkbox\">\n\t<label>\n\t\t<input type=\"checkbox\"\n           class=\"formly-field-checkbox\"\n\t\t       ng-model=\"model[options.key]\">\n\t\t{{to.label}}\n\t\t{{to.required ? '*' : ''}}\n\t</label>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/has-error.tpl.html", "<div class=\"form-group\" ng-class=\"{'has-error': showError}\">\n  <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/input.tpl.html", "<input class=\"form-control\" ng-model=\"model[options.key]\">");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/label.tpl.html", "<div>\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        <span translate>{{to.label}}</span>\n        {{to.required ? '*' : ''}}\n        <span translate class=\"grey-text\" ng-if=\"to.description\" translate>({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/multiCheckbox.tpl.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\"\n             id=\"{{id + '_'+ $index}}\"\n             ng-model=\"multiCheckbox.checked[$index]\"\n             ng-change=\"multiCheckbox.change()\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/radio.html", "<div class=\"radio-group\">\n  <div ng-repeat=\"(key, option) in to.options\" class=\"radio\">\n    <label>\n      <input type=\"radio\"\n             id=\"{{id + '_'+ $index}}\"\n             tabindex=\"0\"\n             ng-value=\"option[to.valueProp || 'value']\"\n             ng-model=\"model[options.key]\">\n      {{option[to.labelProp || 'name']}}\n    </label>\n  </div>\n</div>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/select.tpl.html", "<select class=\"form-control\" ng-model=\"model[options.key]\"></select>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/textarea.tpl.html", "<textarea class=\"form-control\" ng-model=\"model[options.key]\"></textarea>");
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