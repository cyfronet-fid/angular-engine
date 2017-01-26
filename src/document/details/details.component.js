angular.module('engine.document')
    .component('engineDocumentDetails', {
        templateUrl: '/src/document/details/details.tpl.html',
        controller: function ($parse) {
            var self = this;
            this.$parse = $parse;

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