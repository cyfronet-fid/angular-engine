'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'formly',
// 'formly-bootstrap',
'engine.list', 'engine.document']);
'use strict';

angular.module('engine.list', ['ngRoute']);
'use strict';

angular.module('engine.document').controller('engineDocumentCtrl', function ($scope, $route, metrics) {
    $scope.query = $route.current.$$route.query;
    $scope.document_type = $route.current.$$route.common_options.document_type;

    $scope.metrics = metrics($scope.document_type);
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

        if (!document_options.templateUrl) document_options.templateUrl = '/src/document/document.tpl.html';

        $routeProvider.when(list_route, { templateUrl: list_options.templateUrl, controller: 'engineListCtrl',
            query: query,
            options: list_options,
            common_options: common_options
        });

        $routeProvider.when(document_route, { templateUrl: document_options.templateUrl, controller: 'engineDocumentCtrl',
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

    var _query = $resource($engine.baseUrl + '/query/documents?queryId=:query', { query_id: '@query' }, {
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
});
;'use strict';

angular.module('engine.list').controller('engineListCtrl', function ($scope, $route, metrics, $engine, engineQuery) {
    var self = this;

    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.columns = $route.current.$$route.options.columns;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.document_route = $route.current.$$route.common_options.document_route;
    $scope.list_route = $route.current.$$route.common_options.list_route;

    $scope.documents = engineQuery($scope.query);

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