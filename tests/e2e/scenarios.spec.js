'use strict';

describe('Engine Frontend Sanity Tests', function() {
    var firstNumber = element(by.model('first'));
    var secondNumber = element(by.model('second'));
    var goButton = element(by.id('gobutton'));
    var latestResult = element(by.binding('latest'));

    beforeEach(function() {
        browser.get("/tests/e2e/index.html");
    });

    it('should have a title', function() {
        expect(browser.getTitle()).toEqual('Engine Front End App');
    });

    // it('should add one and two', function() {
    //     firstNumber.sendKeys(1);
    //     secondNumber.sendKeys(2);
    //
    //     goButton.click();
    //
    //     expect(latestResult.getText()).toEqual('3');
    // });
    //
    // it('should add four and six', function() {
    //     Fill this in.
        // expect(latestResult.getText()).toEqual('10');
    // });

});