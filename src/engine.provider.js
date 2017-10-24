angular.module('engine')
    .provider('$engLog', function () {
        var _logLevel = 'debug';
        var _provider = this;
        this.setLogLevel = function (level) {
            _logLevel = level
        };

        var _logLevels = ['debug', 'log', 'info', 'warning', 'error', null];

        function canLog(level) {
            return _logLevels.indexOf(level) >= _logLevels.indexOf(_logLevel);
        }

        this.$get = function ($log) {
            return new function () {
                this.setLogLevel = _provider.setLogLevel;

                this.debug = function () {

                    if (canLog('debug'))
                        $log.debug(arguments)
                };
                this.info = function () {

                    if (canLog('info'))
                        $log.info(arguments)
                };
                this.log = function () {

                    if (canLog('log'))
                        $log.log(arguments)
                };
                this.warn = function () {

                    if (canLog('warning'))
                        $log.warn(arguments)
                };
                this.error = function () {

                    if (canLog('error'))
                        $log.error(arguments);
                    throw new Error(arguments)
                };
                this.warning = this.warn;
            };
        };
    })
    .provider('$engineConfig', function () {
        var self = this;
        var _baseUrl = '';
        var _loggingLevel = 'debug';
        this.setBaseUrl = function (url) {
            _baseUrl = url;
        };

        this.setLoggingLevel = function (level) {
            _loggingLevel = level;
        };

        this.$get = function () {
            return {
                baseUrl: _baseUrl,
                setBaseUrl: self.setBaseUrl
            }
        }
    })
    .provider('$engineApiCheck', function (productionMode) {
        var self = this;
        this.apiCheck = apiCheck({
            output: {
                prefix: 'angular-engine'
            },
            // From version 0.7.12+ api check has been depreciated
            // it will be removed in the future
            // disabled: productionMode
            disabled: true
        });

        this.$get = function () {
            return self.apiCheck;
        }
    })
    .service('engineResourceLoader', function ($rootScope, $engLog) {
        var _resourcesCount = 0;


        return {
            register: function (promise) {
                $engLog.debug('registered resource', promise);
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
    .provider('$engine', function ($routeProvider, $engineApiCheckProvider, $engineFormlyProvider, $injector) {
        var self = this;

        var dashboards = [];
        var documents = [];
        var documents_d = {};
        var QUERY_PAGE_SIZE = 50;
        var GLOBAL_CSS = '';
        let MODAL_CONTAINER = 'body';
        let RESPONSIVE = true;
        var DOCUMENT_MODEL_KEY = 'documentType';

        var _apiCheck = $engineApiCheckProvider.apiCheck;
        _apiCheck.columnOptions = _apiCheck.arrayOf(_apiCheck.shape({
            name: _apiCheck.string,
            caption: _apiCheck.string.optional,
            style: _apiCheck.string.optional,
            type: _apiCheck.string.optional
        })).optional;
        _apiCheck.documentOptions = _apiCheck.shape({
            documentJSON: _apiCheck.object,
            name: _apiCheck.string,
            list: _apiCheck.shape({
                caption: _apiCheck.string,
                templateUrl: _apiCheck.string,
                createButtonLabel: _apiCheck.string.optional,
                customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({
                    'label': _apiCheck.string,
                    'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string])
                })).optional
            }),
            document: _apiCheck.shape({
                templateUrl: _apiCheck.string,
                steps: _apiCheck.arrayOf(_apiCheck.object),
                showValidateButton: _apiCheck.bool.optional,
                caption: _apiCheck.string.optional,
                queries: _apiCheck.object.optional
            })
        });

        var _defaultDocumentOptions = {
            list: {
                templateUrl: '/src/list/list.wrapper.tpl.html'
            },
            document: {
                templateUrl: '/src/document/document.wrapper.tpl.html',
                showValidationButton: true
            }
        };

        this.confirmModal = 'engConfirm';

        this.registerConfirmModal = (confirmModalMethod) => {
            this.confirmModal = confirmModalMethod;
        };

        function prepareDocumentOptions(options) {
            if (options.list.customButtons == null)
                options.list.customButtons = [];

            if (!_.isArray(options.list.customButtons))
                options.list.customButtons = [options.list.customButtons];
        }

        self._disableOnReload = false;

        this.disableOnReload = function () {
            self._disableOnReload = true;
        };

        this.enableOnReload = function () {
            self._disableOnReload = false;
        };

        this.setQueryPageSize = function (queryPageSize) {
            QUERY_PAGE_SIZE = queryPageSize;
        };

        this.setGlobalCSS = function (css) {
            GLOBAL_CSS = css;
        };
        this.setModalContainer = function (containerSelector) {
            MODAL_CONTAINER = containerSelector;
        };

        this.setResponsive = function (responsive) {
            RESPONSIVE = responsive;
        };

        this.setDocumentModelKey = function (key) {
            DOCUMENT_MODEL_KEY = key;
        };

        /**
         * @ngdoc method
         * @name dashboard
         * @methodOf engine.provider:$engineProvider
         *
         * @description
         * Register dashboard in angular-engine, angular URL will be generated queries to declared documents
         * will be displayed using column definitions in those declarations.
         *
         * @param {string|Object} url Angular url to created dashboard
         * example: `/sample-dashboard`, can also be object with following shape:
         * ```
         * {url: '/sample-dashboard', label: 'sampleDashboard'}
         * ```
         * where label is additional parameter passed to ng-route
         *
         * @param {Array} queries list of query objects
         * @param {Object} options Dashboard options
         * Available fields:
         * * **templateUrl** {String} url to template which will replace default one
         * * **caption** {String} Dashboard caption (will be translated)
         *
         */
        this.dashboard = function (url, queries, options) {
            var _options = {
                templateUrl: '/src/dashboard/dashboard.tpl.html'
            };

            options = angular.merge(_options, options);

            _apiCheck([_apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]),
                _apiCheck.arrayOf(_apiCheck.shape({
                        queryId: _apiCheck.string,
                        label: _apiCheck.string,
                        controller: _apiCheck.string,
                        contentTemplateUrl: _apiCheck.string.optional,
                        documentModelId: _apiCheck.string.optional,
                        columns: _apiCheck.columnOptions,
                        showCreateButton: _apiCheck.bool.optional,
                        customButtons: _apiCheck.typeOrArrayOf(_apiCheck.shape({
                            'label': _apiCheck.string,
                            'callback': _apiCheck.oneOfType([_apiCheck.func, _apiCheck.string])
                        })).optional
                    }),
                    _apiCheck.shape({
                        templateUrl: _apiCheck.string,
                        caption: _apiCheck.string.optional
                    }))], [url, queries, options]);

            options.queries = queries;

            var dashboardRoutingOptions = {};

            if (_.isObject(url)) {
                dashboardRoutingOptions = url;
                url = url.url;
            }
            dashboardRoutingOptions.templateUrl = options.templateUrl;
            dashboardRoutingOptions.controller = 'engineDashboardCtrl';
            dashboardRoutingOptions.options = options;

            $routeProvider.when(url, dashboardRoutingOptions);

            dashboards.push({'url': url, 'queries': queries, 'options': options});
        };

        function _checkDocumentOptions(options) {
            if (options.document != null) {
                if (options.document.queries != null)
                    _.each(options.document.queries, function (metric) {
                        _apiCheck.throw([_apiCheck.shape({
                            'columns': _apiCheck.columnOptions,
                            'singleDocument': _apiCheck.bool.optional
                        })], [metric])
                    });
                if (options.document.queries == null)
                    options.document.queries = {};
            }
        }

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
         *                                {name: 'id', type: 'link', style: 'id'},
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
         * @param {string|Object} listUrl url to list, which will be added to ngRoute
         * example: ```/simple-document```, can also be object with following shape:
         * ```
         * {url: '/simple-document', label: 'simpleDocument'}
         * ```
         * where label is additional parameter passed to ng-route
         *
         * @param {string|Object} documentUrl url to document, which will be added to ngRoute, has to contain ```:id``` part
         * example: ```/simple-document/:id```
         * ```
         * {url: '/simple-document/:id', label: 'simpleDocumentDetails'}
         * ```
         * where label is additional parameter passed to ng-route
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
         *      Every element in the array should be object containing **'name'** attribute which corresponds to
         *      either document property, or document metric. JS expressions are also possible, so name parameter
         *      can be dynamically calculated eg.:
         *
         *      * {name: '$ext.author.name + "<" + $ext.author.email + ">"'} // will generate output like this: Username <user@user.com>
         *
         *      Additionally `name` parameter can have one of the following
         *      values, which coresspond to special behavior:
         *      * `@index` every row's value will be substituted for this row's index (counted from 1)
         *
         *      additional properties which can be provided:
         *
         *      * **caption** {String} if set will be displayed in the column header row, will be translated
         *
         *      * **type** {String, one of: ['link', 'text', 'date', 'array']} specifies what type of data is stored in this
         *      document field, will be formatted accordingly. 'link' field will be formatted as text, but will be wrapped
         *      in `<a>` tag allowing navigation to the selected document.
         *
         *      * **iterator** {String|Function} only if type of column was specified as `array` it can be either a function
         *      or a js expression in string. It will be called on every element of the array, returned value will be
         *      displayed instead of the original value from the array (this method does not change document's data, it
         *      only affects presentation.
         *
         *      Examples:
         *        *
         *        <pre>
         *        {name: '$ext.team.memberships', type: 'array', iterator: function (member) {
         *                       return member.name + ' <' + memeber.email + '>';
         *                   }
         *        </pre>
         *        *
         *        <pre>
         *        {name: '$ext.team.memberships', type: 'array', iterator: "name + ' <' + email +'>'"}
         *        </pre>
         *
         *      * **processor** {String|Function} It can be either a function or a js expression in string.
         *      It will be called for every entry in this column returned value will be
         *      displayed instead of the original value (this method does not change document's data, it
         *      only affects presentation.
         *
         *      Examples:
         *        *
         *        <pre>
         *        {name: '$ext.author', iterator: function (author) {
         *                       return author.name + ' <' + author.email + '>';
         *                   }
         *        </pre>
         *        *
         *        <pre>
         *        {name: '$ext.author', processor: "name + ' <' + email +'>'"}
         *        </pre>
         *
         *      * **style** {String} css classes which will be appended to the fields (to `<td>` element. one of the
         *      prepared styles is `id` which formats field in monospace font family.
         *
         *    * **customButtons** {Array|Object} custom button or array of custom buttons appended at the bottom of
         *    the view. Object must have following fields:
         *      * **label** {String} button's label
         *      * **callback** {String|Function} function which will be called after button is clicked, documentOptions are passed
         *      as an argument to callback. If argument is a {String} it will be treated as angular service and injected.
         *      be sure to define this service to return function.
         *
         *      Example:
         *
         *      .factory('uploadProposalCalled', function ($log) {
         *            return function uploadProposalCalled(documentOptions) {
         *                $log.debug('uploadProposalCalled', documentOptions);
         *            };
         *      })
         *
         *    * **noDocumentsMessage** {String} *Optional* message shown to user if no documents were retrieved
         *      defaults to "There are no documents to display", will be translated
         *
         *    * **noParentDocumentMessage** {String} *Optional* message shown to user when list has parent document
         *    (is embedded as metric) but parent document has not been saved to database yet. Defaults to
         *    "Parent document does not exist, save this document first", will be translated
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
         *      * **condition** {Function|String}, condition which must be passed for the given step to be shown,
         *      condition can either be a function (which will receive one argument - document) or a string which
         *      will be evaluated (all document's fields will be accessable as locals)
         *
         *      Example string condition: `states.documentState == 'draft' && id != null`
         *      Example Function condition:
         *      ```
         *      function cond(document) {
         *          return document.states.documentType == 'draft' && document.id != null;
         *      }
         *      ```
         *      * **summary** {Object} If specified on top of specified step document summary will be shown
         *      entries in the summary can be specified via `entries` key (this works the same as global **details**
         *      so you can look there for more details.
         *      **NOTICE** the only difference between **step's summary** and **details** is that step's summary
         *      does not have save button, so it ignores **saveCaption** value.
         *
         *    * **showValidationButton** {Boolean}, *Optional*, default `true` if true shows 'Validate' button at
         *    the end of document form
         *
         *    * **summary** {Boolean}, *Optional*, default `true` if true adds additional step to document form, which
         *    will contain non editable document summary. **(NOT IMPLEMENTED YET)**
         *
         *    * **titleSrc** {String}, *Optional*, default `''`. dotted notation referencing element of the document which
         *    will be used as title in existing document's forms. (eg. `'metrics.proposalName'`)
         *
         *    * **details** {Object}, *Optional*, defines additional information displayed in details box, available fields
         *    are:
         *      * **caption** {String}, Displayed caption, if not specified will default to `options.name`
         *      * **saveCaption** {String}, Caption of the save button, default: 'Save'
         *      * **entries** {Array}, array of objects defining additional information displayed in details box, each
         *      element of the array should conform to the following format:
         *        * **name** {String}, id of the element displayed (eg. `states.documentType`) dotted notation is supported
         *        * **caption** {String}, caption for the given entry
         *        * **condition** {String}, condition which has to be passed in order for entry to appear
         *
         *      Example:
         *      `[{name: 'states.documentType', caption: 'Type', condition: 'states.documentType != "draft"'}]`
         *
         *    * **queries** {Object}, *Optional*, if this document contains `QueriedMetricList`
         *    which should have different columns then the ones defined under `document` you can define them here.
         *    **queries** is a dictionary which maps `metricId` -> properties.
         *    These properties is an `Object` which can have following fields:
         *      * **singleDocument** {Boolean} *Optional*, default false. if set to true documents in the list will
         *      be displayed vertically (one property per colum, one table per document) instead of single table
         *      with one document per row.
         *      * **columns**: {Array}, The same as `list.columns` described earlier in `.document` description
         *
         *      Example:
         *      <pre>
         *      queries: queries: {
         *          proposalForProposalResubmition: { //this is metricId
         *              columns: [
         *                  {name: '@index', type: 'link', caption: 'ID'},
         *                  {name: 'id', type: 'link', caption: 'ID'},
         *                  {name: 'states.documentType', caption: 'Type'}
         *              ]
         *          }
         *      }
         *      </pre>
         *    **WARNING** Queries may be defined in both in the definition of the document which appears *inside*
         *    Queried metric list as well as in the document which *contains* Queried Metric List, definition in
         *    document which contains queried metric list overrides one defined in the document being contained.
         *
         * For example object see this method's description.
         *
         *
         */
        this.document = function (documentModelType, listUrl, documentUrl, query, options) {
            options = angular.merge(angular.copy(_defaultDocumentOptions), options);

            _apiCheck.throw([_apiCheck.string, _apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]),
                _apiCheck.oneOfType([_apiCheck.string, _apiCheck.object]), _apiCheck.typeOrArrayOf(_apiCheck.string),
                _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

            assert(options.document.steps.length > 0, 'options.document.steps has length == 0, please define at least one step for document');

            prepareDocumentOptions(options);
            _checkDocumentOptions(options);
            options.documentModelType = documentModelType;
            options.listUrl = listUrl.url || listUrl;
            options.list.url = options.listUrl;
            options.documentUrl = documentUrl.url || documentUrl;
            options.document.url = options.documentUrl;
            options.query = query;
            options.subdocument = false;

            var documentRoutingOptions = {};
            if (_.isObject(documentUrl))
                documentRoutingOptions = documentUrl;

            documentRoutingOptions.templateUrl = options.document.templateUrl;
            documentRoutingOptions.controller = 'engineDocumentWrapperCtrl';
            documentRoutingOptions.options = options;
            documentRoutingOptions.reloadOnSearch = false;


            var listRoutingOptions = {};
            if (_.isObject(listUrl))
                listRoutingOptions = documentUrl;

            listRoutingOptions.templateUrl = options.list.templateUrl;
            listRoutingOptions.controller = 'engineListWrapperCtrl';
            listRoutingOptions.options = options;


            documents.push({list_route: listUrl, document_route: documentUrl});

            $routeProvider.when(options.listUrl, listRoutingOptions);

            $routeProvider.when(options.documentUrl, documentRoutingOptions);

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
            _checkDocumentOptions(options);

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

        var _visibleDocumentFields = [{name: 'id', caption: 'ID', type: 'link', style: 'monospace'}, {
            name: 'name',
            caption: 'Name'
        }];

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
        this.$get = function ($engineFormly, engineDocument, $rootScope, $engLog, engineQuery, $injector) {
            var _engineProvider = self;

            return new function () {
                var self = this;
                this.QUERY_PAGE_SIZE = QUERY_PAGE_SIZE;
                this.GLOBAL_CSS = GLOBAL_CSS;
                this.MODAL_CONTAINER = MODAL_CONTAINER;
                this.RESPONSIVE = RESPONSIVE;
                this.DOCUMENT_MODEL_KEY = DOCUMENT_MODEL_KEY;
                this.apiCheck = _apiCheck;
                this.formly = $engineFormly;
                this.baseUrl = _baseUrl;
                this.documents = documents;
                this.documents_d = documents_d;

                this.confirm = (title, content) => {
                    if (_.isString(_engineProvider.confirmModal)) {
                        return $injector.invoke([_engineProvider.confirmModal, (_confirmModalMethod) => _confirmModalMethod(title, content)]);
                    }
                    else
                        return _engineProvider.confirmModal(title, content);
                };

                /**
                 * true if user disabled onReloadFunction during configuration phase
                 * false otherwise
                 */
                this.disableOnReload = _engineProvider._disableOnReload;

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
                            $engLog.error(errorEvent);
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
                    engineQuery.response_processors.push(processor);
                };
            };
        };

    });