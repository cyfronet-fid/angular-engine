angular.module('engine')
    .factory('engineResolve', function () {
        function index(obj,i) {return obj[i]}

        return function (baseObject, str) {
            return str.split('.').reduce(index, baseObject);
        };
    })
    .service('engineQuery', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {

        var _query = $resource($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=:query&attachAvailableActions=true&documentId=:documentId',
            {query_id: '@query', documentId: '@documentId'}, {
                get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
            });

        return function (query, parentDocumentId, callback, errorCallback) {
            $engineApiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments);
            return _query.get({query: query, documentId: parentDocumentId}, callback, errorCallback);
        }
    })
    .service('engineDashboard', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, engineQuery) {

        var _queryCategory = $resource($engineConfig.baseUrl + '/query?queryCategoryId=:queryCategoryId', {queryCategoryId: '@queryCategoryId'},
            {get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}});

        return {
            fromList: function (queryIds) {
                $engineApiCheck([apiCheck.arrayOf(apiCheck.string)], arguments)


            },
            fromCategory: function (queryCategoryId, callback, errorCallback) {
                $engineApiCheck([apiCheck.string], arguments);

                return _queryCategory.get({'queryCategoryId': queryCategoryId}, callback, errorCallback);
            }
        }
    })
    .service('engineMetric', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _query = $resource($engineConfig.baseUrl + '/metrics', {}, {
            post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
        });

        return function (documentJSON, callback, errorCallback) {
            $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

            return _query.post(documentJSON, callback, errorCallback);
        }
    })
    .service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $log, engineResourceLoader) {
        var _query = $resource($engineConfig.baseUrl + '/metric-categories', {}, {
            get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
        });

        var _metricCategories = {};
        var _names = {};

        function collectMetrics(metrics) {
            function writeMetric(_metric) {
                _names[_metric.id] = {label: _metric.label, position: _metric.position, visualClass: _metric.visualClass};
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
            return {metrics: _metricCategories, getNames: function (metricId) {
                if(!(metricId in _names))
                    $log.error('You tried to access metricCategory which does not exist, check whether metric references existsing metric category. Wrong key: '+metricId);
                return _names[metricId]
            }};
        });

        return _promise
    })
    .service('engineActionsAvailable', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _action = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId', {documentId: '@id'}, {
            post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
        });

        return {
            forDocument: function (document, callback, errorCallback) {
                $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

                return _action.post({documentId: document.id}, document, callback, errorCallback)
            },
            forType: function (documentJson, parentDocumentId, callback, errorCallback) {
                return _action.post({documentId: parentDocumentId}, documentJson, callback, errorCallback);
            }
        };
    })
    .service('engineAction', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId', {
            actionId: '@actionId',
            documentId: '@documentId'
        }, {
            post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: false}
        });

        return function (actionId, document, callback, errorCallback) {
            $engineApiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

            return _action.post({actionId: actionId, documentId: document.id}, document, callback, errorCallback);
        }
    })
    .service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _document = $resource($engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true', {documentId: '@documentId'},
            {
                getDocument: {method: 'POST', transformResponse: EngineInterceptor.response},
            });

        return {
            get: function (documentId, callback, errorCallback) {
                $engineApiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments, errorCallback);

                //null is passed explicitly to POST data, to ensure engine compatibility
                return _document.getDocument({documentId: documentId}, null, callback, errorCallback);
            }
        }
    }).service('EngineInterceptor', function () {

    function processData(data) {
        if (data == null)
            return;
        if (data.document !== undefined)
            data = data.document;
        if (data.metrics !== null && data.metrics !== undefined) {
            for (var metric in data.metrics) {
                data[metric] = data.metrics[metric];
            }
        }
    }

    return {
        response: function (data, headersGetter, status) {
            if (angular.isString(data)) {
                if (data == "")
                    return {};
                else
                    data = angular.fromJson(data);
            }

            data = data.data;
            if (data instanceof Array) {
                angular.forEach(data, processData);
            }
            else
                processData(data);

            return data;
        },
        request: function (data, headersGetter) {
            var site = data.site;
            console.log('parsing request');
            if (site && site.id) {
                data.site = site.id;
                data.siteName = site.value.provider_id;
            }

            return angular.toJson(data)
        }
    }

}).service('MetricToFormly', function () {
    return function (data, headersGetter, status) {

    };
});



