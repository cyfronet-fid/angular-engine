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

        /**
         *
         * @param metricList
         * @param metric
         * @param {object} ctx should contain following parameters:
         *
         * {document: model of the document, options: document options, documentForm: DocumentForm instance}
         */
        DocumentFieldFactory.prototype.makeField = function makeField(metricList, metric, ctx) {
            for(var i = this._fieldTypeList.length-1; i >= 0; --i) {
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

        DocumentFieldFactory.prototype.makeFields = function makeFields(metricList, ctx) {
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

            this.register(new DocumentField({visualClass: 'select', inputType: 'SELECT'}, function (field, metric, ctx) {
                field.type = 'select';
                field.templateOptions.options = self._engineOptionsToFormly(metric.options);

                return field;
            }));

            this.register(new DocumentField({visualClass: 'select', inputType: 'MULTISELECT'}, function (field, metric, ctx) {
                field.type = 'multiSelect';
                field.templateOptions.options = self._engineOptionsToFormly(metric.options);

                return field;
            }));

            this.register(new DocumentField({visualClass: '@imgMultiSelect', inputType: 'MULTISELECT'}, function (field, metric, ctx) {
                field.type = 'multiSelectImage';
                field.templateOptions.options = self._engineOptionsToFormly(metric.options);

                return field;
            }));

            this.register(new DocumentField('radioGroup', function (field, metric, ctx) {
                field.type = 'radioGroup';
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
                data: field.data,
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' +
                'options="options.templateOptions.options" metric="options.data.metric" errors="fc.$error" '+
                'class="' + metric.visualClass.join(' ') + '" ' +
                'ng-disabled="options.data.form.disabled" '+
                'formly-options="options" '+
                'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: {ngModel: ctx.document, options: ctx.options}
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({inputType: 'QUERIED_LIST'}, function (field, metric, ctx) {
            field = {
                data: field.data,
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" '+
                'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                ' list-caption="\''+metric.label+'\'"'+
                ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '" on-select-behavior="'+metric.onSelectBehavior+'"></engine-document-list>',
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

        //make it class method, to not instantiate it for every field
        DocumentField.onChange = function($viewValue, $modelValue, $scope) {
            //emit reload request for dom element which wants to listen (eg. document)
            $scope.$emit('document.form.requestReload');

            $scope.options.data.form._onReload();
        };

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
                    'metric': metric,
                    position: metric.position,
                    isMetric: true,
                    form: ctx.documentForm,
                    categoryId: metric.categoryId,
                    id: metric.id //this is required for DocumentForm
                },
                templateOptions: {
                    type: 'text',
                    label: metric.label,
                    metricId: metric.id,
                    description: metric.description,
                    placeholder: 'Enter ' + metric.label,
                    required: metric.required,
                    visualClass: metric.visualClass
                },
                ngModelAttrs: {
                    metricId: {
                        attribute: 'metric-id'
                    }
                },
                expressionProperties: {
                    'templateOptions.disabled': function ($viewValue, $modelValue, scope) {
                        return scope.options.data.form.disabled;
                    }
                },
                validation: {
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

            if (metric.reloadOnChange == true) {
                formlyField.templateOptions.onChange = DocumentField.onChange;
            }


            var ret = this.fieldCustomizer(formlyField, metric, ctx);

            //if metric uses non standard JSON data type (eg. DATE, call it's prepare method, to preprocess data before loading)
            if(_.isFunction(ret.data.prepareValue)) {
                ctx.document.metrics[metric.id] = ret.data.prepareValue(ctx.document.metrics[metric.id]);
            }

            return ret;
        };

        return DocumentField;
    });