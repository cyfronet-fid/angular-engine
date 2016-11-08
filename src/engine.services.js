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


