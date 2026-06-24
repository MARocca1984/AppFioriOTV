/*
 * Builds a single self-contained HTML file (OTV-standalone.html) that runs the
 * app by just opening it in a browser (no web server needed).
 *
 * How it works:
 *  - The whole app (Component, views, controllers, manifest, i18n) is bundled
 *    into dist/Component-preload.js by "ui5 build" and inlined here as a script,
 *    so there are NO XHR requests (which is what blocks UI5 apps under file://).
 *  - The CSS is inlined too.
 *  - The UI5 runtime is loaded from the public OpenUI5 CDN (needs internet).
 *
 * Usage:
 *   npx ui5 build            // generates dist/ (Component-preload.js + css)
 *   node tools/build-standalone.js
 *   -> creates OTV-standalone.html in the project root
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const css = fs.readFileSync(path.join(dist, "css", "style.css"), "utf8");
const preload = fs.readFileSync(path.join(dist, "Component-preload.js"), "utf8");

const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Management | Accenture</title>
    <style>
${css}
    </style>
    <script id="sap-ui-bootstrap"
        src="https://sdk.openui5.org/1.120.46/resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m,sap.f,sap.ui.layout,sap.ui.unified"
        data-sap-ui-compatVersion="edge"
        data-sap-ui-async="false"
        data-sap-ui-resourceroots='{"vendorapp": "./"}'>
    </script>
    <script>
${preload}
    </script>
</head>
<body class="sapUiBody" style="height:100%; margin:0;">
    <div id="content" style="height:100%"></div>
    <script>
        sap.ui.getCore().attachInit(function () {
            sap.ui.require(["sap/ui/core/ComponentContainer"], function (ComponentContainer) {
                new ComponentContainer({
                    name: "vendorapp",
                    manifest: true,
                    async: true,
                    height: "100%",
                    settings: { id: "vendorapp" }
                }).placeAt("content");
            });
        });
    </script>
</body>
</html>
`;

const out = path.join(root, "OTV-standalone.html");
fs.writeFileSync(out, html);
console.log("Generated " + out + " (" + Math.round(html.length / 1024) + " KB)");
