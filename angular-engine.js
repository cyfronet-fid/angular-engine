'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine.steps', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'formly', 'formlyBootstrap', 'ui.bootstrap', 'engine.list', 'engine.steps', 'engine.document']).run(function (formlyConfig) {
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
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
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

angular.module('engine.list', ['ngRoute']);
'use strict';

angular.module('engine.document').component('engineDocument', {
    templateUrl: '/src/document/document.tpl.html',
    controller: 'engineDocumentCtrl',
    bindings: {
        ngModel: '@',
        steps: '@'
    }
}).controller('engineDocumentWrapperCtrl', function ($scope, $route, metrics, $routeParams, engineAction) {}).controller('engineDocumentCtrl', function ($scope, $route, metrics, $routeParams, engineAction, engineDocument, $location) {
    var self = this;

    $scope.query = $route.current.$$route.query;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.steps = $route.current.$$route.options.steps;
    $scope.documentId = $routeParams.id;

    $scope.step = parseInt($routeParams.step) || 0;
    $scope.currentCategories = $scope.steps[$scope.step].categories || [];

    if ($scope.documentId) {
        $scope.document = engineDocument.get($scope.documentId);
    }

    $scope.engineAction = function (actionId, document) {
        engineAction(actionId, document);
    };

    $scope.isLastStep = function (step) {
        if (parseInt(step) == $scope.steps.length) return true;
    };

    $scope.documentFields = [];

    $scope.metrics = metrics($scope.document_type).$promise.then(function (data) {
        var generalGroup = { className: 'field-group', fieldGroup: [] };
        if ($scope.step == 0) {
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
                    label: '',
                    disabled: true
                }
            });
        }

        $scope.documentFields.push(generalGroup);

        console.log(data);

        function engineOptionsToFormly(engineOptions) {
            var r = [];
            angular.forEach(engineOptions, function (option) {
                r.push({ name: option.value, value: option.value });
            });
            return r;
        }
        var categories = {};
        angular.forEach($scope.currentCategories, function (category) {
            categories[category] = { className: 'field-group', fieldGroup: [] };
        });

        angular.forEach(data, function (metric) {
            if ($scope.currentCategories.indexOf(metric.categoryId) != -1) {
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

                if (metric.visualClass.indexOf('select') != -1) {
                    field.type = 'select';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                } else if (metric.visualClass.indexOf('radioGroup') != -1) {
                    field.type = 'radio';
                    field.templateOptions.options = engineOptionsToFormly(metric.options);
                } else if (metric.visualClass.indexOf('date') != -1 && metric.inputType == 'DATE') {
                    field.type = 'datepicker';
                } else if (metric.inputType == 'NUMBER') {} else if (metric.inputType == 'TEXTAREA') {
                    field.type = "textarea";
                    field.templateOptions = {
                        // "placeholder": "",
                        // "label": "",

                        //these needs to be specified somewhere?
                        "rows": 4,
                        "cols": 15
                    };
                } else if (metric.inputType == 'COMPONENT') {
                    field = { template: '<' + metric.componentType + '>' + '</' + metric.componentType + '>', templateOptions: { ngModel: $scope.document } };
                } else if (metric.inputType == 'DOCUMENT') {
                    field = { template: '<engine-document-list query="' + metric.query + '" document-type="' + metric.documentType + '"></engine-document-list>', templateOptions: { ngModel: $scope.document } };
                }

                categories[metric.categoryId].fieldGroup.push(field);
            }
        });

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

angular.module('engine.steps').component('engineSteps', {
    templateUrl: '/src/document/steps.tpl.html',
    controller: function controller($scope, $route, $routeParams, $location) {
        $scope.steps = $route.current.$$route.options.steps;
        $scope.step = $routeParams.step || 0;

        $scope.changeStep = function (newStep) {
            $routeParams.step = newStep;
            $location.search({ step: newStep });
        };
    },
    bindings: {
        // ngModel: '@',
        // steps: '@'
    }
});
'use strict';

angular.module('engine').provider('$engine', function ($routeProvider) {
    var documents = [];
    var documents_d = {};

    this.document = function (documentType, list_route, list_options, document_route, document_options, query, common_options) {
        documents.push({ list_route: list_route, document_route: document_route });

        if (!list_options) list_options = {};

        if (!document_options) document_options = {};

        if (!common_options) common_options = {};
        common_options.document_type = documentType;
        common_options.list_route = list_route;
        common_options.document_route = document_route;

        if (!list_options.templateUrl) list_options.templateUrl = '/src/list/list.tpl.html';

        if (!document_options.templateUrl) document_options.templateUrl = '/src/document/document.wrapper.tpl.html';

        $routeProvider.when(list_route, { templateUrl: list_options.templateUrl, controller: 'engineListCtrl',
            query: query,
            options: list_options,
            common_options: common_options
        });

        $routeProvider.when(document_route, { templateUrl: document_options.templateUrl, controller: 'engineDocumentWrapperCtrl',
            query: query,
            options: document_options,
            common_options: common_options
        });

        documents_d[documentType] = { list_options: list_options, document_options: document_options, common_options: common_options,
            query: query, modal: false };
    };

    this.subdocument = function (documentType, list_options, document_options, common_options, query, modal) {
        documents_d[documentType] = { list_options: list_options, document_options: document_options, common_options: common_options,
            query: query, modal: modal || false };
    };

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

    this.$get = function () {

        return new function () {
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;
            this.visibleDocumentFields = _visibleDocumentFields;
        }();
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

angular.module('engine').service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var _query = $resource($engine.baseUrl + '/query/documents-with-extra-data?queryId=:query', { query_id: '@query' }, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (query) {
        return _query.get({ query: query });
    };
}).service('metrics', function ($engine, $resource, EngineInterceptor) {
    var _query = $resource($engine.baseUrl + '/metrics', {}, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: true }
    });

    return function (documentType) {
        return _query.post({ states: { documentType: documentType }, metrics: null }, function (data) {
            console.log(data);
        });
    };
}).service('engineAction', function ($engine, $resource, EngineInterceptor) {
    var _action = $resource($engine.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', { actionId: '@actionId', documentId: '@documentId' }, {
        post: { method: 'POST', transformResponse: EngineInterceptor.response, isArray: false }
    });

    return function (actionId, document) {
        return _action.post({ actionId: actionId, documentId: document.id, statesAndmetrics: { metrics: document.metrics } });
    };
}).service('engineDocument', function ($engine, $resource, EngineInterceptor) {
    var _document = $resource($engine.baseUrl + '/document/getwithextradata?documentId=:documentId', { documentId: '@documentId' }, {
        get: { method: 'GET', transformResponse: EngineInterceptor.response }
    });

    return { get: function get(documentId) {
            return _document.get({ documentId: documentId });
        } };
});
'use strict';

angular.module('engine.list').component('engine-document-list', {
    templateUrl: '/src/document/list.tpl.html',
    controller: function controller($scope, $route, metrics, $engine, engineQuery, engineAction) {
        // $scope.query = $route.current.$$route.query;
        // $scope.caption = $route.current.$$route.options.caption;
        // $scope.columns = $route.current.$$route.options.columns;
        // $scope.document_type = $route.current.$$route.common_options.document_type;
        // $scope.document_route = $route.current.$$route.common_options.document_route;
        // $scope.list_route = $route.current.$$route.common_options.list_route;
    },
    bindings: {
        documentType: '@',
        query: '@'
    }
}).controller('engineListCtrl', function ($scope, $route, metrics, $engine, engineQuery, engineAction) {
    var self = this;

    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.columns = $route.current.$$route.options.columns;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.document_route = $route.current.$$route.common_options.document_route;
    $scope.list_route = $route.current.$$route.common_options.list_route;

    $scope.documents = engineQuery($scope.query);

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

        metrics($scope.document_type).$promise.then(function (data) {
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
    $scope.genDocumentLink = function (document_route, document) {
        return '#' + $scope.document_route.replace(':id', document);
    };
});
'use strict';

/* jshint ignore:start */
(function () {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = window.brunch || {};
  var ar = br['auto-reload'] = br['auto-reload'] || {};
  if (!WebSocket || ar.disabled) return;
  if (window._ar) return;
  window._ar = true;

  var cacheBuster = function cacheBuster(url) {
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cacheBuster=' + date;
  };

  var browser = navigator.userAgent.toLowerCase();
  var forceRepaint = ar.forceRepaint || browser.indexOf('chrome') > -1;

  var reloaders = {
    page: function page() {
      window.location.reload(true);
    },

    stylesheet: function stylesheet() {
      [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).filter(function (link) {
        var val = link.getAttribute('data-autoreload');
        return link.href && val != 'false';
      }).forEach(function (link) {
        link.href = cacheBuster(link.href);
      });

      // Hack to force page repaint after 25ms.
      if (forceRepaint) setTimeout(function () {
        document.body.offsetHeight;
      }, 25);
    },

    javascript: function javascript() {
      var scripts = [].slice.call(document.querySelectorAll('script'));
      var textScripts = scripts.map(function (script) {
        return script.text;
      }).filter(function (text) {
        return text.length > 0;
      });
      var srcScripts = scripts.filter(function (script) {
        return script.src;
      });

      var loaded = 0;
      var all = srcScripts.length;
      var onLoad = function onLoad() {
        loaded = loaded + 1;
        if (loaded === all) {
          textScripts.forEach(function (script) {
            eval(script);
          });
        }
      };

      srcScripts.forEach(function (script) {
        var src = script.src;
        script.remove();
        var newScript = document.createElement('script');
        newScript.src = cacheBuster(src);
        newScript.async = true;
        newScript.onload = onLoad;
        document.head.appendChild(newScript);
      });
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname || 'localhost';

  var connect = function connect() {
    var connection = new WebSocket('ws://' + host + ':' + port);
    connection.onmessage = function (event) {
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };
    connection.onerror = function () {
      if (connection.readyState) connection.close();
    };
    connection.onclose = function () {
      window.setTimeout(connect, 1000);
    };
  };
  connect();
})();
/* jshint ignore:end */
;
//# sourceMappingURL=angular-engine.js.map