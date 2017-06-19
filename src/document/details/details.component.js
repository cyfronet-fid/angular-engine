angular.module('engine.document')
    .component('engineDocumentDetails', {
        templateUrl: '/src/document/details/details.tpl.html',
        controller: function ($parse) {
            var self = this;
            this.$parse = $parse;

            this.saveDocument = function () {
                self.savePromise = self.actions.callSave();
                return self.savePromise;
            };
        },
        bindings: {
            ngModel: '=',
            options: '=',
            actions: '=',
            dirty: '='
        }
    })
.filter('conditionFulfiled', function ($parse) {
   return function (items, document) {
       var filtered = [];

       angular.forEach(items, function (item) {
           if(item.condition == null || $parse(item.condition)(document) === true)
               filtered.push(item);
       });
       return filtered;
   }
});