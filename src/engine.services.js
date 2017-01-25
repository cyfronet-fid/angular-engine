angular.module('engine')
    .factory('engineResolve', function () {
        function index(obj,i) {
            if(obj == null)
                return undefined;
            return obj[i]
        }

        return function (baseObject, str) {
            return str.split('.').reduce(index, baseObject);
        };
    })
    .factory('$engResource', function ($engineConfig) {

        var engResource = function () {
            var defaults = {
                browse:  { method: 'GET',   transformResponse: transformResponse },
                query:   { method: 'GET',   transformResponse: transformResponse, isArray: true },
                get:     { method: 'GET',   transformResponse: transformResponse },
                create:  { method: 'POST',  transformRequest: transformRequest },
                update:  { method: 'PATCH', transformRequest: transformRequest },
                destroy: { method: 'DELETE' }
            };

            angular.extend(defaults, options.methods);

            var resource = $resource($engineConfig.baseUrl + options.url, options.params, defaults);

            return resource;
        };

        return engResource;
    })


    .service('engineQuery', function ($engineConfig, $engineApiCheck, $http, EngineInterceptor, $q) {

        var request_processors = [];
        var response_processors = [];

        return {
            request_processors: request_processors,
            response_processors: response_processors,
            get: function (query, parentDocument, callback, errorCallback) {
                $engineApiCheck.throw([apiCheck.string, apiCheck.object.optional, apiCheck.func.optional, apiCheck.func.optional], arguments);

                var parentDocumentId = parentDocument != null && parentDocument.id != null ? parentDocument.id : '';

                var res = [];
                res.$resolved = 0;

                var q = $http.post($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=' + query +
                                   '&attachAvailableActions=true&documentId=' +
                                   parentDocumentId + '&attachAvailableActions=true',
                                   parentDocument)
                    .then(function (response) {
                        return response.data;
                    })
                    .then(EngineInterceptor.response)
                    .then(function (data) {
                        res = angular.merge(res, data);
                        return res;
                    });

                _.forEach(response_processors, function (processor) {
                    var processingQueue = [];
                    q = q.then(function (documents) {
                        _.forEach(documents, function (document, index) {
                            if(!_.isNaN(parseInt(index)))
                                processingQueue.push($q.when(processor(document.document)));
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
                    res.$errorMessage = response.data.msg
                }).then(callback, errorCallback);
                res.$promise = q;
                return res;
            }
        }
    })
    .service('engineDashboard', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {

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
        var metricSorter = function (data, headersGetter, status) {
            var data = EngineInterceptor.response(data, headersGetter, status);
            data = _.sortBy(data, 'position');

            return data;
        };

        var _query = $resource($engineConfig.baseUrl + '/metrics', {}, {
            post: {method: 'POST', transformResponse: metricSorter, isArray: true}
        });

        return function (documentJSON, callback, errorCallback) {
            $engineApiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

            return _query.post(documentJSON, callback, errorCallback);
        }
    })
    .service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $log) {
        var categorySorter = function (data, headersGetter, status) {
            var data = EngineInterceptor.response(data, headersGetter, status);
            // data = _.sortBy(data, 'position');

            return data;
        };

        var _query = $resource($engineConfig.baseUrl + '/metric-categories', {}, {
            get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
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
                getNames: function (metricCategoryId) {
                    if (!(metricCategoryId in _names))
                        $log.error('You tried to access metricCategory which does not exist, check whether metric references existsing metric category. Wrong key: ' + metricCategoryId);
                    return _names[metricCategoryId]
                }
            };
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

        return function (actionId, document, callback, errorCallback, parentDocumentId) {
            $engineApiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

            return _action.post({actionId: actionId, documentId: parentDocumentId || document.id}, document, callback, errorCallback);
        }
    })
    .service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $http) {
        var _document = $resource('', {documentId: '@documentId'},
            {
                getDocument: {url: $engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true',
                              method: 'POST', transformResponse: EngineInterceptor.response},
                validate:    {url: $engineConfig.baseUrl + '/validate-metric-values',
                              method: 'POST', transformResponse: EngineInterceptor.response}
            });

        var request_processors = [];
        var response_processors = [];

        return {
            request_processors: request_processors,
            response_processors: response_processors,
            get: function (documentId, callback, errorCallback) {
                $engineApiCheck([$engineApiCheck.string, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments, errorCallback);

                var res = {$resolved: 0};

                var q = $http.post($engineConfig.baseUrl + '/document/getwithextradata?documentId='+documentId+'&attachAvailableActions=true', null)
                    .then(function (response) {
                        return response.data;
                    })
                    .then(EngineInterceptor.response)
                    .then(function (data) {
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
             * @param document
             * @param callback
             * @param errorCallback
             * @returns {*|{url, method, transformResponse}}
             */
            validate: function (document, callback, errorCallback) {
                $engineApiCheck([$engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional],
                                 arguments);

                return _document.validate({}, document, callback, errorCallback);
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



