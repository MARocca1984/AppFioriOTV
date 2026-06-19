sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    return Controller.extend("vendorapp.controller.Main", {

        onInit: function () {},

        onNavigateMainVendor: function () {
            this._navTo("mainVendor");
        },

        onNavigateAlternativePayee: function () {
            this._navTo("alternativePayee");
        },

        onNavigateOrderingAddress: function () {
            this._navTo("orderingAddress");
        },

        onNavigateOneTimeVendor: function () {
            this._navTo("oneTimeVendorList");
        },

        onNavigateLowValuePayment: function () {
            this._navTo("lowValuePayment");
        },

        _navTo: function (sRoute) {
            this.getOwnerComponent().getRouter().navTo(sRoute);
        }

    });
});
