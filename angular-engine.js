'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'engine.formly', 'ui.bootstrap', 'engine.list', 'engine.steps', 'engine.document']).run(function (formlyConfig) {
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

angular.module('engine.document').component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '=',
        options: '=',
        steps: '=',
        step: '='
    }
}).controller('engineDocumentWrapperCtrl', function ($scope, $route, $location, engineMetric, $routeParams, engineAction) {
    $scope.options = $route.current.$$route.options;
    $scope.steps = $route.current.$$route.options.document.steps || null;
    $scope.step = parseInt($routeParams.step) || 0;
    $scope.document = {};

    $scope.changeStep = function (step) {
        $location.search({ step: step });
    };
}).controller('engineDocumentCtrl', function ($scope, $route, engineMetric, $routeParams, $engine, engineAction, engineDocument, $location) {
    var self = this;
    console.log($scope);

    $scope.steps = this.options.document.steps;

    $scope.step = this.step;
    $scope.currentCategories = $scope.steps == null || angular.isArray($scope.steps) && $scope.steps.length == 0 ? [] : $scope.steps[$scope.step].categories || [];

    if ($scope.documentId && $scope.documentId != 'new') {
        $scope.document = engineDocument.get($scope.documentId);
    }

    $scope.engineAction = function (actionId, document) {
        engineAction(actionId, document);
    };

    $scope.isLastStep = function (step) {
        if ($scope.steps == null || parseInt(step) == $scope.steps.length) return true;
    };

    $scope.documentFields = [];

    // var categoryClass = options.document.categoryClass || 'text-box';
    var categoryClass = 'text-box';

    $scope.metrics = engineMetric(self.options.documentJSON, function (data) {
        if ($scope.step == 0) {
            var generalGroup = { templateOptions: { wrapperClass: categoryClass, label: null }, fieldGroup: [], wrapper: 'category' };
            generalGroup.fieldGroup.push({
                key: 'name',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'Name',
                    placeholder: 'Enter name'
                }
            });
            generalGroup.fieldGroup.push({
                key: 'id',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'id',
                    disabled: true
                }
            });
            $scope.documentFields.push(generalGroup);
        }

        // console.log(data);

        function engineOptionsToFormly(engineOptions) {
            var r = [];
            angular.forEach(engineOptions, function (option) {
                r.push({ name: option.value, value: option.value });
            });
            return r;
        }
        var categories = {};
        angular.forEach(data, function (metric) {
            // console.log(metric)
            if ($scope.steps == null || $scope.currentCategories.indexOf(metric.categoryId) != -1) {
                var field = {
                    key: metric.id,
                    type: 'input',
                    className: metric.visualClass.join(' '),
                    templateOptions: {
                        type: 'text',
                        label: metric.label,
                        placeholder: 'Enter ' + metric.label
                    }
                };

                if (_.contains(metric.visualClass, 'select')) {
                    field.type = 'select';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                } else if (_.contains(metric.visualClass, 'radioGroup')) {
                    field.type = 'radio';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                } else if (_.contains(metric.visualClass, 'date') && metric.inputType == 'DATE') {
                    field.type = 'datepicker';
                } else if (_.contains(metric.visualClass, 'checkbox')) {
                    field.type = 'checkbox';
                } else if (metric.inputType == 'NUMBER') {} else if (metric.inputType == 'TEXTAREA') {
                    field.type = "textarea";
                    field.templateOptions = {
                        "placeholder": "",
                        "label": "",

                        //these needs to be specified somewhere?
                        "rows": 4,
                        "cols": 15
                    };
                } else if (metric.inputType == 'COMPONENT') {
                    field = { template: '<' + metric.componentType + '>' + '</' + metric.componentType + '>', templateOptions: { ngModel: $scope.document } };
                } else if (metric.inputType == 'QUERIED_LIST') {
                    field.type = undefined;
                    field = { template: '<engine-document-list form-widget="true" options="options.templateOptions.options"></engine-document-list>', templateOptions: { options: $engine.getOptions(metric.modelId) } };
                }

                if (categories[metric.categoryId] == undefined) categories[metric.categoryId] = { templateOptions: { wrapperClass: categoryClass, label: metric.categoryId }, fieldGroup: [],
                    wrapper: 'category' };
                if (metric.label == 'labFinancialSupport') console.log(metric);
                categories[metric.categoryId].fieldGroup.push(field);
            }
        });
        // console.log('categories');
        // console.log(categories);

        angular.forEach(categories, function (category) {
            $scope.documentFields.push(category);
        });
    });

    $scope.document = {};

    $scope.changeStep = function (newStep) {
        $routeParams.step = newStep;
        $location.search({ step: newStep });
    };
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
            size: 'md',
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

