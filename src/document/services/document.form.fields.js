angular.module('engine.document')
.factory('DocumentFieldFactory', function (DocumentField, $engine, $log) {
    function DocumentFieldFactory() {
        this._fieldTypeList = [];
        this._defaultField = new DocumentField();

        this._registerBasicCategories();
    }

    /**
     * Helper function converting engineOptions to formly option which allows
     * angular-formly to generate select box / radio button group / etc
     *
     * @param engineOptions
     * @returns {Array}
     * @private
     */
    DocumentFieldFactory.prototype._engineOptionsToFormly = function _engineOptionsToFormly(engineOptions) {
        var r = [];
        _.forEach(engineOptions, function (option) {
            r.push({name: option.value, value: option.value})
        });
        return r;
    };

    DocumentFieldFactory.prototype.register = function register(documentField) {
        this._fieldTypeList.push(documentField);
    };

    DocumentFieldFactory.prototype.makeField = function makeField(metricList, metric, ctx) {
        for(var i = 0; i < this._fieldTypeList.length; ++i) {
            if(this._fieldTypeList[i].matches(metric))
                return this._fieldTypeList[i].makeField(metricList, metric, ctx);
        }
        if(!this.allowDefaultField){
            var message = "DocumentFieldFactory.allowDefaultField is false but there was a metric which could not be matched to registered types: ";
            $log.error(message, "Metric", metric, "Registered types", this._fieldTypeList);
            throw new Error(message);
        }
        return this._defaultField.makeField(metricList, metric, ctx);
    };

    /**
     *
     * @param metricList
     * @returns {Array}
     */
    DocumentFieldFactory.prototype.makeFields = function make(metricList, ctx) {
        var fields = [];

        _.forEach(metricList, function (metric) {
            fields.push(this.makeField(metricList, metric, ctx))
        }, this);

        return fields;
    };

    DocumentFieldFactory.prototype._registerBasicCategories = function _registerBasicFields(metric) {
        var self = this;

        this.register(new DocumentField({inputType: 'TEXT'}, function (field, metric, ctx) {
            return field;
        }));

        this.register(new DocumentField('select', function (field, metric, ctx) {
            field.type = 'select';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField('radioGroup', function (field, metric, ctx) {
            field.type = 'radio';
            field.templateOptions.options = self._engineOptionsToFormly(metric.options);

            return field;
        }));

        this.register(new DocumentField({visualClass: 'date', inputType: 'DATE'}, function (field, metric, ctx) {
            field.type = 'datepicker';
            field.data.prepareValue = function (originalValue) {
                return new Date(originalValue);
            };
            return field;
        }));

        this.register(new DocumentField('checkbox', function (field, metric, ctx) {
            field.type = 'checkbox';

            return field;
        }));

        this.register(new DocumentField({inputType: 'NUMBER'}, function (field, metric, ctx) {
            field.type = 'input';

            return field;
        }));

        this.register(new DocumentField({inputType: 'TEXTAREA'}, function (field, metric, ctx) {
            field.type = "textarea";
            field.templateOptions.rows = 4;
            field.templateOptions.cols = 15;

            return field;
        }));

        this.register(new DocumentField({inputType: 'EXTERNAL'}, function (field, metric, ctx) {
            return {
                data: {
                    categoryId: metric.categoryId,
                    id: metric.id //this is required for DocumentForm
                },
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' +
                'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: {ngModel: ctx.document, options: ctx.options}
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({inputType: 'QUERIED_LIST'}, function (field, metric, ctx) {
            field = {
                data: {
                    categoryId: metric.categoryId,
                    id: metric.id //this is required for DocumentForm
                },
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '"></engine-document-list>',
                templateOptions: {
                    options: $engine.getOptions(metric.modelId),
                    document: ctx.document
                }//, expressionProperties: {'templateOptions.disabled': 'false'}
            };

            return field;
        }));
    };

    return new DocumentFieldFactory();
})
.factory('DocumentField', function (ConditionBuilder) {
    function DocumentField(fieldCondition, fieldBuilder) {
        if(fieldBuilder == null)
            fieldBuilder = function (formlyField, metric, ctx) {return formlyField;};
        if(fieldCondition == null)
            fieldCondition = function () {return true;};

        this.fieldCondition = ConditionBuilder(fieldCondition);
        this.fieldCustomizer = fieldBuilder;
    }
    DocumentField.prototype.matches = function matches(metric) {
        return this.fieldCondition(metric);
    };

    DocumentField.prototype.makeField = function makeField(metricList, metric, ctx) {
        var formlyField = {
            key: metric.id,
            model: ctx.document.metrics,
            type: 'input',
            className: metric.visualClass.join(' '),
            data: {
                form: ctx.documentForm,
                categoryId: metric.categoryId,
                id: metric.id //this is required for DocumentForm
            },
            templateOptions: {
                type: 'text',
                label: metric.label,
                description: metric.description,
                placeholder: 'Enter ' + metric.label,
                required: metric.required
            },
            expressionProperties: {
                'templateOptions.disabled': function ($viewValue, $modelValue, scope) {
                    return scope.options.data.form.disabled;
                }
            },
            // validators: {
            // },
            validation: {
                // show: true,
                messages: {
                    required: function (viewValue, modelValue, scope) {
                        if(scope.to.serverErrors == null || _.isEmpty(scope.to.serverErrors))
                            return scope.to.label+"_required";
                        return '';
                    },
                    server: function (viewValue, modelValue, scope) {
                        return scope.to.serverErrors[0];
                    },
                    date: 'to.label+"_date"'
                }
            }
        };

        if (metric.reloadOnChange) {
            //:TODO: make reload listener
        }


        var ret = this.fieldCustomizer(formlyField, metric, ctx);

        if(_.isFunction(ret.data.prepareValue)) {
            ctx.document.metrics[metric.id] = ret.data.prepareValue(ctx.document.metrics[metric.id]);
        }

        return ret;
    };

    return DocumentField;
});