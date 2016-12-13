angular.module('engine.formly')
    .run(function (formlyConfig, $engineFormly, $engine) {
        var _apiCheck = $engine.apiCheck;

        formlyConfig.setType({
            name: 'input',
            templateUrl: $engineFormly.templateUrls['input'],
            wrapper: ['engineLabel', 'engineHasError']
        });

        formlyConfig.setType({
            name: 'checkbox',
            templateUrl: $engineFormly.templateUrls['checkbox'],
            wrapper: ['engineHasError']
        });

        formlyConfig.setType({
                name: 'radio',
                templateUrl: '/src/formly/radio.html',
                wrapper: ['engineLabel', 'engineHasError'],
                defaultOptions: {
                    noFormControl: false
                },
                // apiCheck: _apiCheck({
                // templateOptions: {
                //     options: _apiCheck.arrayOf(_apiCheck.object),
                //     labelProp: _apiCheck.string.optional,
                //     valueProp: _apiCheck.string.optional
                // }
            // })
        });

        formlyConfig.setType({
                name: 'select',
                templateUrl: $engineFormly.templateUrls['select'],
                wrapper: ['engineLabel', 'engineHasError'],
                defaultOptions: function(options) {
                    var ngOptions = options.templateOptions.ngOptions || "option[to.valueProp || 'value'] as option[to.labelProp || 'name'] group by option[to.groupProp || 'group'] for option in to.options";
                    var _options = {
                        ngModelAttrs: {
                        }
                    };

                    _options.ngModelAttrs[ngOptions] = {value: options.templateOptions.optionsAttr || 'ng-options'};

                    return _options;
                },
                // apiCheck: check => ({
                // templateOptions: {
                //     options: check.arrayOf(check.object),
                //     optionsAttr: check.string.optional,
                //     labelProp: check.string.optional,
                //     valueProp: check.string.optional,
                //     groupProp: check.string.optional
                // }
            // })
        });

        formlyConfig.setType({
                name: 'textarea',
                templateUrl: $engineFormly.templateUrls['textarea'],
                wrapper: ['engineLabel', 'engineHasError'],
                defaultOptions: function(options) {

                    var _options = {
                        ngModelAttrs: {
                            rows: {attribute: 'rows'},
                            cols: {attribute: 'cols'}
                        }
                    };

                    return _options;
                }
                // apiCheck: check => ({
                // templateOptions: {
                //     rows: check.number.optional,
                //     cols: check.number.optional
                // }
            // })
        });
    });

