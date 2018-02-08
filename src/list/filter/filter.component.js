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
            this._ngModel = undefined;
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
            return a;
        }

        formatText(val) {
            if(!val)
                return null;
            return {$regex: val, $options: 'i'};
        }

        formatDate(val) {
            if(val == null)
                return null;
            // return only date, skip time information, engine stores dates as strings,
            // so this regexp should find all documents created on a given date
            // let date = `^${val.getFullYear()}-${val.getMonth()}-${val.getDate()}`;
            return {$regex: `^${val.toISOString().substr(0, 10)}`};
        }

        formatChoice(val) {
            if(val == null)
                return null;
            return {$eq: val};
        }

        _ngChange(val) {
            this.ngModel = val;
            this.ngChange();
        }
    }
});