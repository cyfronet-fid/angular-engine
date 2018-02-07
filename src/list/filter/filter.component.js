var app = angular.module('engine.list');

app.component('filterInput', {
    bindings: {
        options: '<',
        column: '<',
        ngModel: '=',
        ngChange: '&',
    },
    templateUrl: '/src/list/filter/filter.component.tpl.html',
    controller: class FilterInputControl {
        constructor() {
            this.openedDatePopUp = false;
            this._choices = [];
        }
        $onInit() {
        }
        $onChanges(changes) {
            if(changes.options && changes.options.currentValue.choices) {
                this._choices = this.addNoOption(changes.options.currentValue.choices);
            }
        }

        addNoOption(array) {
            if(array === undefined)
                return;
            let a = Array.from(array);
            a.splice(0, 0, {id: undefined, caption: ''});
            console.log(a);
            return a;
        }
    }
});