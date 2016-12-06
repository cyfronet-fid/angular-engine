angular.module('engine')
.service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var _query = $resource($engine.baseUrl+'/query/documents-with-extra-data?queryId=:query?documentId=:documentId',
        {query_id: '@query', documentId: '@documentId'}, {
        get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (query, parentDocumentId, callback, errorCallback) {
        $engine.apiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments);
        return _query.get({query: query, documentId: parentDocumentId}, callback, errorCallback);
    }
})
.service('engineMetric', function ($engine, $resource, EngineInterceptor) {
    var _query = $resource($engine.baseUrl+'/metrics', {}, {
        post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (documentJSON, callback, errorCallback) {
        $engine.apiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _query.post(documentJSON, callback, errorCallback);
    }
})
.service('engineActionsAvailable', function ($engine, $resource, EngineInterceptor) {
    var _action = $resource($engine.baseUrl+'/action/available?documentId=:documentId', {documentId: '@id'}, {
        post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (document, callback, errorCallback) {
        $engine.apiCheck([apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _action.post({documentId: document.id}, document, callback, errorCallback);
    }
})
.service('engineAction', function ($engine, $resource, EngineInterceptor) {
    var _action = $resource($engine.baseUrl+'/action/invoke?documentId=:documentId&actionId=:actionId', {actionId: '@actionId', documentId: '@documentId'}, {
        post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: false}
    });

    return function (actionId, document, callback, errorCallback) {
        $engine.apiCheck([apiCheck.string, apiCheck.object, apiCheck.func.optional, apiCheck.func.optional], arguments);

        return _action.post({actionId: actionId, documentId: document.id}, document, callback, errorCallback);
    }
})
.service('engineDocument', function ($engine, $resource, EngineInterceptor) {
    var _document = $resource($engine.baseUrl + '/document/getwithextradata?documentId=:documentId&attachAvailableActions=true', {documentId: '@documentId'},
        {
            get: {method: 'POST', transformResponse: EngineInterceptor.response},
        });

    return {get: function (documentId, callback, errorCallback) {
        $engine.apiCheck([apiCheck.string, apiCheck.func.optional, apiCheck.func.optional], arguments, errorCallback);

        return _document.get({documentId: documentId}, callback, errorCallback);
    }}
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
            if(angular.isString(data)) {
                if(data == "")
                    return {};
                else
                    data = angular.fromJson(data);
            }

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



