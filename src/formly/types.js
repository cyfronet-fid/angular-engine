angular.module('engine')
    .config(function (formlyConfigProvider) {

        formlyConfigProvider.setType({
            name: 'input',
            template: '<input class="form-control" ng-model="model[options.key]">',
            wrapper: ['engineLabel', 'engineHasError']
        });

        formlyConfigProvider.setType({
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

        formlyConfigProvider.setType({
                name: 'select',
                template: '<select class="form-control" ng-model="model[options.key]"></select>',
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

        formlyConfigProvider.setType({
                name: 'textarea',
                template: '<textarea class="form-control" ng-model="model[options.key]"></textarea>',
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

