angular.module('engine')
.provider('$engine', function ($routeProvider, $engineFormlyProvider) {
    var self = this;

    var documents = [];
    var documents_d = {};

    this.apiCheck = apiCheck({

    });

    var _apiCheck = this.apiCheck;

    _apiCheck.documentOptions = _apiCheck.shape({
        documentJSON: _apiCheck.object,
        name: _apiCheck.string,
        list: _apiCheck.shape({
            caption: _apiCheck.string,
            templateUrl: _apiCheck.string
        }),
        document: _apiCheck.shape({
            templateUrl: _apiCheck.string,
            steps: _apiCheck.arrayOf(_apiCheck.shape({name: _apiCheck.string, categories: _apiCheck.arrayOf(_apiCheck.string)}))
        })
    });

    this.document = function (documentModelType, listUrl, documentUrl, query, options) {
        var _options = {
            list: {
                templateUrl: '/src/list/list.wrapper.tpl.html'
            },
            document: {
                templateUrl: '/src/document/document.wrapper.tpl.html',
                steps: []
            }
        };

        options = angular.merge(_options, options);

        _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.string, _apiCheck.documentOptions], [documentModelType, listUrl, documentUrl, query, options]);

        options.documentModelType = documentModelType;
        options.listUrl = listUrl;
        options.documentUrl = documentUrl;
        options.query = query;
        options.subdocument = false;

        documents.push({list_route: listUrl, document_route: documentUrl});

        $routeProvider.when(listUrl, {templateUrl: options.list.templateUrl, controller: 'engineListWrapperCtrl',
            options: options
        });

        $routeProvider.when(documentUrl, {templateUrl: options.document.templateUrl, controller: 'engineDocumentWrapperCtrl',
            options: options
        });

        documents_d[documentModelType] = {options: options, modal: false};
    };

    this.subdocument = function (documentModelType, query, options) {
        _apiCheck([_apiCheck.string, _apiCheck.string, _apiCheck.documentOptions], [documentModelType, query, options]);

        options.query = query;
        options.subdocument = true;

        documents_d[documentModelType] = options;
    };

    this.formly = $engineFormlyProvider;

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


    this.$get = function ($engineFormly) {


        return new function() {
            this.apiCheck = _apiCheck;
            this.formly = $engineFormly;
            this.baseUrl = _baseUrl;
            this.documents = documents;
            this.documents_d = documents_d;
            this.visibleDocumentFields = _visibleDocumentFields;
        };
    };

})