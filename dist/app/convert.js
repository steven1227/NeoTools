// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var App;
(function (App) {
    class convert {
        start() {
            const div = document.createElement("div");
            div.style.left = "50px";
            div.style.right = "50px";
            div.style.top = "50px";
            div.style.bottom = "50px";
            div.style.position = "absolute";
            div.style.overflow = "hidden";
            document.body.appendChild(div);
            let label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "wif转公钥：";
            const input_wif = document.createElement("input");
            div.appendChild(input_wif);
            input_wif.style.width = "500px";
            input_wif.style.position = "absoulte";
            input_wif.multiple = true;
            input_wif.value = "KwwJMvfFPcRx2HSgQRPviLv4wPrxRaLk7kfQntkH8kCXzTgAts8t";
            input_wif.type = "password";
            let label_prikey = document.createElement("label");
            div.appendChild(label_prikey);
            label_prikey.textContent = "";
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "私钥转公钥：";
            const input_prikey = document.createElement("input");
            div.appendChild(input_prikey);
            input_prikey.style.width = "500px";
            input_prikey.style.position = "absoulte";
            input_prikey.multiple = true;
            input_prikey.value = "";
            let label_pubkey = document.createElement("label");
            div.appendChild(label_pubkey);
            label_pubkey.textContent = "";
            div.appendChild(document.createElement("br"));
            const btn_convert = document.createElement("button");
            div.appendChild(btn_convert);
            btn_convert.textContent = "转换";
            btn_convert.onclick = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (input_wif.value != "") {
                        const prikey = ThinNeo.Helper.GetPrivateKeyFromWIF(input_wif.value);
                        label_prikey.textContent = ThinNeo.Helper.GetPublicKeyFromPrivateKey(prikey).toHexString();
                    }
                    if (input_prikey.value != "") {
                        label_pubkey.textContent = ThinNeo.Helper.GetPublicKeyFromPrivateKey(input_prikey.value.hexToBytes()).toHexString();
                    }
                }
                catch (e) {
                    alert(e);
                }
            });
        }
    }
    App.convert = convert;
    window.onload = () => {
        const c = new convert();
        c.start();
    };
})(App || (App = {}));
//# sourceMappingURL=convert.js.map