angular.module('engine').provider('$engine', function ($routeProvider, $engineFormlyProvider) {
    var self = this;

    var documents = [];
    var documents_d = {};

    this.apiCheck = apiCheck({});

    var _apiCheck = this.apiCheck;

    _apiCheck.documentOptions = _apiCheck.shape({
        documentJSON: _apiCheck.object,
        name: _apiCheck.string,
        list: _apiCheck.shape({
            caption: _apiCheck.string,
            templateUrl: _apiCheck.string
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.shape({ name: _apiCheck.string, categories: _apiCheck.arrayOf(_apiCheck.string) }))
        })
    });

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

        _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

        options.documentModelType = documentModelType;
        options.listUrl = listUrl;
        options.documentUrl = documentUrl;
        options.query = query;
        options.subdocument = false;

        documents.push({ list_route: listUrl, document_route: documentUrl });

        $routeProvider.when(listUrl, { templateUrl: options.list.templateUrl, controller: 'engineListWrapperCtrl',
            options: options
        });

        $routeProvider.when(documentUrl, { templateUrl: options.document.templateUrl, controller: 'engineDocumentWrapperCtrl',
            options: options
        });

        documents_d[documentModelType] = options;
    };

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

    this.$get = function ($engineFormly) {

        return new function () {
            this.apiCheck = _apiCheck;
            this.formly = $engineFormly;
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;
            this.visibleDocumentFields = _visibleDocumentFields;

            this.getOptions = function (documentModelId) {
                _apiCheck.string(documentModelId);

                return documents_d[documentModelId] || {};
            };
        }();
    };
});
;'use strict';

angular.module('engine').service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var _query = $resource($engine.baseUrl + '/query/documents-with-extra-data?queryId=:query', { query_id: '@query' }, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (query, callback, errorCallback) {
        $engine.apiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments);
        return _query.get({ query: query }, callback, errorCallback);
    };
}).service('engineMetric', function ($engine, $resource, EngineInterceptor) {
    var _query = $resource($engine.baseUrl + '/metrics', {}, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (documentJSON, callback, errorCallback) {
        $engine.apiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _query.post(documentJSON, callback, errorCallback);
    };
}).service('engineAction', function ($engine, $resource, EngineInterceptor) {
    var _action = $resource($engine.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', { actionId: '@actionId', documentId: '@documentId' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    return function (actionId, document, callback, errorCallback) {
        $engine.apiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments, errorCallback);

        return _action.post({ actionId: actionId, documentId: document.id, statesAndmetrics: { metrics: document.metrics } }, callback);
    };
}).service('engineDocument', function ($engine, $resource, EngineInterceptor) {
    var _document = $resource($engine.baseUrl + '/document/getwithextradata?documentId=:documentId', { documentId: '@documentId' }, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response }
    });

    return { get: function get(documentId, callback, errorCallback) {
            $engine.apiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments, errorCallback);

            return _document.get({ documentId: documentId }, callback, errorCallback);
        } };
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
        formWidget: '@'
    }
}).controller('engineListWrapperCtrl', function ($scope, $route) {
    $scope.options = $route.current.$$route.options;
    $scope.query = $route.current.$$route.options.query;
}).controller('engineListCtrl', function ($scope, $route, engineMetric, $engine, engineQuery, engineAction, DocumentModal) {
    var self = this;

    //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
    this.formWidget = this.formWidget === 'true';

    $scope.options = this.options;
    $scope.columns = $scope.options.list.columns;

    $scope.documents = engineQuery($scope.options.query);

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
        return '#' + $scope.options.documentUrl.replace(':id', document);
    };
    $scope.onCreateDocument = function () {
        if ($scope.options.subdocument == true) DocumentModal($scope.options);else $location.path($scope.genDocumentLink('new'));
    };
});
"use strict";

angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document-modal.tpl.html", "<div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" ng-click=\"closeModal()\">&times;</button>\n    <h4 class=\"modal-title\" id=\"myModalLabel\">CREATE {{options.name}}</h4>\n</div>\n<div class=\"modal-body\">\n    <div class=\"container-fluid\">\n        <engine-document ng-model=\"document\" options=\"documentOptions\"></engine-document>\n    </div>\n</div>\n<div class=\"modal-footer\">\n    <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-click=\"closeModal()\">Anuluj</button>\n    <button type=\"submit\" ng-repeat=\"action in actions\" style=\"margin-left: 5px\" class=\"btn btn-default\" ng-click=\"engineAction(action.id, document)\">{{action.label}}</button>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.tpl.html", "<div>\n    <formly-form model=\"document\" fields=\"documentFields\" class=\"horizontal\">\n\n\n        <div class=\"btn-group\" ng-if=\"!$ctrl.options.subdocument\">\n            <button class=\"btn btn-primary dark-blue-btn\" ng-click=\"changeStep(step+1)\">Next Step:</button>\n            <button class=\"btn btn-primary\" ng-click=\"changeStep(step+1)\">{{step+2}}. {{steps[step+1].name}}</button>\n            <button type=\"submit\" ng-repeat=\"action in actions\" ng-if=\"step == steps.length - 1\" style=\"margin-left: 5px\" class=\"btn btn-default\" ng-click=\"engineAction(action.id, document)\">{{action.label}}</button>\n        </div>\n    </formly-form>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/document.wrapper.tpl.html", "<div>\n    <h1>CREATE {{ options.name }}: <span class=\"bold\">{{steps[step].name}} {{step + 1}}/{{steps.length}}</span></h1>\n    <engine-document ng-model=\"document\" step=\"step\" options=\"options\" class=\"col-md-8\"></engine-document>\n    <engine-steps ng-model=\"document\" step=\"step\" steps=\"options.document.steps\" options=\"options\" ng-change=\"changeStep(step)\" class=\"col-md-4\"></engine-steps>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/fields/datepicker.tpl.html", "<p class=\"input-group\">\n    <input  type=\"text\"\n            id=\"{{::id}}\"\n            name=\"{{::id}}\"\n            ng-model=\"model[options.key]\"\n            class=\"form-control\"\n            ng-click=\"datepicker.open($event)\"\n            uib-datepicker-popup=\"{{to.datepickerOptions.format}}\"\n            is-open=\"datepicker.opened\"\n            datepicker-options=\"to.datepickerOptions\" />\n    <span class=\"input-group-btn\">\n            <button type=\"button\" class=\"btn btn-default\" ng-click=\"datepicker.open($event)\" ng-disabled=\"to.disabled\"><i class=\"glyphicon glyphicon-calendar\"></i></button>\n        </span>\n</p>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/document/steps.tpl.html", "<div class=\"text-box text-box-nav\">\n    <ul class=\"nav nav-pills nav-stacked nav-steps\">\n        <li ng-repeat=\"_step in $ctrl.steps\" ng-class=\"{active: $ctrl.step == $index}\" class=\"ng-scope\">\n            <a href=\"\" ng-click=\"$ctrl.changeStep($index)\">\n                <span class=\"menu-icons\"><i class=\"fa fa-circle-o\" aria-hidden=\"true\"></i><i class=\"fa fa-check-circle\" aria-hidden=\"true\"></i></span>\n                <span class=\"menu-steps-desc ng-binding\">{{$index + 1}}. {{_step.name}}</span>\n            </a>\n        </li>\n    </ul>\n</div>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/formly/category.tpl.html", "<div class=\"{{options.templateOptions.wrapperClass}}\">\n    <h3 ng-if=\"options.templateOptions.label\">{{options.templateOptions.label}}</h3>\n    <div>\n        <formly-transclude></formly-transclude>\n    </div>\n</div>");
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
  $templateCache.put("/src/formly/label.tpl.html", "<div>\n    <label for=\"{{id}}\" class=\"control-label {{to.labelSrOnly ? 'sr-only' : ''}}\" ng-if=\"to.label\">\n        {{to.label}}\n        {{to.required ? '*' : ''}}\n        <span class=\"grey-text\" ng-if=\"to.description\">({{to.description}})</span>\n    </label>\n    <formly-transclude></formly-transclude>\n</div>\n");
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
  $templateCache.put("/src/list/cell/date.tpl.html", "{{document_entry.document[column.name] | date}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/link.tpl.html", "<a href=\"{{genDocumentLink(document_route, document_entry.document.id)}}\" class=\"proposal-title\" ng-include=\"getCellTemplate(document_entry.document, column, true)\"></a>");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/cell/text.tpl.html", "{{document_entry.document[column.name]}}");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.tpl.html", "<h1>{{ options.list.caption }}</h1>\n\n<div class=\"text-box\">\n    <div>\n        <table class=\"proposal-list\">\n            <tr>\n                <th class=\"{{column.css_header || column.css}}\" style=\"text-transform: uppercase;\" ng-repeat=\"column in columns\">{{column.caption || column.name}}</th>\n                <th class=\"text-right\"></th>\n            </tr>\n            <tr ng-repeat=\"document_entry in documents\">\n                <td ng-repeat=\"column in columns\" class=\"{{column.css}}\" ng-include=\"getCellTemplate(document_entry.document, column)\"></td>\n                <td class=\"text-right\" style=\"padding-top: 5px\">\n                    <!--<a href=\"\" ng-click=\"$ctrl.destroy(document_entry.document)\" class=\"table-options\">-->\n                        <!--<i class=\"fa fa-trash-o\" aria-hidden=\"true\"></i>-->\n                    <!--</a>-->\n                    <div class=\"dropdown\" style=\"height: 9px;\">\n                        <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\"><span class=\"glyphicon glyphicon-cog\"></span></a>\n                        <ul class=\"dropdown-menu\">\n                            <li ng-repeat=\"action in document_entry.actions\"><a href=\"\" ng-click=\"engineAction(action.id, document_entry.document)\">{{action.label}}</a></li>\n                            <li ng-if=\"!document_entry.actions\"><span style=\"margin-left: 5px; margin-right: 5px;\">No actions available</span></li>\n                        </ul>\n                    </div>\n                </td>\n            </tr>\n        </table>\n        <!--<td><a ng-href=\"#/proposals/{{proposal.id}}\" class=\"proposal-title\">{{ proposal.title }}</a></td>-->\n        <!--<td class=\"text-center\">{{ proposal.beamline }}</td>-->\n        <!--<td class=\"text-center table-status\">{{ proposal.status }}</td>-->\n        <!--<td class=\"text-center\">{{ proposal.createdAt | date }}</td>-->\n        <!--<td class=\"text-center\"><a href=\"\" class=\"blue-button\"></a></td>-->\n\n    </div>\n</div>\n<a href=\"\" ng-click=\"onCreateDocument()\" class=\"btn btn-primary\">create {{options.name}}</a>\n");
}]);
angular.module("engine").run(["$templateCache", function ($templateCache) {
  $templateCache.put("/src/list/list.wrapper.tpl.html", "<engine-document-list query=\"query\" options=\"options\"></engine-document-list>");
}]);

//# sourceMappingURL=templates.js.map
;
//# sourceMappingURL=angular-engine.js.map