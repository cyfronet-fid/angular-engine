angular.module('engine.document')
.factory('DocumentForm', function (engineMetricCategories, engineMetric, DocumentFieldFactory, $engineApiCheck, $log) {
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
        this.formStructure = [];

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

        var _metricDict = {};

        _.forEach(this.steps.getSteps(), function (step) {
            self.formStructure.push(parseMetricCategories(step.metricCategories));
        });

        connectFields();

        console.debug('DocumentForm form structure', self.formStructure);

        return self.formStructure;

        function parseMetricCategories(metricCategories) {
            var formCategories = [];

            _.forEach(metricCategories, function (metricCategory) {


                _metricDict[metricCategory.id] = formMetricCategory;

                formCategories.push(formMetricCategory);
            });

            return formCategories;
        }

        function connectFields() {
            _.forEach(self.fieldList, function (field) {
                if(_metricDict[field.categoryId] === undefined){
                    $log.warn('$engine.document.DocumentForm There is a metric belonging to metric category which is not connected to any step!',
                              'field', field, 'categoryId', field.categoryId);
                    return;
                }

                _metricDict[field.categoryId].fieldGroup.push(field);
            });
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
.factory('ConditionBuilder', function () {
    return function (fieldCondition) {
        if (_.isFunction(fieldCondition))
            this.fieldCondition = fieldCondition;
        else {
            var _condition;
            if (_.isString(fieldCondition))
                _condition = {visualClass: fieldCondition};
            else
                _condition = fieldCondition;

            this.fieldCondition = function (metric) {
                for (var metricAttribute in _condition) {
                    if (_.isArray(metric[metricAttribute]) && !_.contains(metric[metricAttribute], _condition[metricAttribute]))
                        return false;
                    else if (_.isString(metric[metricAttribute]) && metric[metricAttribute] != _condition[metricAttribute])
                        return false;
                }
                return true;
            }
        }
    };
});