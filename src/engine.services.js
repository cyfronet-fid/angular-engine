angular.module('engine')
.service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var _query = $resource($engine.baseUrl+'/query/documents?queryId=:query', {query_id: '@query'}, {
        get: {method: 'GET', transformResponse: EngineInterceptor.response, isArray: true}
    });

    return function (query) {
        return _query.get({query: query});
    }
});