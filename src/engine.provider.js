angular.module('engine')
.provider('$engine', function ($routeProvider) {
    var documents = [];
    var documents_d = {};

    this.document = function (documentType, list_route, list_options, document_route, document_options, query, common_options) {
        documents.push({list_route: list_route, document_route: document_route});

        if(!list_options)
            list_options = {};

        if(!document_options)
            document_options = {};

        if(!common_options)
            common_options = {};
        common_options.document_type = documentType;
        common_options.list_route = list_route;
        common_options.document_route = document_route;

        if(!list_options.templateUrl)
            list_options.templateUrl = '/src/list/list.tpl.html';

        if(!document_options.templateUrl)
            document_options.templateUrl = '/src/document/document.wrapper.tpl.html';

        $routeProvider.when(list_route, {templateUrl: list_options.templateUrl, controller: 'engineListCtrl',
            query: query,
            options: list_options,
            common_options: common_options
        });

        $routeProvider.when(document_route, {templateUrl: document_options.templateUrl, controller: 'engineDocumentWrapperCtrl',
            query: query,
            options: document_options,
            common_options: common_options
        });

        documents_d[documentType] = {list_options: list_options, document_options: document_options, common_options: common_options,
                                     query: query, modal: false};
    };

    this.subdocument = function (documentType, list_options, document_options, common_options, query, modal) {
        documents_d[documentType] = {list_options: list_options, document_options: document_options, common_options: common_options,
                                     query: query, modal: modal || false}
    };

    var _baseUrl = '';

    this.setBaseUrl = function (url) {
        _baseUrl = url;
    };

    var _visibleDocumentFields = [{name: 'id', caption: 'ID', type: 'link'}, {name: 'name', caption: 'Name'}];

    this.setDocumentFields = function (document_fields) {
        _visibleDocumentFields = document_fields;
    };

    this.addDocumentFields = function (document_fields) {
        if(document_fields instanceof Array)
            angular.forEach(document_fields, function (field) {
                _visibleDocumentFields.push(field);
            });
        else
            _visibleDocumentFields.push(document_fields);
    };


    this.$get = function () {


        return new function() {
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;
            this.visibleDocumentFields = _visibleDocumentFields;
        };
    };

}).service('EngineInterceptor', function () {

    function processData(data) {
        if(data == null)
            return;
        if(data.document !== undefined)
            data = data.document;
        if(data.metrics !== null && data.metrics !== undefined) {
            for (var metric in data.metrics) {
                data[metric] = data.metrics[metric];
            }
        }
    }

        return {
            response: function (data, headersGetter, status) {
                data = data.data;
                if(data instanceof Array) {
                    angular.forEach(data, processData);
                }
                else
                    processData(data);

                return data;
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

}).service('MetricToFormly', function () {
    return function (data, headersGetter, status) {

    };
});