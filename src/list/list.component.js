var app = angular.module('engine.list')
app.component('engineDocumentList', {
    template: '<ng-include src="$ctrl.contentTemplateUrl || \'/src/list/list.component.tpl.html\'"></ng-include>',
    controller: 'engineListCtrl',
    bindings: {
        options: '=',
        query: '=',
        formWidget: '@',
        parentDocument: '=',
        showCreateButton: '=',
        listCaption: '=',
        columns: '=',
        customButtons: '=',
        onSelectBehavior: '@',
        noDocumentsMessage: '@',
        noParentDocumentMessage: '@',
        metricId: '@',
        singleDocument: '=',
        controller: '@',
        contentTemplateUrl: '='
    }
});

app.controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction,
                                           engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal, $engLog,
                                           DocumentActionList, $timeout,
                                           $injector, $rootScope, $parse, $controller) {
    var self = this;
    var _parentDocumentId = null;

    this.$onInit = function () {
        /** These vars below are required for pagination */
        this.documentPages = [];
        this.currentPage = 0;
        this.allDocumentsLoaded = false;
        this.DOCUMENT_QUERY_LIMIT = $engine.QUERY_PAGE_SIZE;
        this.FILTER_DEBOUNCE_TIME = 1000;

        /** These are required for filtering and sorting */
        this.showFilters = false;
        this.filters = {};
        this.ordering = [];


        this.filterQueryAction = null;
        $scope.documents = [];
        self.engineResolve = engineResolve;
        //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
        this.formWidget = this.formWidget === 'true';

        if (self.singleDocument)
            self.template = '/src/list/list.single.tpl.html';
        else
            self.template = '/src/list/list.tpl.html';

        $scope.$parse = $parse;
        $scope.options = this.options;
        $scope.columns = this.columns || ((this.metricId && $scope.options.document.queries != null && $scope.options.document.queries[this.metricId] != null) ?
            $scope.options.document.queries[this.metricId].columns : $scope.options.list.columns);


        $scope.query = self.query || $scope.options.query;
        $scope.customButtons = self.customButtons || self.options.customButtons;


        /**
         * If inject all custom buttons callback which were defined as strings
         */
        _.forEach($scope.customButtons, function (customButton) {
            if (_.isString(customButton.callback)) {
                var callbackName = customButton.callback;
                customButton.callback = function (documentOptions) {
                    $injector.invoke([callbackName, function (callback) {
                        callback(documentOptions);
                    }]);
                }
            }
        });

        _parentDocumentId = this.parentDocument ? this.parentDocument.id : undefined;

        $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON, _parentDocumentId);
        $scope.documentActions = {};

        $scope.$on('engine.list.reload', function (event, query) {
            // if($scope == event.currentScope)
            //     return;
            $engLog.debug('engine.list.reload received, reloading documents', 'queryId', $scope.query);
            self.loadDocuments(true);
        });

        init();

        if (this.controller)
            $controller(this.controller, {$scope: $scope});
    };

    this.filterQuery = function () {
        console.log(this.filters);

        if(this.filterQueryAction !== null)
            $timeout.cancel(this.filterQueryAction);

        this.filterQueryAction = $timeout(function() {
            self.loadDocuments();
        }, this.FILTER_DEBOUNCE_TIME);
    };

    this.setShowFilters = function(show) {
        this.showFilters = show;
    };

    this.calculateVirtualDocumentCount = function () {
        if(($scope.documents.length % this.DOCUMENT_QUERY_LIMIT === 0) && this.allDocumentsLoaded === false)
            return (this.documentPages.length + 1) * this.DOCUMENT_QUERY_LIMIT;
        return (this.documentPages.length * this.DOCUMENT_QUERY_LIMIT);
    };

    this.onPageChanged = function () {
        if(this.currentPage > this.documentPages.length) {
            this.loadDocuments();
            return;
        }

        $scope.documents = this.documentPages[this.currentPage-1];
    };

    this.canShowInputFilterForColumn = function (column) {
        return column.name !== '@index' && (_.isUndefined(column.type) || column.type === 'text' || column.type === 'link');
    };


    this.arrayCellIterate = function (iterator, array) {
        if (array == null)
            return '';
        if (iterator == null)
            return array.join(', ');

        return _.map(array, function (element) {
            if (_.isFunction(iterator))
                return iterator(element);
            return $parse(iterator)(element);
        }).join(', ');
    };

    this.process = function (processor, element) {
        if (processor != null && _.isFunction(processor))
            return processor(element);
        return element;
    };

    this.loadDocuments = function (clear) {
        if(clear === true) {
            self.documentPages = [];
            self.currentPage = 1;
            self.allDocumentsLoaded = false;
        }

        $scope.documentActions = {};
        if ((this.parentDocument == null) || (this.parentDocument != null && this.parentDocument.id != null)) {
            $scope.documents = engineQuery.get($scope.query, this.parentDocument, undefined, undefined, self.documentPages.length * self.DOCUMENT_QUERY_LIMIT, self.DOCUMENT_QUERY_LIMIT,
                this.ordering, this.filters);
            $scope.documents.$promise.then(function (documents) {
                // there are no documents for this page, loaded everything
                if($scope.documents.length === 0) {
                    self.allDocumentsLoaded = true;
                    self.currentPage = self.documentPages.length;
                    if(!_.isEmpty(self.documentPages))
                        $scope.documents = _.last(self.documentPages);
                    return;
                }

                self.documentPages.push($scope.documents);
                self.currentPage = self.documentPages.length;

                if($scope.documents.length !== self.DOCUMENT_QUERY_LIMIT)
                    this.allDocumentsLoaded = true;
                angular.forEach(documents, function (document) {
                    $scope.documentActions[document.document.id] = new DocumentActionList(document.actions, document.document, self.parentDocument, $scope);
                });

                if (self.metricId != null) {
                    if (self.parentDocument.$ext == null)
                        self.parentDocument.$ext = {};
                    if (self.parentDocument.$ext.queries == null)
                        self.parentDocument.$ext.queries = {};
                    self.parentDocument.$ext.queries[self.metricId] = documents;
                }
            });
        }
        else {
            this.noParentDocument = true;
            $scope.documents = {$resolved: 1};
        }
    };

    $scope.getActionsForDocument = function (documentEntry) {
        return $scope.documentActions[documentEntry.document.id];
    };

    $scope.engineAction = function (action) {
        return action.call().then(function () {
            $rootScope.$broadcast('engine.list.reload', $scope.query);
        });
    };

    $scope.renderCell = function (document, column) {
        return document[column.name];
    };
    $scope.getCellTemplate = function (document, column, force_type) {
        if (!force_type && column.type == 'link') {
            return '/src/list/cell/link.tpl.html'
        }

        if (column.type) {
            if (column.type == 'date')
                return '/src/list/cell/date.tpl.html';
            else if (column.type == 'array')
                return '/src/list/cell/array.tpl.html';
        }
        if (column.name == '@index')
            return '/src/list/cell/index.tpl.html';
        return '/src/list/cell/text.tpl.html';
    };
    $scope.onDocumentSelect = function (documentEntry, $event) {
        if (_parentDocumentId) {
            if (self.onSelectBehavior == 'LINK') {
                $scope.getActionsForDocument(documentEntry).callLink().then(function () {
                    $rootScope.$broadcast('engine.list.reload', $scope.query);
                });
            } else {
                if ($scope.options.subdocument == true)
                    DocumentModal(documentEntry.document.id, $scope.options, _parentDocumentId, function () {
                        // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                        $rootScope.$broadcast('engine.list.reload', $scope.query);
                    });
                else {
                    // $location.$$search.step = 0;
                    // $location.$$path = $scope.genDocumentLink(documentEntry.document.id);
                    // $location.$$compose();
                }
            }
        } else {
        }
    };

    $scope.canGenerateHref = function () {
        if (_parentDocumentId && self.onSelectBehavior === 'LINK')
            return false;
        else if ($scope.options.subdocument === true)
            return false;
        return true;
    };

    $scope.genDocumentLink = function (documentId, hash) {
        if (!$scope.options.documentUrl || !$scope.canGenerateHref())
            return '';
        return (hash == true ? '#' : '') + $scope.options.documentUrl.replace(':id', documentId);
    };

    $scope.onCreateDocument = function () {
        if ($scope.options.subdocument === true)
            DocumentModal(undefined, $scope.options, self.parentDocument, function () {
                // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                $rootScope.$broadcast('engine.list.reload', $scope.query);
            });
        else
            $location.path($scope.genDocumentLink('new'));

    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) !== null;
    };

    function init() {
        if ($scope.columns === null || $scope.columns === undefined) {
            $scope.columns = [];

            $engine.visibleDocumentFields.forEach(function (field) {
                if (field.caption === undefined && field.id === undefined)
                    $scope.columns.push({name: field});
                else
                    $scope.columns.push(field);
            });

            engineMetric({documentJSON: $scope.options.documentJSON}, function (data) {
                angular.forEach(data, function (metric) {
                    $scope.columns.push({name: metric.id, caption: metric.label});
                });
            });
        }
        self.loadDocuments();
    }
});
