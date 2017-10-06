angular.module('engine.common')
    .factory('engActionResource', function ($engineConfig, $engineApiCheck, $resource, EngineInterceptor) {
        var _action = $resource($engineConfig.baseUrl + '/action/invoke?documentId=:documentId&actionId=:actionId',
                                {actionId: '@actionId', documentId: '@documentId' }, {
                                    invoke: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: false}
        });

        var _actionAvailable = $resource($engineConfig.baseUrl + '/action/available?documentId=:documentId',
                                         {documentId: '@id'}, {
                                            post: {method: 'POST', transformResponse: EngineInterceptor.response, isArray: true}
        });

        return {
            getAvailable: function (document, documentId, otherDocumentId) {
                $engineApiCheck([$engineApiCheck.object, $engineApiCheck.string], arguments);
                return _actionAvailable.post({documentId: documentId, otherDocumentId: otherDocumentId}, document === null ? null : _.omit(document, '$ext'));
            },
            invoke: function (actionId, document, contextDocumentId, otherDocumentId) {
                $engineApiCheck([$engineApiCheck.string, $engineApiCheck.object], arguments);
                return _action.invoke({actionId: actionId, documentId: contextDocumentId || document.id, otherDocumentId: otherDocumentId}, document === null ? null : _.omit(document, '$ext'));
            }
        };
    });