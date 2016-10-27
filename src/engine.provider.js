angular.module('engine')
.provider('$engine', function ($routeProvider) {

    this.document = function (list_route, document_route, query, options) {

        if(!options)
            options = {};

        if(!options.listTemplateUrl)
            options.listTemplateUrl = 'src/list/list.tpl.html';

        if(!options.documentTemplateUrl)
            options.documentTemplateUrl = 'src/document/document.tpl.html';

        $routeProvider.when(list_route, {templateUrl: options.listTemplateUrl, controller: 'engineListCtrl',
            query: query,
            options: options
        });

        $routeProvider.when(document_route, {templateUrl: options.documentTemplateUrl, controller: 'engineDocumentCtrl',
            query: query,
            options: options
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