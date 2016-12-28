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
    /**
     * @ngdoc service
     * @name engine.provider:$engineProvider
     *
     * @description
     * Basic means of configuration
     */
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
                createButtonLabel: _apiCheck.string.optional,
                customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({'label': _apiCheck.string, 'callback': _apiCheck.func})).optional
            }),
            document: _apiCheck.shape({
                templateUrl: _apiCheck.string,
                steps: _apiCheck.arrayOf(_apiCheck.object),
                showValidateButton: _apiCheck.bool.optional
            })
        });

        var _defaultDocumentOptions = {
            list: {
                templateUrl: '/src/list/list.wrapper.tpl.html',
            },
            document: {
                templateUrl: '/src/document/document.wrapper.tpl.html',
                showValidationButton: true
            }
        };

        function prepareDocumentOptions(options) {
            if(options.list.customButtons == null)
                options.list.customButtons = [];

            if(!_.isArray(options.list.customButtons))
                options.list.customButtons = [options.list.customButtons];
        }

        /**
         * @ngdoc method
         * @name dashboard
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Register dashboard in angular-engine, angular URL will be generated queries to declared documents
         * will be displayed using column definitions in those declarations.
         *
         * @param {string} url Angular url to created dashboard
         * @param {Array} queries list of query objects
         * @param {Object} options Dashboard options
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
                    showCreateButton: _apiCheck.bool.optional,
                    customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({'label': _apiCheck.string, 'callback': _apiCheck.func})).optional
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
         * @ngdoc method
         * @name document
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Register document in angular-engine, angular URLs will be generated, and document will become available for
         * inclusion in other documents via ```queried_list``` metric
         *
         * **NOTE** The only difference between this method and $engineProvider.subdocument(...) is the fact, that ngRoutes are
         * generated for each registered document.
         *
         *
         * <pre>
         *   var app = angular.module('engine.config.example', ['engine']);
         *             //angular-engine is entirely configured
         *             //by $engineProvider, which means
         *             //that it needs to be run in the configuration phase;
         *             app.config(function($engineProvider) {
         *                //To add document use .document
         *                $engineProvider.document(
         *                    //documentModelName, necessary to link frontend
         *                    //document definitions to backend ones
         *                    'openCall',
         *                    //list url
         *                    '/opencall',
         *                    //document url, must contain :id tag
         *                    '/opencall/:id',
         *                    //list of queries displayed after navigating to list url
         *                    ['MyOpenCalls'],
         *                    //options
         *                    {
         *                        //json fulfilling requirements of
         *                        //the agreemount.engine
         *                        //for document creation / metrics querying
         *                        documentJSON: {
         *                            "states": {
         *                                "documentType": "openCall"
         *                            },
         *                            "metrics": {}
         *                        },
         *                        //name of the resource, will be shown
         *                        //in some labels by default
         *                        //eg. CREATE <name> button, etc.
         *                        name: 'OPENCALL',
         *                        //specific options for list view
         *                        list: {
         *                            //columns visible in table view
         *                            //for this document
         *                            //if ommited all document metrics
         *                            //will be shown (which in most cases
         *                            //will clutter view to great extent)
         *                            columns: [
         *                                {name: 'id'},
         *                                {name: 'name'},
         *                                {name: 'author'},
         *                                {name: 'beamlineChoice'},
         *                                {name: 'states.documentState'},
         *                            ],
         *                            //Caption shown in list view, will be translated
         *                            caption: 'OPENCALL LIST',
         *                            //Create button label, will be translated
         *                            createButtonLabel: 'createOpenCall'
         *                        },
         *                        //specific options for document view
         *                        document: {
         *                            //define form steps for this document
         *                            steps: [
         *                                {name: 'GENEAL',
         *                                 categories: ['beamlineCategory',
         *                                              'openCallForm']}
         *                            ]
         *                        },
         *                        summary: false
         *                });
         *
         *            });
         * </pre>
         *
         * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
         *
         * @param {string} listUrl url to list, which will be added to ngRoute
         * example: ```/simple-document/:id```
         *
         * @param {string} documentUrl url to document, which will be added to ngRoute, has to contain ```:id``` part
         * example: ```/simple-document/:id```
         *
         * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
         * if argument is a string it will be treated as a group **query category** and list of queries will be generated from its children
         *
         * @param {object} options Document options object containing all (if not stated otherwise) below attributes:
         *
         * **documentJSON**: {Object}, json object, which will be send in requests to agreemount.engine when asking for
         * metrics, actions, etc. Especially when document does not exist (before saving), make sure that this
         * Object satisfies all backend constraints
         *
         * **name**: {String}, name of the document type, will be shown on different views, will be translated
         *
         * **list** {Object}, specific options for list view, must contain below attributes (if not stated otherwise)
         *
         *    * **columns**: {Array}, *Optional*, if not specified all document metrics will be displayed.
         *      Every element in the array should be object containing 'name' attribute which corresponds to
         *      either document property, or document metric. Dotted expression to access nested properties are allowed:
         *      <pre>{name: 'state.documentState'}</pre>
         *      additional properties which can be provided:
         *
         *      * **caption** {String} if set will be displayed in the column header row, will be translated
         *
         *      * **type** {String, one of: ['link', 'text', 'date']} specifies what type of data is stored in this
         *      document field, will be formatted accordingly. 'link' field will be formatted as text, but will be wrapped
         *      in `<a>` tag allowing navigation to the selected document.
         *
         *      * **customButtons** {Array|Object} custom button or array of custom buttons appended at the bottom of
         *      the view. Object must have following fields:
         *        * **label** {String} button's label
         *        * **callback** {Function} function which will be called after button is clicked, documentOptions are passed
         *        as an argument to callback
         *
         *    * **caption**: {String}, *Optional* Caption displayed on top of the list view, will be translated
         *
         * **document** {Object}, specific options for document view must contain below attributes (if not stated otherwise)
         *
         *    * **steps** {Array}, Steps on the document form. At least one step must be specified. Every element
         *    of the array must be {Object} containing following fields:
         *
         *      * **name** {String} Displayed field caption, will be translated
         *      * **categories** {Array|String}, agreemount.engine metric-categories which will be displayed in this step.
         *      If this field is a {String} it will be interpreted as metric-category containing children, in which case
         *      those children will be actual categories diplayied in this step, if this field is an {Array} supplied
         *      metric-categories will be used directly.
         *
         *    * **showValidationButton** {Boolean}, *Optional*, default `true` if true shows 'Validate' button at
         *    the end of document form
         *
         *    * **summary** {Boolean}, *Optional*, default `true` if true adds additional step to document form, which
         *    will contain non editable document summary. **(NOT IMPLEMENTED YET)**
         *
         * For example object see this method's description.
         *
         *
         */
        this.document = function (documentModelType, listUrl, documentUrl, query, options) {
            options = angular.merge(angular.copy(_defaultDocumentOptions), options);

            _apiCheck.throw([_apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string),
                _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

            assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

            prepareDocumentOptions(options);

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
         * @ngdoc
         * @name subdocument
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Register subdocument in angular-engine, subdocument will become available for
         * inclusion in other documents via ```queried_list``` metric
         *
         * **NOTE** The only difference between this method and {@link engine.provider:$engineProvider#methods_document $engineProvider.document(...)}
         * is the fact, that ngRoutes are **not** generated for each registered subdocument.
         *
         * @param {string} documentModelType type of document (unique ID, used to identify document between engine backend and frontend
         * @param {string|Array} query Queries which will be shown on document list page (each query will be represented by a table)
         * if argument is a string it will be treated as a group **metric category** and list of queries will be generated from its children
         * @param {Object} options Document options object conforming to format described in
         * {@link engine.provider:$engineProvider#methods_document $engineProvider.document}
         *
         *
         */
        this.subdocument = function (documentModelType, query, options) {
            options = angular.merge(angular.copy(_defaultDocumentOptions), options);

            _apiCheck.throw([_apiCheck.string, _apiCheck.typeOrArrayOf(_apiCheck.string), _apiCheck.documentOptions], [documentModelType, query, options]);

            assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');
            prepareDocumentOptions(options);

            options.query = query;
            options.subdocument = true;

            documents_d[documentModelType] = options;
        };

        this.formly = $engineFormlyProvider;

        var _baseUrl = '';

        /**
         * @ngdoc method
         * @name setBaseUrl
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Sets base url (if engine backend is hosted on another host, or is available not from root of
         * the application but from subdirectory (eg. /engine/...)
         *
         * Default is `''`, which is usually sufficient for standard deployments
         *
         * @param {String} url new url prefix which will be added to all engine backend calls
         */
        this.setBaseUrl = function (url) {
            _baseUrl = url;
        };

        var _visibleDocumentFields = [{name: 'id', caption: 'ID', type: 'link'}, {name: 'name', caption: 'Name'}];

        /**
         * @ngdoc method
         * @name setDocumentFields
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Sets default visible document fields
         *
         * @param {Array} documentFields array of new document fields, which will be added to document list
         * views (apart from all metrics)
         */
        this.setDocumentFields = function (documentFields) {
            _visibleDocumentFields = documentFields;
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

        /**
         * @ngdoc service
         * @name engine.service:$engine
         *
         * @description
         * Allows some lower level interaction with angular-engine.
         * In normal setup calling eny of it's methods should not be required.
         * (If you want to just use angular-engine see {@link engine.provider:$engineProvider $engineProvider}
         *
         */
        this.$get = function ($engineFormly, engineDocument, $rootScope, $log) {
            var _engineProvider = self;

            return new function () {
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
                 * @ngdoc method
                 * @name getOptions
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * Returns document options defined via ```document()``` method
                 *
                 * @param {string} documentModelId Document model ID (same as the one registered with ```.document``` and ```.subdocument``` methods)
                 * @returns {object} options associated with specified dicumentModelId
                 */
                this.getOptions = function (documentModelId) {
                    _apiCheck.string(documentModelId);

                    return documents_d[documentModelId]
                };

                /**
                 * @ngdoc method
                 * @name enableDebug
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * Enables debug output for application.
                 *
                 */
                this.enableDebug = function () {
                    _engineProvider._debug = true;
                    $rootScope.$on('engine.common.error', function (event, errorEvent) {
                        if (_engineProvider._debug)
                            $log.error(errorEvent);
                    })

                };

                /**
                 * @ngdoc method
                 * @name disableDebug
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * Disables debug output for application.
                 *
                 */
                this.disableDebug = function () {
                    _engineProvider._debug = false;
                };

                /**
                 * @ngdoc method
                 * @name pathToDocument
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * Returns path to the document with given ```documentId``` and type included in
                 * ```options.document.documentUrl```
                 *
                 * @param {Object} options Options of the document (options with which document has been registrated using
                 * ```$engineProvider.document(...)```
                 * @param {Object} documentId id of the document to which path should be generated
                 * @returns {String} angular URL to given document form
                 */
                this.pathToDocument = function (options, documentId) {
                    _apiCheck([_apiCheck.documentOptions, _apiCheck.string.optional], arguments);

                    if (!document) {
                        return options.document.documentUrl.replace(':id', 'new');
                    }
                    return options.document.url.replace(':id', documentId);
                };

                /**
                 * @ngdoc method
                 * @name registerResourceProcessor
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * **NOT IMPLEMENTED YET**
                 */
                this.registerResourceProcessor = function () {

                };

                /**
                 * @ngdoc method
                 * @name registerDocumentProcessor
                 * @methodOf engine.service:$engine
                 *
                 * @description
                 * Registers processor function for documents, it's called every time document is loaded from backend:
                 * (form, query (not yet implemented)). Additional fields added to document can be accessed via
                 * components, and referenced by list display configuration {@link engine.provider:$engineProvider#methods_document}
                 *
                 * @param {Function} processor function transforming document data, and returning promise or
                 * processed data
                 *
                 * Function stub (static transformation):
                 * <pre>
                 * function processor(data) {
                 * return data;
                 * }
                 * </pre>
                 *
                 * Function stub (async transformation):
                 * <pre>
                 * function processor(document) {
                 *
                 * return $http.get('/restful/service').then(
                 *     function(response){
                 *         document.$ext = 'some data';
                 *         return document;
                 *     });
                 * }
                 * </pre>
                 *
                 * **NOTE** if document / resource processor intends to add extra data
                 * to resource convention is to add it to `$ext` field (this field will
                 * be stripped before sending it in the http request)
                 *
                 */
                this.registerDocumentProcessor = function (processor) {
                    engineDocument.response_processors.push(processor);
                };
            };
        };

    });