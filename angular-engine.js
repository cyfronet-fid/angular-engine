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
    var documents = [];

    this.document = function (list_route, list_options, document_route, document_options, query, common_options) {
        documents.push({ list_route: list_route, document_route: document_route });

        if (!list_options) list_options = {};

        if (!document_options) document_options = {};

        if (!common_options) common_options = {};

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
    };

    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    this.$get = function () {

        return new function () {
            this.baseUrl = _baseUrl;
            this.documents = documents;
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

    var _query = $resource($engine.baseUrl + '/query/documents?queryId=:query', { query_id: '@query' }, {
        get: { method: 'GET', interceptor: EngineInterceptor }
    });

    return function (query) {
        // return _query.get({query: query});
        return [{ "id": 25, "description": null, "shift": 0, "start": null, "title": "12", "attachments": [], "previousProposal": null, "publications": [], "submissionType": null, "keywords": null, "explanation": null, "end": null, "status": "DRAFT", "beamline": null, "createdAt": 1477607621000, "periodType": null, "discipline": null, "subDiscipline": null, "peemEndStation": false, "xasEndStation": false, "userEndStation": false, "photonEnergyRange": 0, "linearHorizontalPhotonPolarization": false, "linearVerticalPhotonPolarization": false, "circularElipticalPhotonPolarization": false, "totalElectronMeasurementType": false, "fluorescenceYieldMeasurementType": false, "transmissionMeasurementType": false, "linearSkewed": false, "fromTemperature": 0, "toTemperature": 0, "samplePreparationInSitu": false, "evaporation": false, "arSputtering": false, "evaporationMaterial": null, "evaporationThickness": null, "cryogenicTemperature": null, "acceptTermsAndConditions": false, "photonEnergyResolution": 0, "higherHarmonicContamination": 0, "heating": false, "temperatureFrom": 0, "temperatureTo": 0, "gasDosing": false, "gasName": null, "gasAmount": null, "highVoltage": false, "shifts": 0, "nextProposals": [], "proposalAbstract": null, "descriptionFile": null, "objectives": null, "background": null, "purpose": null, "submittedSomewhereElse": false, "continuation": false, "proposalReferences": null, "laboratoryUsage": false, "processes": null, "equipmentAndProductsProvidedBySolaris": null, "equipmentBrought": null, "otherRequirements": null }];
    };
});
'use strict';

angular.module('engine.list').controller('engineListCtrl', function ($scope, $route, $engine, engineQuery) {
    var self = this;

    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.columns = $route.current.$$route.options.columns;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.document_route = $route.current.$$route.common_options.document_route;
    $scope.list_route = $route.current.$$route.common_options.list_route;

    $scope.documents = engineQuery($scope.query);

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