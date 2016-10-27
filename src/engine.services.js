angular.module('engine')
.service('engineQuery', function ($engine, $resource, EngineInterceptor) {

    var query = $resource($engine.baseUrl+'/query/documents?queryId=:query', {query_id: '@query'}, {
        get: {method: 'GET', interceptor: EngineInterceptor}
    });

    return function (query) {
        return query.get({query: query});
    }
});