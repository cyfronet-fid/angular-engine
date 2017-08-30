angular.module('engine')
    .factory('engineResolve', function () {
        function index(obj, i) {
            if (obj == null)
                return undefined;
            return obj[i]
        }

        return function (baseObject, str) {
            if (!str)
                return '';
            return str.split('.').reduce(index, baseObject);
        };
    })
    .factory('$engResource', function ($engineConfig) {

        var engResource = function () {
            var defaults = {
                browse: {method: 'GET', transformResponse: transformResponse},
                query: {method: 'GET', transformResponse: transformResponse, isArray: true},
                get: {method: 'GET', transformResponse: transformResponse},
                create: {method: 'POST', transformRequest: transformRequest},
                update: {method: 'PATCH', transformRequest: transformRequest},
                destroy: {method: 'DELETE'}
            };

            angular.extend(defaults, options.methods);

            var resource = $resource($engineConfig.baseUrl + options.url, options.params, defaults);

            return resource;
        };

        return engResource;
    })


    .service('engineQuery', function ($engineConfig, $engLog, $engineApiCheck, $http, EngineInterceptor, $q) {

        var request_processors = [];
        var response_processors = [];

        return {
            request_processors: request_processors,
            response_processors: response_processors,
            get: function (query, parentDocument, callback, errorCallback, skip, limit, sort, filters) {
                $engineApiCheck.throw([$engineApiCheck.string, $engineApiCheck.object.optional,
                    $engineApiCheck.func.optional, $engineApiCheck.func.optional,
                    $engineApiCheck.number.optional, $engineApiCheck.number.optional,
                    $engineApiCheck.array.optional,
                    $engineApiCheck.any.optional
                ], arguments);

                var parentDocumentId = parentDocument != null && parentDocument.id != null ? parentDocument.id : '';

                var res = [];
                res.$resolved = 0;

                $engLog.debug('searching', filters);

                var q = $http.post($engineConfig.baseUrl + '/query/documents-with-extra-data?queryId=' + query +
                    '&attachAvailableActions=true&otherDocumentId=' + parentDocumentId + '&documentId=' + parentDocumentId +
                    (!_.isUndefined(skip) && !_.isUndefined(limit) ? '&skip='+skip+'&limit='+limit : '') +
                    (!_.isUndefined(sort) && !_.isEmpty(sort) ? '&sort='+sort.join(',') : '') +
                    (!_.isUndefined(filters) && !_.isEmpty(filters) ? '&constraints='+btoa(angular.toJson(filters)) : ''))
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
                            if (!_.isNaN(parseInt(index)))
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
                $engineApiCheck([$engineApiCheck.arrayOf($engineApiCheck.string)], arguments)


            },
            fromCategory: function (queryCategoryId, callback, errorCallback) {
                $engineApiCheck([$engineApiCheck.string], arguments);

                return _queryCategory.get({'queryCategoryId': queryCategoryId}, callback, errorCallback);
            }
        }
    })
    .service('engineMetric', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        function metricSorter (data, headersGetter, status) {
            var data = EngineInterceptor.response(data, headersGetter, status);
            data = _.sortBy(data, 'position');

            return data;
        }

        var _query = $resource($engineConfig.baseUrl + '/metrics?documentId=:id', {id: '@id'}, {
            post: {method: 'POST', transformResponse: metricSorter, isArray: true}
        });

        return function (options, callback, errorCallback) {
            $engineApiCheck([$engineApiCheck.shape({
                documentJSON: $engineApiCheck.object,
                otherDocumentId: $engineApiCheck.string.optional
            }), $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

            var params = {};
            if (!!options.otherDocumentId) {
                params.otherDocumentId = options.otherDocumentId;
            }

            return _query.post(params, _.omit(options.documentJSON, '$ext'), callback, errorCallback);
        }
    })
    .service('engineMetricCategories', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $engLog) {
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
            $engLog.debug(_metricCategories);
            return {
                $resolved: true,
                metrics: _metricCategories,
                getNames: function (metricCategoryId) {
                    if (!(metricCategoryId in _names))
                        $engLog.error('You tried to access metricCategory which does not exist, check whether metric references existsing metric category. Wrong key: ' + metricCategoryId);
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
                $engineApiCheck([$engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

                return _action.post({documentId: document.id}, document, callback, errorCallback)
            },
            forType: function (documentJson, parentDocumentId, callback, errorCallback) {
                return _action.post({otherDocumentId: parentDocumentId}, documentJson, callback, errorCallback);
            }
        };
    })
    .service('engineAction', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId&otherDocumentId=:otherDocumentId', {
            actionId: '@actionId',
            documentId: '@documentId',
            otherDocumentId: '@otherDocumentId'
        }, {
            post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: false}
        });

        return function (actionId, document, callback, errorCallback, parentDocumentId, documentId) {
            $engineApiCheck([$engineApiCheck.string, $engineApiCheck.object, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

            return _action.post({
                actionId: actionId,
                documentId: documentId || document.id,
                otherDocumentId: parentDocumentId
            }, document, callback, errorCallback);
        }
    })
    .service('engineDocument', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor, $http) {
        var _document = $resource('', {documentId: '@documentId'},
            {
                getDocument: {
                    url: $engineConfig.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true',
                    method: 'POST', transformResponse: EngineInterceptor.response
                },
                validate: {
                    url: $engineConfig.baseUrl + '/validate-metric-values' + '?documentId=:documentId',
                    method: 'POST', transformResponse: EngineInterceptor.response
                }
            });

        var request_processors = [];
        var response_processors = [];

        return {
            request_processors: request_processors,
            response_processors: response_processors,
            get: function (documentId, callback, errorCallback) {
                $engineApiCheck([$engineApiCheck.string, $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments, errorCallback);

                var res = {$resolved: 0};

                var q = $http.post($engineConfig.baseUrl + '/document/getwithextradata?documentId=' + documentId + '&attachAvailableActions=true', null)
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
             * @param options
             * @param callback
             * @param errorCallback
             * @returns {*|{url, method, transformResponse}}
             */
            validate: function (options, callback, errorCallback) {
                $engineApiCheck([$engineApiCheck.shape({
                    document: $engineApiCheck.object,
                    otherDocumentId: $engineApiCheck.string.optional
                }), $engineApiCheck.func.optional, $engineApiCheck.func.optional], arguments);

                return _document.validate({
                    documentId: options.document.id,
                    otherDocumentId: options.otherDocumentId
                }, options.document, callback, errorCallback);
            }
        }
    }).service('EngineInterceptor', function ($engLog) {

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
            $engLog.log('parsing request');
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



