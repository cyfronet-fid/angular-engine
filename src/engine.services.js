angular.module('engine')
.service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var _query = $resource($engine.baseUrl+'/query/documents-with-extra-data?queryId=:query', {query_id: '@query'}, {
        get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (query) {
        return _query.get({query: query});
    }
})
.service('metrics', function ($engine, $resource, EngineInterceptor) {
    var _query = $resource($engine.baseUrl+'/metrics', {}, {
        post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (documentType) {
        return _query.post({states: {documentType: documentType},metrics: null}, function (data) {
            console.log(data);
        });
    }
})
.service('engineAction', function ($engine, $resource, EngineInterceptor) {
    var _action = $resource($engine.baseUrl+'/action/invoke?documentId=:documentId&actionId=:actionId', {actionId: '@actionId', documentId: '@documentId'}, {
        post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: false}
    });
    
    return function (actionId, document) {
        return _action.post({actionId: actionId, documentId: document.id, statesAndmetrics: {metrics: document.metrics}});
    }
})
.service('engineDocument', function ($engine, $resource, EngineInterceptor) {
    var _document = $resource($engine.baseUrl + '/document/getwithextradata?documentId=:documentId', {documentId: '@documentId'},
        {
            get: {method: 'GET', transformResponse: EngineInterceptor.response}
        });

    return {get: function (documentId) {
        return _document.get({documentId: documentId});
    }}
})
;


