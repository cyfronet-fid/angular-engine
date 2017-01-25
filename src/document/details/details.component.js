angular.module('engine.document')
    .component('engineDocumentDetails', {
        templateUrl: '/src/document/details/details.tpl.html',
        controller: function (engineResolve) {
            var self = this;
            this.engineResolve = engineResolve;

            this.saveDocument = function () {
                self.savePromise = self.actions.callSave();
            };
        },
        bindings: {
            ngModel: '=',
            options: '=',
            actions: '='
        }
    });