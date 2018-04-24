angular.module('engine.formly').run(function (formlyConfig, $engineFormly, $engine, $engLog) {
    var attributes = [
        'date-disabled',
        'custom-class',
        'show-weeks',
        'starting-day',
        'init-date',
        'min-mode',
        'max-mode',
        'format-day',
        'format-month',
        'format-year',
        'format-day-header',
        'format-day-title',
        'format-month-title',
        'year-range',
        'shortcut-propagation',
        'datepicker-popup',
        'show-button-bar',
        'current-text',
        'clear-text',
        'close-text',
        'close-on-date-selection',
        'datepicker-append-to-body'
    ];

    var bindings = [
        'datepicker-mode',
        'min-date',
        'max-date'
    ];

    var ngModelAttrs = {};

    angular.forEach(attributes, function (attr) {
        ngModelAttrs[camelize(attr)] = {attribute: attr};
    });

    angular.forEach(bindings, function (binding) {
        ngModelAttrs[camelize(binding)] = {bound: binding};
    });

    $engLog.log(ngModelAttrs);

    formlyConfig.setType({
        name: 'datepicker',
        templateUrl: $engineFormly.templateUrls['datepicker'],
        wrapper: ['engineLabel', 'engineHasError'],
        defaultOptions: {
            ngModelAttrs: ngModelAttrs,
            templateOptions: {
                datepickerOptions: {
                    format: 'dd-MM-yyyy',
                    initDate: new Date(),
                    allowInvalid: true
                },
                css: ''
            }
        },
        controller: function ($scope) {
            $scope.openedDatePopUp = false;
            $scope.today = function () {
                $scope.model[$scope.options.key] = new Date();
            };
            $scope.openPopUp = function ($event) {
                // $event.preventDefault();
                // $event.stopPropagation();
                $scope.openedDatePopUp = true;
            };
        }
    });

    function camelize(string) {
        string = string.replace(/[\-_\s]+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
        // Ensure 1st char is always lowercase
        return string.replace(/^([A-Z])/, function (match, chr) {
            return chr ? chr.toLowerCase() : '';
        });
    }
});