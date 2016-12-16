angular.module('engine.common')
    .factory('DocumentEventCtx', function () {
        return function (document, action, options) {
            this.document = document;
            this.action = document;
            this.options = options;
        };
    })
    .factory('ErrorEventCtx', function () {
        return function (errorId, errorMessage) {
            this.errorId = errorId;
            this.errorMessage = errorMessage;
        }
    })
    .factory('engineActionUtils', function ($rootScope, ErrorEventCtx, ENGINE_SAVE_ACTIONS) {
        var ENGINE_LINK_ACTION = 'LINK';
        var isSaveAction = function (action) {
            if (_.contains(ENGINE_SAVE_ACTIONS, action.type))
                return true;
            return false;
        };

        var isLinkAction = function (action) {
            return action.type == ENGINE_LINK_ACTION;
        };


        var getLinkAction = function (actions) {
            return _.find(actions, isLinkAction);
        };

        var getCreateUpdateAction = function (actions) {
            for (var i = 0; i < actions.length; ++i) {
                var action = actions[i];
                if (isSaveAction(action)) {
                    return action;
                }
            }
            $rootScope.$broadcast('engine.common.error', new ErrorEventCtx('noCreateUpdateAction',
                'Document has no available create / update action, angular-engine framework requires that at least one update and one create action is specified'));
            return null;
        };


        return {
            getCreateUpdateAction: getCreateUpdateAction,
            isSaveAction: isSaveAction,
            getLinkAction: getLinkAction,
            isLinkAction: isLinkAction
        }
    });
