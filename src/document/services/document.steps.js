angular.module('engine.document')
    .factory('StepList', function (Step, $q, engineMetricCategories, $engineApiCheck, $engLog, $parse) {
        var _ac = $engineApiCheck;

        function StepList(documentOptionSteps) {
            var self = this;

            this.documentSteps = documentOptionSteps;
            this.steps = [];
            this.singleStep = false;
            this._$readyDeferred = $q.defer();
            this.$ready = this._$readyDeferred.promise;
            this.currentStep = null;

        }

        StepList.prototype.setDocument = function setDocument(document) {
            var self = this;
            this.document = document;

            if (this.steps != [])
                this.steps = []

            this.documentSteps = _.filter(this.documentSteps, function (step) {
                var cond = step.condition;
                if (cond == null)
                    return true;
                else if (_.isString(cond)) {
                    return $parse(cond)(self.document);
                }
                else if (_.isFunction(cond)) {
                    return cond(self.document);
                } else
                    return false
            });
            this._preprocessDocumentSteps();
        };

        StepList.prototype._preprocessDocumentSteps = function _preprocessDocumentSteps() {
            var self = this;

            engineMetricCategories.then(function (metricCategories) {
                assert(_.isArray(self.documentSteps) && !_.isEmpty(self.documentSteps), 'documentSteps were not defined');

                _.forEach(self.documentSteps, function (step, index) {
                    if (_.isArray(step.categories)) {
                        var _categories = [];
                        _.forEach(step.categories, function (categoryId) {
                            _categories.push(metricCategories.getNames(categoryId));
                        });

                        self.steps.push(new Step(_categories, step, index));

                    }
                    else { //is string (metricCategory) so we have to retrieve its children
                        if (!(step.categories in metricCategories.metrics)) {
                            $engLog.error(step.categories, ' not in ', metricCategories.metrics, '. Make sure that metric category registered in document.steps exists');
                            throw new Error();
                        }

                        self.steps.push(new Step(metricCategories.metrics[step.categories].children, step, index));
                    }
                });

                self._$readyDeferred.resolve();
            }, function (error) {
                self._$readyDeferred.reject(error);
            });
        };

        StepList.prototype.isLast = function isLast(step) {
            return step == this.steps.length - 1;
        };

        StepList.prototype.getFirstInvalid = function getFirstInvalid() {
            return _.find(this.steps, function (step) {
                return step.state == Step.STATE_INVALID;
            })
        };

        StepList.prototype.getFirstInvalidIndex = function getFirstInvalidIndex() {
            return this.getFirstInvalid().index;
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

        StepList.prototype.getCurrentStepIndex = function getCurrentStepIndex() {
            return this.steps.indexOf(this.currentStep);
        };

        return StepList;
    })
    .factory('Step', function ($engineApiCheck) {

        function Step(metricCategories, data, index, visible) {
            this.metricCategories = metricCategories;
            this.metrics = {};
            this.fields = {};
            this.visible = (visible != null);
            this.state = Step.defaultState;
            this.$valid = false;
            this.name = data.name;
            this.index = index;
            this.data = data;
        }

        Step.STATE_VALID = 'valid';
        Step.STATE_INVALID = 'invalid';
        Step.STATE_BLANK = 'blank';
        Step.STATE_LOADING = 'loading';
        Step.validStates = [Step.STATE_VALID, Step.STATE_INVALID, Step.STATE_LOADING, Step.STATE_BLANK];
        Step.defaultState = 'blank';

        Step.prototype.setState = function setState(state) {
            assert(state != null, 'Privided state (', state, ') is not in', Step.validStates);
            $engineApiCheck([$engineApiCheck.oneOf(Step.validStates)], arguments);
            this.state = state;
        };

        Step.prototype.getState = function getState() {
            return this.state;
        };

        return Step;
    });
