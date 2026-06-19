sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, JSONModel) {
    "use strict";

    return UIComponent.extend("vendorapp.Component", {

        metadata: { manifest: "json" },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // Shared One Time Vendor records (mock data — will later be sourced from ZT_OTV_DATA).
            // Each record carries the FULL field set so the detail screen can map/edit everything.
            // The 3 mock rows showcase the three FB60/F-53 states (both pending / FB60 done / both done).
            var oOtvModel = new JSONModel({
                records: [
                    {
                        companyCode: "1700",
                        paymentDate: "2025-09-03",
                        documentDate: "2025-09-01",
                        receivedDate: "2025-08-30",
                        baselineDate: "2025-09-01",
                        exceptionReason: "Rush AP - No Vendor",
                        invoiceInformation: "SUPERSOCIEDADES CONTRIBUCION 2025",
                        paymentMethod: "M",
                        payeeName: "TMF COLOMBIA LTDA",
                        payeeCity: "BOGOTA",
                        invoiceAmount: "20,020,000",
                        taxAmount: "0",
                        docType: "KR",
                        sapVendor: "4170000",
                        paymentCurrency: "COP",
                        cashClearingGL: "101223",
                        valueDate: "2025-09-03",
                        clearingText: "89999086 SUPERSOCIEDADES CONTRIBUCION 2025",
                        preparedBy: "M. Rocca",
                        fb60Invoice: "",
                        f53Clearing: "",
                        items: [
                            { postingKey: "40 - Debit", glAccount: "714104", debit: "20020000", credit: "", taxCode: "", costCtr: "", wbsElement: "LI082006", profitCtr: "", companyCode: "1700", text: "89999086 SUPERSOCIEDADES CONTRIBUCION 2025" }
                        ]
                    },
                    {
                        companyCode: "1900",
                        paymentDate: "2022-08-18",
                        documentDate: "2022-08-18",
                        receivedDate: "2022-08-09",
                        baselineDate: "2022-08-18",
                        exceptionReason: "Statutory/Tax",
                        invoiceInformation: "Pago anticipo Diplomado en Desarrollo de Competencias",
                        paymentMethod: "M",
                        payeeName: "UNIVERSIDAD NACIONAL AUTONOMA DE MEXICO",
                        payeeCity: "México",
                        invoiceAmount: "15,000.00",
                        taxAmount: "0",
                        docType: "KR",
                        sapVendor: "4190000",
                        paymentCurrency: "MXN",
                        cashClearingGL: "540000",
                        valueDate: "2022-08-18",
                        clearingText: "Pago anticipo Diplomado en Desarrollo de Competencias",
                        preparedBy: "M. Rocca",
                        fb60Invoice: "5100001234",
                        f53Clearing: "",
                        items: [
                            { postingKey: "40 - Debit", glAccount: "540000", debit: "15000", credit: "", taxCode: "", costCtr: "", wbsElement: "", profitCtr: "", companyCode: "1900", text: "Pago anticipo Diplomado" }
                        ]
                    },
                    {
                        companyCode: "1700",
                        paymentDate: "2025-07-21",
                        documentDate: "2025-07-20",
                        receivedDate: "2025-07-18",
                        baselineDate: "2025-07-20",
                        exceptionReason: "Urgent Payment",
                        invoiceInformation: "Servicios logisticos julio 2025",
                        paymentMethod: "Q",
                        payeeName: "SERVICIOS LOGISTICOS ANDINOS SAS",
                        payeeCity: "MEDELLIN",
                        invoiceAmount: "8,450,000",
                        taxAmount: "0",
                        docType: "KR",
                        sapVendor: "4180022",
                        paymentCurrency: "COP",
                        cashClearingGL: "101223",
                        valueDate: "2025-07-21",
                        clearingText: "Servicios logisticos julio 2025",
                        preparedBy: "M. Rocca",
                        fb60Invoice: "5100007777",
                        f53Clearing: "1500003333",
                        items: [
                            { postingKey: "40 - Debit", glAccount: "714104", debit: "8450000", credit: "", taxCode: "", costCtr: "", wbsElement: "", profitCtr: "", companyCode: "1700", text: "Servicios logisticos julio 2025" }
                        ]
                    }
                ]
            });
            this.setModel(oOtvModel, "otv");

            this.getRouter().initialize();
        }
    });
});
