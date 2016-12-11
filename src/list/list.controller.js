angular.module('engine.list')
.component('engineDocumentList', {
    templateUrl: '/src/list/list.tpl.html',
    controller: 'engineListCtrl',
    bindings: {
        options: '=',
        query: '=',
        formWidget: '@',
        parentDocument: '='
    }
})
.controller('engineListWrapperCtrl', function ($scope, $route) {
    $scope.options = $route.current.$$route.options;
    $scope.query = $route.current.$$route.options.query;
})
.controller('engineListCtrl', function ($scope, $route, $location, engineMetric, $engine, engineQuery, engineAction,
                                        engineActionsAvailable, engineActionUtils, DocumentModal) {
    var self = this;

    //has no usage now, but may be usefull in the future, passed if this controller's component is part of larger form
    this.formWidget = this.formWidget === 'true';

    $scope.options = this.options;
    $scope.columns = $scope.options.list.columns;

    $scope.documents = engineQuery($scope.options.query, this.parentDocument);

    $scope.actions = engineActionsAvailable.forType($scope.options.documentJSON);

    $scope.engineAction = function (actionId, document) {
        engineAction(actionId, document).$promise.then(function (data) {
            $scope.documents = engineQuery($scope.query);
        });
    };

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
            })
        });
    }

    $scope.renderCell = function (document, column) {
        return document[column.name];
    };
    $scope.getCellTemplate = function (document, column, force_type) {
        if(!force_type && column.type == 'link'){
            return '/src/list/cell/link.tpl.html'
        }

        if(column.type) {
            if(column.type == 'date')
                return '/src/list/cell/date.tpl.html'
        }
        return '/src/list/cell/text.tpl.html'
    };
    $scope.genDocumentLink = function(document) {
        return $scope.options.documentUrl.replace(':id', document);
    };
    $scope.onCreateDocument = function() {
        if($scope.options.subdocument == true)
            DocumentModal($scope.options);
        else
            $location.path($scope.genDocumentLink('new'));

    };
    $scope.canCreateDocument = function () {
        return engineActionUtils.getCreateUpdateAction($scope.actions) != null;
    };

});