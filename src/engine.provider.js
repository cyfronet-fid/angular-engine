angular.module('engine')
.provider('$engine', function ($routeProvider) {

    this.document = function (list_route, list_options, document_route, document_options, query, common_options) {

        if(!list_options)
            list_options = {};

        if(!document_options)
            document_options = {};

        if(!common_options)
            common_options = {};

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
        };
    };

}).provider('EngineInterceptor', function () {

    this.$get = function ($resource) {
        return {
            response: function (response) {
                return response.resource.data;
            },
            responseError: function (response) {
                return response;
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
    }

});