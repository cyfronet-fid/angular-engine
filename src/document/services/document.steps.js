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

        StepList.prototype.getFirstInvalid = function getFirstInvalid() {
            _.find(this.steps, function (step) {
                return step.state == Step.STATE_INVALID;
            })
        };

        StepList.prototype.getSteps = function getSteps() {
            return this.steps;
        };

        StepList.prototype.getStep = function getStep(stepIndex) {
            return this.steps[stepIndex];
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
            this.metricCategories = metricCategories;
            this.fields = [];
            this.visible = (visible != null);
            this.state = this.defaultState;
            this.$valid = false;
        }

        Step.prototype.STATE_VALID = 'valid';
        Step.prototype.STATE_INVALID = 'invalid';
        Step.prototype.STATE_BLANK = 'blank';
        Step.prototype.STATE_LOADING = 'loading';
        Step.prototype.validStates = [this.STATE_VALID, this.STATE_INVALID, this.STATE_LOADING, this.STATE_BLANK];
        Step.prototype.defaultState = 'blank';

        Step.prototype.setState = function setState(state) {
            _ac([_ac.oneOf(this.validStates)], arguments);
            this.state = state;
        };

        return Step;
    });
