angular.module('engine.list')
.component('engineDocumentList', {
    templateUrl: '/src/list/list.tpl.html',
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
        metricId: '@'
    }
})
.controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction,
                                        engineActionsAvailable, engineActionUtils, engineResolve, DocumentModal, $log,
                                        $injector, $rootScope, $parse) {
    var self = this;

    self.engineResolve = engineResolve;
    //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
    this.formWidget = this.formWidget === 'true';

    $scope.$watch('$ctrl.showCreateButton', function (oldVal, newVal) {
        if (self.showCreateButton == undefined)
            self._showCreateButton = true;
        else
            self._showCreateButton = newVal;
    });


    $scope.$parse = $parse;
    $scope.options = this.options;
    $scope.columns = this.columns || $scope.options.list.columns;


    $scope.query = self.query || $scope.options.query;
    $scope.customButtons = self.customButtons || self.options.customButtons;

    /**
     * If inject all custom buttons callback which were defined as strings
     */
    _.forEach($scope.customButtons, function (customButton) {
        if(_.isString(customButton.callback)) {
            var callbackName = customButton.callback;
            customButton.callback = function (documentOptions) {
                $injector.invoke([callbackName, function (callback) {
                    callback(documentOptions);
                }]);
            }
        }
    });

    var _parentDocumentId = this.parentDocument ? this.parentDocument.id : undefined;

    this.arrayCellIterate = function (iterator, array) {
        if(iterator == null)
            return array.join(', ');

        return _.map(array, function (element) {
            if(_.isFunction(iterator))
                return iterator(element);
            return $parse(iterator)(element);
        }).join(', ');
    };

    this.process = function (processor, element) {
        if(processor != null && _.isFunction(processor))
            return processor(element);
        return element;
    };

    this.loadDocuments = function () {
        if((this.parentDocument == null) || (this.parentDocument != null && this.parentDocument.id != null)){
            $scope.documents = engineQuery.get($scope.query, this.parentDocument);
            $scope.documents.$promise.then(function (documents) {
                if(self.metricId != null) {
                    if(self.parentDocument.$ext == null)
                        self.parentDocument.$ext = {};
                    if(self.parentDocument.$ext.queries == null)
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
    $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON, _parentDocumentId);

    $scope.engineAction = function (action, document) {

        // if(action.type == 'LINK'){
        //     return engineAction(action.id, self.parentDocument, undefined, undefined, document.id).$promise.then(function (data) {
        //         $rootScope.$broadcast('engine.list.reload', $scope.query);
        //     }, undefined);
        // } else {
        return engineAction(action.id, document, null, null, _parentDocumentId).$promise.then(function (data) {
            // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
            $rootScope.$broadcast('engine.list.reload', $scope.query);
        });
        // }
    };

    $scope.renderCell = function (document, column) {
        return document[column.name];
    };
    $scope.getCellTemplate = function (document, column, force_type) {
        if(!force_type && column.type == 'link'){
            return '/src/list/cell/link.tpl.html'
        }

        if(column.type) {
            if(column.type == 'date')
                return '/src/list/cell/date.tpl.html';
            else if(column.type == 'array')
                return '/src/list/cell/array.tpl.html';
        }
        if(column.name == '@index')
            return '/src/list/cell/index.tpl.html';
        return '/src/list/cell/text.tpl.html';
    };
    $scope.onDocumentSelect = function(documentEntry) {
        if(_parentDocumentId) {
            if(self.onSelectBehavior == 'LINK') {
                var linkAction = engineActionUtils.getLinkAction(documentEntry.actions);

                if(linkAction != null)
                    $scope.engineAction(linkAction, documentEntry.document);
                else
                    $log.warn(self.query, ' QueriedList onSelectBehavior set as Link, but document does not have link action available')
            } else {
                if($scope.options.subdocument == true)
                    DocumentModal(documentEntry.document.id, $scope.options, _parentDocumentId, function () {
                        // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                        $rootScope.$broadcast('engine.list.reload', $scope.query);
                    });
                else {
                    $location.$$search.step = 0;
                    $location.$$path = $scope.genDocumentLink(documentEntry.document.id);
                    $location.$$compose();
                }
            }
        } else {
            $location.path($scope.genDocumentLink(documentEntry.document.id));
        }
    };

    $scope.genDocumentLink = function (documentId) {
        return $scope.options.documentUrl.replace(':id', documentId);
    };

    $scope.onCreateDocument = function() {
        if($scope.options.subdocument == true)
            DocumentModal(undefined, $scope.options, self.parentDocument, function () {
                // $scope.documents = engineQuery.get($scope.query, self.parentDocument);
                $rootScope.$broadcast('engine.list.reload', $scope.query);
            });
        else
            $location.path($scope.genDocumentLink('new'));

    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };

    $scope.$on('engine.list.reload', function (event, query) {
        // if($scope == event.currentScope)
        //     return;
        $log.debug('engine.list.reload received, reloading documents', 'queryId', $scope.query);
        self.loadDocuments();
    });

    function init() {
        if($scope.columns === null || $scope.columns === undefined) {
            $scope.columns = [];

            $engine.visibleDocumentFields.forEach(function (field) {
                if(field.caption === undefined && field.id === undefined)
                    $scope.columns.push({name: field});
                else
                    $scope.columns.push(field);
            });

            engineMetric($scope.options.documentJSON, function (data) {
                angular.forEach(data, function (metric) {
                    $scope.columns.push({name: metric.id, caption: metric.label});
                });
            });
        }
        self.loadDocuments();
    }

    init();
});