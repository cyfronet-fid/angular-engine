/**
 * Here are placed components which should be exposed to the library user
 */

var app = angular.module('engine');

app.factory('engActionButton', function ($timeout, DocumentActionList, $rootScope) {
    class ActionButton {
        constructor(actionId, requestJson, label=null) {
            this.actionId = actionId;
            this.requestJson = requestJson;
            this.callback = null;
            this.label = label;
            this._$scope = $rootScope.$new(true);
            this._actionList = null;

            this.refresh();
        }

        refresh() {
            this.callback = null;
            this._actionList = new DocumentActionList(null, this.requestJson, null, this._$scope);

            this._actionList.$ready.then(() => {
                let action = _.find(this._actionList.actions, (action) => {
                    return action.actionId === this.actionId;
                });

                if(action) {
                    this.callback = () => action.call();
                    this.label = this.label || action.label;
                }
            });
        }
    }

    return ActionButton
});