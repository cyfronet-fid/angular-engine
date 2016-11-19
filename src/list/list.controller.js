angular.module('engine.list')
.component('engineDocumentList', {
    templateUrl: '/src/list/list.tpl.html',
    controller: 'engineListCtrl',
    bindings: {
        options: '=',
        query: '='
    }
})
.controller('engineListWrapperCtrl', function ($scope, $route) {
    $scope.options = $route.current.$$route.options;
    $scope.query = $route.current.$$route.options.query;
})
.controller('engineListCtrl', function ($scope, $route, engineMetric, $engine, engineQuery, engineAction) {
    var self = this;

    $scope.options = this.options;

    $scope.documents = engineQuery($scope.options.query);

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
        return '#' + $scope.options.documentUrl.replace(':id', document);
    };

});