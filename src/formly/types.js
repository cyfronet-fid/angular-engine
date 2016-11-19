angular.module('engine.formly')
    .run(function (formlyConfig, $engineFormly) {

        formlyConfig.setType({
            name: 'input',
            templateUrl: $engineFormly.templateUrls['input'],
            wrapper: ['engineLabel', 'engineHasError']
        });

        formlyConfig.setType({
                name: 'radio',
                templateUrl: '/src/formly/radio.html',
                wrapper: ['engineLabel', 'engineHasError'],
                defaultOptions: {
                    noFormControl: false
                }
                // apiCheck: check => ({
                // templateOptions: {
                //     options: check.arrayOf(check.object),
                //     labelProp: check.string.optional,
                //     valueProp: check.string.optional
                // }
            // })
        });

        formlyConfig.setType({
                name: 'select',
                templateUrl: $engineFormly.templateUrls['select'],
                wrapper: ['engineLabel', 'engineHasError'],
                // defaultOptions(options) {
                    /* jshint maxlen:195 */
                    // let ngOptions = options.templateOptions.ngOptions || 'option[to.valueProp || 'value'] as option[to.labelProp || 'name'] group by option[to.groupProp || 'group'] for option in to.options;
                    // return {
                    //     ngModelAttrs: {
                    //         [ngOptions]: {
                    //             value: options.templateOptions.optionsAttr || 'ng-options'
                    //         }
                    //     }
                    // };
                // },
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
                defaultOptions: {
                    ngModelAttrs: {
                        rows: {attribute: 'rows'},
                        cols: {attribute: 'cols'}
                    }
                },
                // apiCheck: check => ({
                // templateOptions: {
                //     rows: check.number.optional,
                //     cols: check.number.optional
                // }
            // })
        });
    });

