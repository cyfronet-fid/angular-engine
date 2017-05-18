angular.module('engine.document')
.factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, $q,
                                   DocumentCategoryFactory, $engineApiCheck, $log, DocumentValidator) {
    var _apiCheck = $engineApiCheck;

    function DocumentForm() {
        this.fieldList = [];
        this.metricList = [];
        this.metricDict = {};
        this.metricCategories = {};
        this.document = null;
        this.documentOptions = null;
        this.steps = null;
        this.disabled = false;
        this.categoryWrapper = 'category';
        this.categoryWrapperCSS = 'text-box';
        this.formStructure = [];
        this.currentFormlyFields = [];
        this.formlyFields = [];
        this.validator = null;
        this.currentStep = null;
        this.categoriesDict = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {object}
         */
        // this.formlyState = {};
        /**
         * this is for formly use, in here all formly state data is stored
         * @type {{}}
         */
        // this.formlyOptions = {};
        this.formLoaded = false;
        this.markInit = null;
        var self = this;
        this.$ready = $q(function (resolve, reject) {
            self.markInit = resolve;
        }).then(function(){
            return self._loadMetricCategories();
        });

    }

    DocumentForm.prototype.loadForm = function loadForm() {
        var self = this;

        return this.$ready.then(function(){
            return self._loadMetrics();
        }).then(function(){
            self._makeForm();
            self.formLoaded = true;
        });
    };

    /**
     * INTERNAL FUNCTION, as it is callback from form controls, it does not have to check state of the form
     * IN FUTURE it may be made public, in which case check will have to be added in order to make sure, that
     * initial form has been loaded
     *
     * @returns {Promise<U>|Promise<R>}
     * @private
     */
    DocumentForm.prototype._reloadForm = function reloadForm() {
        var self = this;

        if(!this.formLoaded) {
            $log.error('DocumentForm._reloadForm called without waiting for DocumentForm.loadForm');
            throw new Error();
        }

        return engineMetric(this.document, function (metricList) {
            console.log('New loaded metrics: ', metricList);
            var metricDict = _.indexBy(metricList, 'id');

            var newMetrics = _.reject(metricList, function (metric) {
                return metric.id in self.metricDict;
            });

            console.log('New metrics: ', newMetrics);

            //remove metrics, which are not present in metricList
            _.forEach(self.metricList, function (metric) {
                if(!(metric.id in metricDict)) {

                    var metricIndex = _.findIndex(self.categoriesDict[metric.categoryId].fieldGroup, function (field) {
                        return field.data.id == metric.id;
                    });
                    if(metricIndex == -1)
                        return;

                    console.log('Metric to remove: ', metric, 'index: ', metricIndex);
                    delete self.metricDict[metric.id];
                    self.categoriesDict[metric.categoryId].fieldGroup.splice(metricIndex, 1);
                    delete self.document.metrics[metric.id];
                }
            });

            //add new metrics to the form, with respect to position
            _.forEach(newMetrics, function (newMetric) {
                console.log(self.categoriesDict[newMetric.categoryId]);
                self.addMetric(newMetric);
                var field = DocumentFieldFactory.makeField(self.metricList, newMetric, {document: self.document,
                                                                                        options: self.documentOptions,
                                                                                        documentForm: self});
                self.categoriesDict[newMetric.categoryId].fieldGroup.splice(newMetric.position, 0, field);

                self.categoriesDict[newMetric.categoryId].fieldGroup = _.sortBy(self.categoriesDict[newMetric.categoryId].fieldGroup, function (metric) {
                    return metric.data.position;
                });

                for(var i = 0; i < self.steps.getSteps().length; ++i) {
                    var step = self.steps.getStep(i);
                    if (self.categoriesDict[field.data.categoryId] === undefined) {
                        $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                            'field', field, 'categoryId', field.data.categoryId);
                        continue;
                    }
                    if (step.metrics[field.data.categoryId] === undefined)
                        continue;

                    step.fields[field.data.id] = field;
                    break;
                }
            })
        }).$promise;
    };

    DocumentForm.prototype.addMetric = function addMetric(metric) {
        if(metric.id in this.metricDict)
            return;

        this.metricList.push(metric);
        this.metricDict[metric.id] = metric;
    };

    DocumentForm.prototype._loadMetricCategories = function loadMetricCategories() {
        var self = this;

        return engineMetricCategories.then(function (metricCategories) {
            self.metricCategories = metricCategories;
        });
    };
    DocumentForm.prototype._setDocument = function setDocument(document) {
        if(this.document != null) {
            this.document = document;
            _.forEach(this.fieldList, function (field) {
                field.model = document.metrics;
            });
        }
        else
            this.document = document;
    };
    DocumentForm.prototype._setActions = function setActions(actions) {
        this.actions = actions;
    };
    DocumentForm.prototype._setOptions = function setOptions(documentOptions) {
        this.documentOptions = documentOptions;
    };
    DocumentForm.prototype._setSteps = function setSteps(steps) {
        this.steps = steps;

        _.forEach(this.steps.getSteps(), function (step) {
            _.forEach(step.metricCategories, function (metricCategory) {
                if(_.isArray(metricCategory.visualClass))
                    metricCategory.visualClass.push('category');
                else
                    metricCategory.visualClass = ['category'];
            })
        })
    };
    DocumentForm.prototype.init = function init(document, options, steps, actions) {
        _apiCheck([_apiCheck.object, _apiCheck.object, _apiCheck.arrayOf(_apiCheck.object)], arguments);

        this._setDocument(document);
        this._setOptions(options);
        this._setSteps(steps);
        this._setActions(actions);

        this.markInit();
    };

    DocumentForm.prototype.setEditable = function setEditable(editable) {
        this.disabled = !editable;
    };

    DocumentForm.prototype.isEditable = function isEditable() {
        return !this.disabled;
    };

    DocumentForm.prototype.setStep = function setStep(step) {
        this.currentFormlyFields = this.formStructure[step];

        if(this.currentStep != null)
            this.formStructure[this.currentStep].data.hide = true;

        this.currentStep = step;
        this.formStructure[this.currentStep].data.hide = false;
        $log.debug('current fields to display in form', this.currentFormlyFields);
    };

    DocumentForm.prototype._assertInit = function assertInit() {
        var message = ' is null! make sure to call DocumentForm.init(document, options, steps) before calling other methods';

        assert(this.document != null, 'DocumentForm.document'+message);
        assert(this.documentOptions != null, 'DocumentForm.documentOptions'+message);
        assert(this.steps != null, 'DocumentForm.steps'+message);
        assert(this.actions != null, 'DocumentForm.actions'+message);
    };

    DocumentForm.prototype._onReload = function onReload() {
        $log.debug('Form reload called');
        this._reloadForm();
    };

    DocumentForm.prototype._makeForm = function makeForm() {
        var self = this;

        console.log('DocumentForm._makeForm', this.fieldList);
        this._assertInit();

        assert(this.metricList.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetrics');
        assert(this.metricCategories.$resolved == true, 'Called DocumentForm._makeForm() before calling DocumentForm._loadMetricCategories');

        var _categoriesToPostProcess = [];

        _.forEach(this.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory(step);
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
        });
        _.forEach(this.steps.getSteps(), function (step) {
            connectFields(step);
        });

        postprocess();

        reorderFields();
        setDefaultValues();

        this.validator = new DocumentValidator(this.document, this.steps, this.formlyState);

        console.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(step, metricCategories) {
            var formCategories = [];
            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, {document: self.document});

                formMetricCategory.fieldGroup = parseMetricCategories(step, metricCategory.children);

                self.categoriesDict[metricCategory.id] = formMetricCategory;
                step.metrics[metricCategory.id] = formMetricCategory;
                if(_.isFunction(formMetricCategory.data.$process))
                    _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields(step) {
            _.forEach(self.fieldList, function (field) {
                if(self.categoriesDict[field.data.categoryId] === undefined){
                    $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                              'field', field, 'categoryId', field.data.categoryId);
                    return;
                }
                if(step.metrics[field.data.categoryId] === undefined)
                    return;

                self.categoriesDict[field.data.categoryId].fieldGroup.push(field);
                step.fields[field.data.id] = field;
            });
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            })
        }

        function setDefaultValues() {
            _.forEach(self.metricDict, function (metric, metricId) {
                if(metric.defaultValue != null && self.document.metrics[metricId] == null)
                    self.document.metrics[metricId] = metric.defaultValue;
            })
        }

        function reorderFields() {
            _.forEach(self.categoriesDict, function (metricCategory) {
                metricCategory.fieldGroup = _.sortBy(metricCategory.fieldGroup, function (field) {
                    return field.data.position;
                });
            });
        }
    };

    DocumentForm.prototype._updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, {document: this.document, options: this.documentOptions, documentForm: this});
    };

    DocumentForm.prototype._loadMetrics = function loadMetrics() {
        var self = this;

        return engineMetric(this.document, function (metricList) {
            self.metricList = metricList;
            self.metricDict = _.indexBy(self.metricList, 'id');
            self._updateFields(self.metricList);
        }).$promise;
    };

    DocumentForm.prototype.validateCurrentStep = function validateCurrentStep(fillNull) {
        return this.validator.validate(this.currentStep, fillNull);
    };

    DocumentForm.prototype.validate = function validate(step, fillNull) {
        return this.validator.validate(step, fillNull);
    };

    return DocumentForm;
});