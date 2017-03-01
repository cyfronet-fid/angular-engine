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
                r.push({name: option.value, value: option.value, extraField: true});
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

            this.register(new DocumentField({visualClass: '@verticalMultiSelect', inputType: 'MULTISELECT'}, function (field, metric, ctx) {
                field.type = 'multiSelectVertical';
                field.templateOptions.options = self._engineOptionsToFormly(metric.options);

                return field;
            }));

            this.register(new DocumentField({visualClass: '@imgMultiSelect', inputType: 'MULTISELECT'}, function (field, metric, ctx) {
                field.type = 'multiSelectImage';
                // field.templateOptions.options = self._engineOptionsToFormly(metric.options);
                var cols = metric.cols || 2;
                field.templateOptions.cols = [];
                field.templateOptions.colClass = 'col-md-'+(12 / cols);
                field.templateOptions.optionsPerCol = Math.ceil(metric.options.length / cols);

                for(var i=0; i<cols; ++i) {
                    var col = [];
                    field.templateOptions.cols.push(col);
                    for(var j=0; j<field.templateOptions.optionsPerCol && i*field.templateOptions.optionsPerCol + j < metric.options.length; ++j) {
                        var cm = metric.options[i*field.templateOptions.optionsPerCol + j];
                        col.push({value: cm.value, css: cm.visualClass != null ? cm.visualClass.join(' ') : '', label: cm.value});
                    }
                }
                if(field.model[field.key] == null)
                    field.model[field.key] = [];

                field.controller = function($scope) {
                    $scope.addRemoveModel = function(element) {
                        if(_.contains(field.model[field.key], element))
                            field.model[field.key].splice(field.model[field.key].indexOf(element), 1);
                        else
                            field.model[field.key].push(element);
                        $scope.options.templateOptions.onChange(field.model, field, $scope);
                    };
                };

                field.data.isActive = function(element) {
                    return _.contains(field.model[field.key], element)
                };

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
                    if(originalValue == null)
                        return originalValue;
                    return new Date(originalValue);
                };
                // field.data.onChangeHandlers = [];
                field.templateOptions.onBlur = undefined;
                return field;
            }));

            this.register(new DocumentField('checkbox', function (field, metric, ctx) {
                field.type = 'checkbox';

                return field;
            }));

            this.register(new DocumentField({inputType: 'NUMBER'}, function (field, metric, ctx) {
                field.type = 'input';
                field.templateOptions.type = 'text';
                field.templateOptions.numberConvert = 'true';
                // field.ngModelAttrs = {
                //     numberConvert: {attribute: 'number-convert'}
                // };

                field.data.prepareValue = function(value) {
                    var parsedValue = parseInt(value);

                    return _.isNaN(parsedValue) ? value : parsedValue;
                };
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
                key: metric.id, //THIS FIELD IS REQUIRED
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
                key: metric.id, //THIS FIELD IS REQUIRED
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" '+
                'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                ' list-caption="\''+metric.label+'\'"'+
                ' metric-id="'+metric.id+'"'+
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
            _.forEach($scope.options.data.onChangeHandlers, function (callback) {
                callback($viewValue, $modelValue, $scope);
            })
        };
        DocumentField.validate = function ($viewValue, $modelValue, $scope) {

        };
        DocumentField.onReload = function($viewValue, $modelValue, $scope) {
            //emit reload request for dom element which wants to listen (eg. document)
            $scope.$emit('document.form.requestReload');
            $scope.options.data.form._onReload();
        };
        DocumentField.onValidateSelf = function($viewValue, $modelValue, $scope) {
            var metricToValidate = {};
            metricToValidate[$scope.options.data.metric.id] = $viewValue == null ? null : $viewValue;
            $scope.options.data.form.validator.validateMetrics($modelValue, metricToValidate);
        };
        DocumentField.onValidate = function($viewValue, $modelValue, $scope) {
            //emit validate request for dom element which wants to listen (eg. document)
            $scope.$emit('document.form.requestValidate');

            $scope.options.data.form.validateCurrentStep(false);
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
                    unit: metric.unit,
                    id: metric.id, //this is required for DocumentForm
                    onChangeHandlers: []
                },
                templateOptions: {
                    type: 'text',
                    label: metric.label,
                    metricId: metric.id,
                    description: metric.description,
                    placeholder: 'Enter missing value',
                    // required: metric.required, now it's handled by server side validation
                    visualClass: metric.visualClass,
                    onChange: DocumentField.onChange
                },
                ngModelAttrs: {
                    metricId: {
                        attribute: 'metric-id'
                    }
                },
                expressionProperties: {
                    'templateOptions.disabled': function ($viewValue, $modelValue, scope) {
                        return scope.options.data.form.disabled; //|| !(scope.options.data.metric.editable == true); //enable it when it's supported by the backend
                    }
                },
                validation: {
                    messages: {
                        server: function (viewValue, modelValue, scope) {
                            return _.isArray(scope.to.serverErrors) && scope.to.serverErrors.length > 0 ? scope.to.serverErrors[0] : '';
                        }
                        //date: 'to.label+"_date"'
                    }
                }
            };

            if(metric.unit != null)
                formlyField.wrapper = 'unit';

            if (metric.reloadOnChange == true) {
                formlyField.data.onChangeHandlers.push(DocumentField.onReload);
            }

            //if validateOnChange is true all other metrics should be validated after this one changes
            if (metric.validateOnChange == true) {
                formlyField.data.onChangeHandlers.push(DocumentField.onValidate);
                formlyField.templateOptions.onBlur = DocumentField.onValidate;
            }
            //otherwise only this metrics
            else {
                formlyField.data.onChangeHandlers.push(DocumentField.onValidateSelf);
                formlyField.templateOptions.onBlur = DocumentField.onValidateSelf;
            }

            var ret = this.fieldCustomizer(formlyField, metric, ctx);

            //if metric uses non standard JSON data type (eg. DATE, call it's prepare method, to preprocess data before loading)
            if(_.isFunction(ret.data.prepareValue)) {
                ctx.document.metrics[metric.id] = ret.data.prepareValue(ctx.document.metrics[metric.id]);
            }

            return ret;
        };

        return DocumentField;
    }).directive('numberConvert', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                model: '=ngModel'
            },
            link: function (scope, element, attrs, ngModelCtrl) {
                if (scope.model && typeof scope.model == 'string') {
                    if(!scope.model.match(/^\d+$/))
                        scope.model = val;
                    else {
                        var pv = parseInt(scope.model, 10);
                        if(!_.isNaN(pv))
                            scope.model = pv;
                    }
                }
                scope.$watch('model', function(val, old) {
                    if (typeof val == 'string') {
                        if(!val.match(/^\d+$/))
                            scope.model = val;
                        else {
                            var pv = parseInt(val, 10);
                            if(!_.isNaN(pv))
                                scope.model = pv;
                            else
                                scope.model = val;
                        }
                    }
                });
            }
        };
    });