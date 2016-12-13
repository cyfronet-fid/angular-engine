angular.module('engine.document')
.factory('StepList', function (Step, $q, engineMetricCategories, $engineApiCheck) {
    var _ac = $engineApiCheck;

    function StepList(documentOptionSteps) {
        var self = this;

        this.documentSteps = documentOptionSteps;
        this.steps = [];
        this.singleStep = false;
        this.$ready = null;
        this.currentStep = null;

        this._preprocessDocumentSteps();

    }

    StepList.prototype._preprocessDocumentSteps = function _preprocessDocumentSteps() {
        var self = this;

        this.$ready = engineMetricCategories.then(function (metricCategories) {
            assert(_.isArray(self.documentSteps) && !_.isEmpty(self.documentSteps), 'documentSteps were not defined');

            _.forEach(self.documentSteps, function (step, index) {
                if(_.isArray(step.categories))
                    self.steps.push(new Step(step.categories));
                else { //is string (metricCategory) so we have to retrieve its children
                    self.steps.push(new Step(metricCategories.metrics[step.categories].children));
                }
            });
        });
    };

    StepList.prototype.isLast = function isLast(step) {
        return step == this.steps.length-1;
    };

    StepList.prototype.validate = function validate() {

    };

    StepList.prototype.getFirstInvalid = function getFirstInvalid() {

    };

    StepList.prototype.getSteps = function getSteps() {
        return this.steps;
    };

    StepList.prototype.setCurrentStep = function setCurrentStep(stepIndex) {
        this.currentStep = this.steps[stepIndex];
    };

    StepList.prototype.getCurrentStep = function getCurrentStep() {
        return this.currentStep;
    };

    return StepList;
})
.factory('Step', function () {

    function Step(metricCategories, visible) {
        this.defaultState = 'blank';

        this.metricCategories = metricCategories;
        this.fields = [];
        this.visible = (visible != null);
        this.state = this.defaultState;
        this.$valid = false;
    }

    Step.prototype.validate = function validate() {

    };


    return Step;
})
.factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, $engineApiCheck) {
    var _apiCheck = $engineApiCheck;

    function DocumentForm() {
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.documentOptions = null;
        this.steps = null;
        this.disabled = true;
        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';

        this.$ready = this.loadMetricCategories();

    }

    DocumentForm.prototype.loadMetricCategories = function loadMetricCategories() {
        var self = this;

        return engineMetricCategories.then(function (metricCategories) {
            self.metricCategories = metricCategories;
        });
    };
    DocumentForm.prototype.setDocument = function setDocument(document) {
        this.document = document;
    };
    DocumentForm.prototype.setOptions = function setOptions(documentOptions) {
        this.documentOptions = documentOptions;
    };
    DocumentForm.prototype.setSteps = function setSteps(steps) {
        this.steps = steps;
    };
    DocumentForm.prototype.init = function init(document, options, steps) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object)], arguments);

        this.setDocument(document);
        this.setOptions(options);
        this.setSteps(steps);
    };

    DocumentForm.prototype.setEditable = function setEditable(editable) {
        this.disabled = !editable;
    };

    DocumentForm.prototype.assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document'+message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions'+message);
        assert(this.steps != null, 'DocumentForm.steps'+message);
    };

    DocumentForm.prototype.makeForm = function makeForm() {
        var self = this;

        console.log('DocumentForm.makeForm', this.fieldList);
        this.assertInit();

        assert(this.metricList.$resolved == true, 'Called DocumentForm.makeForm() before calling DocumentForm.loadMetrics');
        assert(this.metricCategories.$resolved == true, 'Called DocumentForm.makeForm() before calling DocumentForm.loadMetricCategories');

        var _formStructure = parseMetricCategories(self.metricCategories.metrics);
        console.debug('DocumentForm form structure', _formStructure);

        return _formStructure;

        function parseMetricCategories(metricCategories) {
            var formCategories = [];

            _.forEach(metricCategories, function (metricCategory) {
                formCategories.push(
                    {
                        templateOptions: {
                            wrapperClass: self.categoryWrapperCSS,
                            label: metricCategory.label
                        }, fieldGroup: parseMetricCategories(metricCategory.children), wrapper: self.categoryWrapper
                    });
            });

            return formCategories;
        }
    };

    DocumentForm.prototype.updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, {document: this.document, options: this.documentOptions});
    };

    DocumentForm.prototype.loadMetrics = function loadMetrics() {
        var self = this;

        return engineMetric(this.document, function (metricList) {
            self.metricList = metricList;

            angular.forEach(self.metricList, function (metric) {
                self.metricDict[metric.id] = metric;
            });

            self.updateFields(self.metricList);
        }).$promise;
    };

    return DocumentForm;
})
.factory('DocumentFieldFactory', function (DocumentField, $engine) {
    function DocumentFieldFactory(metrics) {
        this._fieldList = [];
        this.metrics = metrics;
        this._defaultField = new DocumentField(function(){return true;}, function (field, metric) { return field; });

        this._registerBasicFields();
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
        this._fieldList.push(documentField);
    };

    DocumentFieldFactory.prototype.makeField = function makeField(metricList, metric, ctx) {
        for(var i = 0; i < this._fieldList.length; ++i) {
            if(this._fieldList[i].matches(metric))
                return this._fieldList[i].makeField(metricList, metric, ctx);
        }
        if(!this.allowDefaultField)
            throw new Error("DocumentFieldFactory.allowDefaultField is false but there was a metric which could not be matched to registered types: ",
                            "Metric", metric, "Registered types", this._fieldList);

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

    DocumentFieldFactory.prototype._registerBasicFields = function _registerBasicFields(metric) {
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
                template: '<' + metric.externalType + ' ng-model="options.templateOptions.ngModel" ' +
                'options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                'metric-id="' + metric.id + '">' + '</' + metric.externalType + '>',
                templateOptions: {ngModel: ctx.document, options: ctx.options},
                // expressionProperties: {'templateOptions.disabled': false}
            };
        }));

        this.register(new DocumentField({inputType: 'QUERIED_LIST'}, function (field, metric, ctx) {
            field.type = undefined;
            field.model = undefined;
            field = {
                template: '<engine-document-list form-widget="true" parent-document="options.templateOptions.document" options="options.templateOptions.options" class="' + metric.visualClass.join(' ') + '" ' +
                ' query="\'' + metric.queryId + '\'" show-create-button="' + metric.showCreateButton + '"></engine-document-list>',
                templateOptions: {
                    options: $engine.getOptions(metric.modelId),
                    document: ctx.document
                }, expressionProperties: {'templateOptions.disabled': self.isDisabled}
            };

            return field;
        }));
    };

    return new DocumentFieldFactory();
})
.factory('DocumentField', function () {
    function DocumentField(fieldCondition, fieldBuilder) {
        if(_.isFunction(fieldCondition))
            this.fieldCondition = fieldCondition;
        else {
            var _condition;
            if (_.isString(fieldCondition))
                _condition = {visualClass: fieldCondition};
            else
                _condition = fieldCondition;

            this.fieldCondition = function (metric) {
                for(var metricAttribute in _condition) {
                    if(_.isArray(metric[metricAttribute]) && !_.contains(metric[metricAttribute], _condition[metricAttribute]))
                        return false;
                    else if(_.isString(metric[metricAttribute]) && metric[metricAttribute] != _condition[metricAttribute])
                        return false;
                }
                return true;
            }
        }

        this.fieldCustomizer = fieldBuilder;
    }
    DocumentField.prototype.matches = function matches(metric) {
        return this.fieldCondition(metric);
    };

    DocumentField.prototype.makeField = function makeField(metricList, metric, ctx) {
        var formlyField = {
            model: metricList,
            key: metric.id,
            type: 'input',
            className: metric.visualClass.join(' '),
            templateOptions: {
                type: 'text',
                label: metric.label,
                description: metric.description,
                placeholder: 'Enter ' + metric.label,
                required: metric.required
            },
            expressionProperties: {
                'templateOptions.disabled': self.isDisabled
            },
            validators: {
            },
            validation: {
                show: false,
                messages: {
                    required: 'to.label+"_required"'
                }
            }
        };

        if (metric.reloadOnChange) {
            //:TODO: make reload listener
        }


        return this.fieldCustomizer(formlyField, metric, ctx);
    };

    return DocumentField;
});