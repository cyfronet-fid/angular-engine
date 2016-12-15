angular.module('engine.document')
.factory('DocumentValidator', function (engineDocument, $engineApiCheck, $log, Step) {
    function DocumentValidator(document, stepList, formStructure) {
        this.stepList = stepList;
        this.formStructure = formStructure;
        this.document = document;
    }

    DocumentValidator.prototype.setStepsState = function setStepsState(steps, state) {
        $engineApiCheck([$engineApiCheck.arrayOf($engineApiCheck.instanceOf(Step)), $engineApiCheck.oneOf(Step.validStates)], arguments);
        _.forEach(steps, function (step) {
            step.setState(state);
        });
    };

    DocumentValidator.prototype.makeDocumentForValidation = function makeDocumentForValidation(document, stepsToValidate) {
        var documentForValidation = _.omit(document, 'metrics');

        documentForValidation.metrics = {};

        _.forEach(stepsToValidate, function (step) {
            _.forEach(step.fields, function (field) {
                documentForValidation.metrics[field.data.id] = document.metrics[field.data.id];
                if(documentForValidation.metrics[field.data.id] === undefined) // if field has not been set, set it to null, otherwise it won't be sent
                    documentForValidation.metrics[field.data.id] = null;
            });
        });

        return documentForValidation;
    };

    DocumentValidator.prototype.validate = function validate(step) {
        $engineApiCheck([$engineApiCheck.typeOrArrayOf($engineApiCheck.number).optional], arguments);

        var self = this;

        $log.debug('DocumentValidator.validate called');

        var stepsToValidate = [];

        if(step == null)
            stepsToValidate = this.stepList.getSteps();
        else {
            if(!_.isArray(step))
                step = [step];

            _.forEach(step, function (stepIndex) {
                stepsToValidate.push(self.stepList.getStep(stepIndex));
            })
        }

        this.setStepsState(stepsToValidate, Step.STATE_LOADING);

        var documentForValidation = this.makeDocumentForValidation(this.document, stepsToValidate);

        return engineDocument.validate(documentForValidation).$promise.then(function (validationData) {
            $log.debug(validationData);

            var _validatedMetrics = _.indexBy(validationData.results, 'metricId');

            _.forEach(stepsToValidate, function (step) {
                _.forEach(step.fields, function (field, fieldId) {
                    if(_validatedMetrics[fieldId].valid == false) {
                        step.setState(Step.STATE_INVALID);
                        if(self.formStructure[field.id] != null) {
                            _.forEach(_validatedMetrics[fieldId].messages, function (message) {
                                self.formStructure[field.id].$setValidity(message, false);
                            });
                            self.formStructure[field.id].$setValidity('server', false);
                            self.formStructure[field.id].$setValidity('required', true);

                            field.validation.show = true;
                        }
                        field.templateOptions.serverErrors = _validatedMetrics[fieldId].messages;
                    }
                });

                $log.debug(self.formStructure.$error);

                if(step.getState() == Step.STATE_LOADING)
                    step.setState(Step.STATE_VALID);
            });


            return validationData.valid;
        });

        //
        // engineDocument.validate($scope.document, function (data) {
        //     console.log(data);
        //     self.form.form.$externalValidated = true;
        //     self.form.backendValidation = data;
        //
        //     var _failedCategories = {};
        //
        //     var _mentionedCategories = {};
        //
        //     angular.forEach(self.form.backendValidation.results, function (metric) {
        //         var categoryId = self.allMetrics_d[metric.metricId].categoryId;
        //         if(metric.valid === false){
        //             _failedCategories[categoryId] = true;
        //         }
        //         _mentionedCategories[categoryId] = true;
        //
        //         if(!dontShowErrors)
        //             if(metric.metricId in $scope.metrics && $scope.metrics[metric.metricId].formControl){
        //                 $scope.metrics[metric.metricId].validation.show = true;
        //                 $scope.metrics[metric.metricId].formControl.$validate();
        //             }
        //     });
        //
        //     angular.forEach($scope.steps, function (step, index) {
        //         angular.forEach(step.categories, function (category) {
        //             if(category in _failedCategories)
        //                 self.validatedSteps[index] = 'invalid';
        //             else if(!(category in _mentionedCategories) && self.validatedSteps[index] != 'invalid')
        //                 self.validatedSteps[index] = 'blank';
        //
        //         })
        //     });
        //
        //     if(self.validatedSteps){
        //         var _firstFailedStep = null;
        //
        //         for(var i=0; i < self.validatedSteps.length; ++i){
        //             if(self.validatedSteps[i] == 'loading') {
        //                 self.validatedSteps[i] = 'valid';
        //             }
        //             else if(_firstFailedStep === null)
        //                 _firstFailedStep = i;
        //         }
        //
        //         if(!dontShowErrors && _firstFailedStep !== null) {
        //             self.step = _firstFailedStep;
        //             self.showErrors = true;
        //         }
        //     }
        //
        //
        // }, function (response) {
        //     if(self.validatedSteps)
        //         for(var i=0; i < self.validatedSteps.length; ++i)
        //             self.validatedSteps[i] = 'invalid';
        // });

    };

    return DocumentValidator;
});