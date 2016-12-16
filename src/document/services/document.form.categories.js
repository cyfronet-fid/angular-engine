angular.module('engine.document')
    .factory('DocumentCategoryFactory', function (DocumentCategory, $log) {
        function DocumentCategoryFactory() {
            this._categoryTypeList = [];
            this._defaultCategory = new DocumentCategory();

            this._registerBasicCategories();
        }

        DocumentCategoryFactory.prototype.register = function register(documentCategory) {
            this._categoryTypeList.push(documentCategory);
        };

        DocumentCategoryFactory.prototype.makeCategory = function makeCategory(category, ctx) {
            for (var i = 0; i < this._categoryTypeList.length; ++i) {
                if (this._categoryTypeList[i].matches(category))
                    return this._categoryTypeList[i].makeCategory(category, ctx);
            }

            return this._defaultCategory.makeCategory(category, ctx);
        };

        DocumentCategoryFactory.prototype.makeStepCategory = function makeStepCategory() {
            var formStepStructure = {
                fieldGroup: null,
                templateOptions: {'disabled': true},
                data: {hide: true},
                wrapper: 'step'
            };

            return formStepStructure;
        };

        DocumentCategoryFactory.prototype._registerBasicCategories = function _registerBasicCategories() {
            this.register(new DocumentCategory('row', function (formlyCategory, metricCategory, ctx) {
                formlyCategory.templateOptions.wrapperClass = '';
                formlyCategory.wrapper = 'row';
                formlyCategory.data.$process = function () {
                    // TODO INCLUDE OPERATOR DEFINED WIDTHS
                    // _.find(formlyCategory.fieldGroup, function (field) {
                    //     return field.templateOptions.css == 'col-md-6';
                    // });

                    var size = Math.floor(12/formlyCategory.fieldGroup.length);
                    size = size < 1 ? 1 : size;

                    _.forEach(formlyCategory.fieldGroup, function (field) {
                        field.templateOptions.css = 'col-md-'+size;
                    })
                };
                return formlyCategory;
            }));

            this.register(new DocumentCategory('category', function (formlyCategory, metricCategory, ctx) {
                formlyCategory.templateOptions.wrapperClass = 'text-box';
                formlyCategory.wrapper = 'category';
                return formlyCategory;
            }));

        };

        return new DocumentCategoryFactory();

    })
    .factory('DocumentCategory', function (ConditionBuilder) {
        function DocumentCategory(categoryCondition, categoryBuilder) {
            if(categoryBuilder == null)
                categoryBuilder = function (formlyCategory, metricCategory, ctx) {return formlyCategory;};
            if(categoryCondition == null)
                categoryCondition = function () {return true;};

            this.categoryCondition = ConditionBuilder(categoryCondition);
            this.categoryCustomizer = categoryBuilder;

            this.categoryWrapper = 'default';
            this.categoryWrapperCSS = '';
        }

        DocumentCategory.prototype.matches = function matches(metricCategory) {
            return this.categoryCondition(metricCategory);
        };

        DocumentCategory.prototype.makeCategory = function makeCategory(metricCategory, ctx) {
            //**IMPORTANT NOTE** metricCategory.children should not be parsed here
            //DocumentCategory is parsing only given category, taking care of category hierarchy is part
            //of DocumentForm job, that's why fieldGroup is intentionally set to `null`
            var formlyCategory = {
                templateOptions: {
                    categoryId: metricCategory.id,
                    wrapperClass: this.categoryWrapperCSS,
                    label: metricCategory.label,
                    visualClass: metricCategory.visualClass
                },
                fieldGroup: null,
                wrapper: this.categoryWrapper,
                data: {}
            };

            return this.categoryCustomizer(formlyCategory, metricCategory, ctx);
        };

        return DocumentCategory;
    });