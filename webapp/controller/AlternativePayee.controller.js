sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    return Controller.extend("vendorapp.controller.AlternativePayee", {

        onInit: function () {},

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }

    });
});
