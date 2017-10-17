angular.module('engine.document')
    .component('engineDocumentDetails', {
        templateUrl: '/src/document/details/details.tpl.html',
        controller: function ($parse, $filter) {
            const self = this;
            this.$parse = $parse;

            this.formatEntry = (entry) => {
                let r = this.$parse(entry.name)(this.ngModel);

                if(!_.isUndefined(r) && _.isDate(r) && entry.type === 'date')
                    r = $filter('date')(r);
                return r;
            };

            this.saveDocument = function () {
                self.savePromise = self.actions.callSave();
                return self.savePromise;
            };
        },
        bindings: {
            ngModel: '<',
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