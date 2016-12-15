angular.module('engine.document')
.factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory,
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

        var _metricDict = {};
        var _categoriesToPostProcess = [];

        _.forEach(this.steps.getSteps(), function (step) {
            var formStepStructure = DocumentCategoryFactory.makeStepCategory();
            formStepStructure.fieldGroup = parseMetricCategories(step, step.metricCategories);

            self.formStructure.push(formStepStructure);
            connectFields(step);
        });

        postprocess();

        this.validator = new DocumentValidator(this.document, this.steps, this.formlyState);

        console.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(step, metricCategories) {
            var formCategories = [];

            _.forEach(metricCategories, function (metricCategory) {

                var formMetricCategory = DocumentCategoryFactory.makeCategory(metricCategory, {document: self.document});

                formMetricCategory.fieldGroup = parseMetricCategories(step, metricCategory.children);

                _metricDict[metricCategory.id] = formMetricCategory;
                step.metrics[metricCategory.id] = formMetricCategory;
                if(_.isFunction(formMetricCategory.data.$process))
                    _categoriesToPostProcess.push(formMetricCategory);

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields(step) {
            _.forEach(self.fieldList, function (field) {
                if(_metricDict[field.data.categoryId] === undefined){
                    $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                              'field', field, 'categoryId', field.data.categoryId);
                    return;
                }
                if(step.metrics[field.data.categoryId] === undefined)
                    return;

                _metricDict[field.data.categoryId].fieldGroup.push(field);
                step.fields[field.data.id] = field;
            });
        }

        function postprocess() {
            _.forEach(_categoriesToPostProcess, function (entry) {
                entry.data.$process();
            })
        }
    };

    DocumentForm.prototype.updateFields = function updateFields(metricList) {
        this.fieldList = DocumentFieldFactory.makeFields(metricList, {document: this.document, options: this.documentOptions, documentForm: this});
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

    DocumentForm.prototype.validate = function validate(step) {
        return this.validator.validate(step);
    };

    return DocumentForm;
});