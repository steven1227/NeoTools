// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>

namespace App {

   export class CreateUnSignTx {
        key: key;
        start(): void {
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
            label.textContent = "发起交易地址：";
            const input_sender = document.createElement("input");
            div.appendChild(input_sender);
            input_sender.style.width = "500px";
            input_sender.style.position = "absoulte";
            input_sender.multiple = true;
            input_sender.value = "AGCcgY7dnykAkJbYqhKjKCTKPygvTKWVv9";
            div.appendChild(document.createElement("br"));

            // label = document.createElement("label");
            // div.appendChild(label);
            // label.textContent = "接受gas/neo地址（如果没有不填）：";
            // label.className = "item";
            // const input_receiver = document.createElement("input");
            // div.appendChild(input_receiver);
            // input_receiver.style.width = "500px";
            // input_receiver.style.position = "absoulte";
            // input_receiver.multiple = true;
            // input_receiver.className = "item";
            // input_receiver.value = "";
            // div.appendChild(document.createElement("br"));

            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "调用合约地址：";
            const input_scHash = document.createElement("input");
            div.appendChild(input_scHash);
            input_scHash.style.width = "500px";
            input_scHash.style.position = "absoulte";
            input_scHash.multiple = true;
            input_scHash.value = "0x74f2dc36a68fdc4682034178eb2220729231db76";
            div.appendChild(document.createElement("br"));

            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "调用合约参数：";
            const text_scParams = document.createElement("textarea");
            div.appendChild(text_scParams);
            text_scParams.style.width = "1000px";
            text_scParams.style.height = "200px";
            const defaultParams = String.raw`[
    "(str)transfer",
    [
        "(addr)AGCcgY7dnykAkJbYqhKjKCTKPygvTKWVv9",
        "(addr)AeYiwwjiy2nKXoGLDafoTXc1tGvfkTYQcM",
        "(int)100"
    ]
]`;
            text_scParams.textContent = defaultParams;
            div.appendChild(document.createElement("br"));

            // label = document.createElement("label");
            // div.appendChild(label);
            // label.textContent = "neo转账数量：";
            // const input_neoAmount = document.createElement("input");
            // div.appendChild(input_neoAmount);
            // input_neoAmount.style.width = "500px";
            // input_neoAmount.style.position = "absoulte";
            // input_neoAmount.multiple = true;
            // input_neoAmount.className = "item";
            // input_neoAmount.value = "0";
            // div.appendChild(document.createElement("br"));

            // label = document.createElement("label");
            // div.appendChild(label);
            // label.textContent = "gas转账数量：";
            // const input_gasAmount = document.createElement("input");
            // div.appendChild(input_gasAmount);
            // input_gasAmount.style.width = "500px";
            // input_gasAmount.style.position = "absoulte";
            // input_gasAmount.multiple = true;
            // input_gasAmount.className = "item";
            // input_gasAmount.value = "0";
            // div.appendChild(document.createElement("br"));

            const btn_ok = document.createElement("button");
            div.appendChild(btn_ok);
            btn_ok.textContent = "生成交易（交易未签名，如需发送上链还需要签名）：";
            div.appendChild(document.createElement("br"));

            const text_tran = document.createElement("textarea");
            div.appendChild(text_tran);
            text_tran.style.width = "1000px";
            text_tran.style.height = "100px";
            text_tran.textContent = "";
            div.appendChild(document.createElement("br"));

        
            btn_ok.onclick = async () => {
                try {
                    let data;
                    // const gasAmount = +input_gasAmount.value;
                    // const neoAmount = +input_neoAmount.value;
                    // const receiver:string = input_receiver.value;

                    if (input_scHash.value != "") {
                        const ps = JSON.parse(text_scParams.value) as any[];
                        const sb = new ThinNeo.ScriptBuilder();
                        const random_int = Neo.BigInteger.random(256);
                        sb.EmitPushNumber(random_int);
                        sb.Emit(ThinNeo.OpCode.DROP);
                        for (let i = ps.length - 1; i >= 0; i--) {
                            sb.EmitParamJson(ps[i]);
                        }
                        const shash = Neo.Uint160.parse(input_scHash.value);
                        sb.EmitAppCall(shash);
                        data = sb.ToArray();
                    }
                    let tran = new ThinNeo.Transaction();
                    const extdata = new ThinNeo.InvokeTransData();
                    extdata.gas = Neo.Fixed8.Zero;
                    extdata.script = data;
                    if (extdata.gas > Neo.Fixed8.Zero){
                        const utxos = await NeoRpc.getUtxosByAddress(input_sender.value);
                        tran = TranHelper.makeTranWithUnSign(utxos,null,"0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",extdata);
                    } else {
                        tran.inputs = new Array<ThinNeo.TransactionInput>(0);
                        tran.outputs = new Array<ThinNeo.TransactionOutput>(0);
                        tran.type = ThinNeo.TransactionType.InvocationTransaction;
                        tran.extdata = extdata;
                        tran.version = 0;
                    }
                    tran.attributes = new Array<ThinNeo.Attribute>(1);
                    tran.attributes[0] = new ThinNeo.Attribute();
                    tran.attributes[0].usage = ThinNeo.TransactionAttributeUsage.Script;
                    tran.attributes[0].data = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(input_sender.value);
                    const ms = new Neo.IO.MemoryStream();
                    const w = new Neo.IO.BinaryWriter(ms);
                    tran.SerializeUnsigned(w);
                    const d = new Uint8Array(ms.toArray());
                    text_tran.textContent = d.toHexString();

                    //fot test
                    // const priKey = ThinNeo.Helper.GetPrivateKeyFromWIF("L5BfehWi3357njK2cnBePtreNWdDXouAYzgUYpdJYUoJ8NefCVyS");
                    // const pubKey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(priKey);
                    // const address = ThinNeo.Helper.GetAddressFromPublicKey(pubKey);
                    // const signData = ThinNeo.Helper.Sign(tran.GetMessage(),priKey);
                    // tran.AddWitness(signData, pubKey, address);
                    // text_tran.textContent = tran.GetRawData().toHexString();
                }
                catch (e) {
                    alert(e);
                }
            }
                
        }
    }

    window.onload = () =>
    {
        const cm = new CreateUnSignTx();
        cm.start();
    };

}

