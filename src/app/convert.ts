
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>
// import {key, TranHelper, NeoRpc} from "./lib";

namespace App{
    export class convert {
        key: key;
        start(): void {
            const div = document.createElement("div");
            div.style.left = "50px";
            div.style.right = "50px";
            div.style.top = "50px";
            div.style.bottom = "50px";
            div.style.position = "absolute";
            div.style.overflow = "auto";
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
            const label_prikey = document.createElement("label");
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
            input_prikey.type = "password";
            const label_pubkey = document.createElement("label");
            div.appendChild(label_pubkey);
            label_pubkey.textContent = "";
            div.appendChild(document.createElement("br"));
    
            const btn_convert = document.createElement("button");
            div.appendChild(btn_convert);
            btn_convert.textContent = "转换";
    
            btn_convert.onclick = async () => {
                try {
                    if (input_wif.value != ""){
                        const prikey = ThinNeo.Helper.GetPrivateKeyFromWIF(input_wif.value);
                        label_prikey.textContent = ThinNeo.Helper.GetPublicKeyFromPrivateKey(prikey).toHexString();
                    }
                    if (input_prikey.value != ""){
                        label_pubkey.textContent = ThinNeo.Helper.GetPublicKeyFromPrivateKey(input_prikey.value.hexToBytes()).toHexString();
                    }
                }
                catch (e) {
                    alert(e);
                }
            }
                
        }
    }
    
    window.onload = () =>
    {
        const c = new convert();
        c.start();
    };
}

