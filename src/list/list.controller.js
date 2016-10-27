angular.module('engine.list')
.controller('engineListCtrl', function ($scope, $route, $engine, engineQuery) {
    var self = this;


    $scope.query = $route.current.$$route.query;
    $scope.caption = $route.current.$$route.options.caption;
    $scope.columns = $route.current.$$route.options.columns;
    $scope.document_type = $route.current.$$route.common_options.document_type;
    $scope.document_route = $route.current.$$route.common_options.document_route;
    $scope.list_route = $route.current.$$route.common_options.list_route;

    $scope.documents = engineQuery($scope.query);

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