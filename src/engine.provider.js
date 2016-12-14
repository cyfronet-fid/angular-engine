angular.module('engine')
    .provider('$engineConfig', function () {
        var self = this;
        var _baseUrl = '';

        this.setBaseUrl = function (url) {
            _baseUrl = url;
        };

        this.$get = function () {
            return {
                baseUrl: _baseUrl,
                setBaseUrl: self.setBaseUrl
            }
        }
    })
    .provider('$engineApiCheck', function () {

        this.apiCheck = apiCheck({});

        var _apiCheck = this.apiCheck;

        this.apiCheck = _apiCheck;

        this.$get = function () {
            return _apiCheck
        }
    })
    .service('engineResourceLoader', function ($rootScope, $log) {
        var _resourcesCount = 0;


        return {
            register: function (promise) {
                $log.debug('registered resource', promise);
                ++_resourcesCount;
                promise.then(function () {
                    --_resourcesCount;
                    if (_resourcesCount == 0)
                        $rootScope.$broadcast('engine.common.resourcesLoaded');
                });
            },
            resources: _resourcesCount
        }
    })
    .provider('$engine', function ($routeProvider, $engineApiCheckProvider, $engineFormlyProvider) {
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

            _apiCheck([_apiCheck.string,
                _apiCheck.arrayOf(_apiCheck.shape({
                    queryId: _apiCheck.string,
                    label: _apiCheck.string,
                    documentModelId: _apiCheck.string,
                    columns: _apiCheck.arrayOf(_apiCheck.shape({name: _apiCheck.string, label: _apiCheck.string})).optional,
                    showCreateButton: _apiCheck.bool.optional
                }),
                _apiCheck.shape({templateUrl: _apiCheck.string}))], [url, queries, options]);

            options.queries = queries;

            $routeProvider.when(url, {
                templateUrl: options.templateUrl, controller: 'engineDashboardCtrl',
                options: options
            });

            dashboards.push({'url': url, 'queries': queries, 'options': options});
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

            _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string),
                _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

            options.documentModelType = documentModelType;
            options.listUrl = listUrl;
            options.list.url = listUrl;
            options.documentUrl = documentUrl;
            options.document.url = documentUrl;
            options.query = query;
            options.subdocument = false;

            documents.push({list_route: listUrl, document_route: documentUrl});

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

        var _visibleDocumentFields = [{name: 'id', caption: 'ID', type: 'link'}, {name: 'name', caption: 'Name'}];

        this.setDocumentFields = function (document_fields) {
            _visibleDocumentFields = document_fields;
        };

        this.addDocumentFields = function (document_fields) {
            if (document_fields instanceof Array)
                angular.forEach(document_fields, function (field) {
                    _visibleDocumentFields.push(field);
                });
            else
                _visibleDocumentFields.push(document_fields);
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

                    return documents_d[documentModelId]
                };

                this.enableDebug = function () {
                    _engineProvider._debug = true;
                    $rootScope.$on('engine.common.error', function (event, errorEvent) {
                        if (_engineProvider._debug)
                            $log.error(errorEvent);
                    })

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
                }
            };
        };

    })