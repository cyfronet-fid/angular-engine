'use strict';

angular.module('engine.document', ['ngRoute']);
'use strict';

angular.module('engine', ['ngRoute', 'ngResource', 'engine.list', 'engine.document']);
'use strict';

angular.module('engine.list', ['ngRoute']);
'use strict';

angular.module('engine.document').controller('engineDocumentCtrl', function ($scope, $route) {
    $scope.query = $route.current.$$route.query;
});
'use strict';

angular.module('engine').provider('$engine', function ($routeProvider) {

    this.document = function (list_route, document_route, query, options) {

        if (!options) options = {};

        if (!options.listTemplateUrl) options.listTemplateUrl = 'src/list/list.tpl.html';

        if (!options.documentTemplateUrl) options.documentTemplateUrl = 'src/document/document.tpl.html';

        $routeProvider.when(list_route, { templateUrl: options.listTemplateUrl, controller: 'engineListCtrl',
            query: query,
            options: options
        });

        $routeProvider.when(document_route, { templateUrl: options.documentTemplateUrl, controller: 'engineDocumentCtrl',
            query: query,
            options: options
        });
    };

    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    this.$get = function () {
        return new function () {
            this.baseUrl = _baseUrl;
        }();
    };
}).provider('EngineInterceptor', function () {

    this.$get = function ($resource) {
        return {
            response: function response(_response) {
                return _response.resource.data;
            },
            responseError: function responseError(response) {
                return response;
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
    };
});
'use strict';

angular.module('engine').service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var query = $resource($engine.baseUrl + '/query/documents?queryId=:query', { query_id: '@query' }, {
        get: { method: 'GET', interceptor: EngineInterceptor }
    });

    return function (query) {
        return query.get({ query: query });
    };
});
'use strict';

angular.module('engine.list').controller('engineListCtrl', function ($scope, $route, engineQuery) {
    $scope.query = $route.current.$$route.query;

    $scope.documents = engineQuery($scope.query);
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