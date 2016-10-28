angular.module('engine')
.provider('$engine', function ($routeProvider) {
    var documents = [];

    this.document = function (list_route, list_options, document_route, document_options, query, common_options) {
        documents.push({list_route: list_route, document_route: document_route});

        if(!list_options)
            list_options = {};

        if(!document_options)
            document_options = {};

        if(!common_options)
            common_options = {};

        common_options.list_route = list_route;
        common_options.document_route = document_route;

        if(!list_options.templateUrl)
            list_options.templateUrl = '/src/list/list.tpl.html';

        if(!document_options.templateUrl)
            document_options.templateUrl = '/src/document/document.tpl.html';

        $routeProvider.when(list_route, {templateUrl: list_options.templateUrl, controller: 'engineListCtrl',
            query: query,
            options: list_options,
            common_options: common_options
        });

        $routeProvider.when(document_route, {templateUrl: document_options.templateUrl, controller: 'engineDocumentCtrl',
            query: query,
            options: document_options,
            common_options: common_options
        });
    };

    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    this.$get = function () {


        return new function() {
            this.baseUrl = _baseUrl;
            this.documents = documents;
        };
    };

}).service('EngineInterceptor', function () {

        return {
            response: function (data, headersGetter, status) {
                return data.data;
            },
            request: function (data, headersGetter) {
                var site = data.site;
                console.log('parsing request');
                if(site && site.id) {
                    data.site = site.id;
                    data.siteName = site.value.provider_id;
                }

                return angular.toJson(data)
            }
    }

});