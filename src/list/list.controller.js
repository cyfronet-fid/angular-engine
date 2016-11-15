angular.module('engine.list')
.component('engine-document-list', {
    templateUrl: '/src/document/list.tpl.html',
    controller: function ($scope, $route, metrics, $engine, engineQuery, engineAction) {
        // $scope.query = $route.current.$$route.query;
        // $scope.caption = $route.current.$$route.options.caption;
        // $scope.columns = $route.current.$$route.options.columns;
        // $scope.document_type = $route.current.$$route.common_options.document_type;
        // $scope.document_route = $route.current.$$route.common_options.document_route;
        // $scope.list_route = $route.current.$$route.common_options.list_route;
    },
    bindings: {
        documentType: '@',
        query: '@'
    }
})
.controller('engineListCtrl', function ($scope, $route, metrics, $engine, engineQuery, engineAction) {
    var self = this;


    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.columns = $route.current.$$route.options.columns;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.document_route = $route.current.$$route.common_options.document_route;
    $scope.list_route = $route.current.$$route.common_options.list_route;

    $scope.documents = engineQuery($scope.query);

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

        metrics($scope.document_type).$promise.then(function (data) {
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
    $scope.genDocumentLink = function(document_route, document) {
        return '#' + $scope.document_route.replace(':id', document);
    };

});