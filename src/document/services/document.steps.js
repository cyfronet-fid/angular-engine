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
                    if(_.isArray(step.categories)){
                        var _categories = [];
                        _.forEach(step.categories, function (categoryId) {
                            _categories.push(metricCategories.getNames(categoryId));
                        });

                        self.steps.push(new Step(_categories));

                    }
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
    });
