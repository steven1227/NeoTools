// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>
// import {key, Tx, KeyType, KeyInfo} from "./lib";

namespace App{
    window.onload = () =>
    {
        const casm = new CreateAndSignMulti();
        casm.start();
    };
    
    export class CreateAndSignMulti {
        keys: Array<key>;
        key: key;
        bError: boolean;
        tx: Tx = new Tx();
        start(): void {
            const div = document.createElement("div");
            div.style.left = "50px";
            div.style.right = "50px";
            div.style.top = "50px";
            div.style.bottom = "50px";
            div.style.position = "absolute";
            div.style.overflow = "auto";
            document.body.appendChild(div);
    
            this.keys = new Array<key>();
            this.key = new key();
            this.key.prikey = null;
            this.key.multisignkey = true;
            this.key.MKey_NeedCount = 1;
            this.key.MKey_Pubkeys = new Array<Uint8Array>();
            this.tx = new Tx();
    
            const lb_nep6 = document.createElement("label");
            div.appendChild(lb_nep6);
            lb_nep6.textContent = "导入nep6钱包";
            //openfile
            const file = document.createElement("input");
            div.appendChild(file);
            file.type = "file";
    
            const lb_pw = document.createElement("label");
            div.appendChild(lb_pw);
            lb_pw.textContent = "密码：";
            const input_pw = document.createElement("input");
            div.appendChild(input_pw);
            input_pw.style.width = "500px";
            input_pw.style.position = "absoulte";
            input_pw.multiple = true;
            input_pw.value = "";
            input_pw.type = "password";
            const btn_login = document.createElement("button");
            btn_login.textContent = "登陆";
            div.appendChild(btn_login);
            div.appendChild(document.createElement("hr"));
    
            let label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "增加多签账户:";
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "填入公钥";
            const input_pubKey = document.createElement("input");
            div.appendChild(input_pubKey);
            input_pubKey.style.width = "500px";
            input_pubKey.style.position = "absoulte";
            input_pubKey.multiple = true;
            input_pubKey.value = "";
            const btn_addPubKey = document.createElement("button");
            div.appendChild(btn_addPubKey);
            btn_addPubKey.textContent = "add pubKey";
            div.appendChild(document.createElement("br"));
            div.appendChild(document.createElement("br"));
            const text_addrs = document.createElement("textarea");
            div.appendChild(text_addrs);
            text_addrs.style.width = "800px";
            text_addrs.style.height = "100px";
            text_addrs.textContent = "";
            text_addrs.readOnly = true;
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "最小签名数";
            const input_count = document.createElement("input");
            div.appendChild(input_count);
            input_count.style.width = "500px";
            input_count.style.position = "absoulte";
            input_count.multiple = true;
            input_count.value = "2";
            const btn_ok = document.createElement("button");
            div.appendChild(btn_ok);
            btn_ok.textContent = "ok";
            div.appendChild(document.createElement("hr"));
    
            const label_account = document.createElement("label");
            div.appendChild(label_account);
            label_account.textContent = "账户列表:";
            div.appendChild(document.createElement("br"));
            const text_account = document.createElement("textarea");
            div.appendChild(text_account);
            text_account.style.width = "1000px";
            text_account.style.height = "100px";
            text_account.textContent = "";
            text_account.readOnly = true;
            div.appendChild(document.createElement("hr"));
    
            const p = document.createElement("p");
            div.appendChild(p);
            p.textContent = "将未签名的数据复制到下方的文本中，签名后复制给其他密钥掌握者";
            p.style.color = "red";
            const text_data = document.createElement("textarea");
            div.appendChild(text_data);
            text_data.style.width = "1000px";
            text_data.style.height = "100px";
            text_data.value = "";
            div.appendChild(document.createElement("br"));
            // const btn_import = document.createElement("button");
            // div.appendChild(btn_import);
            // btn_import.textContent = "导入数据";
            // div.appendChild(document.createElement("hr"));
    
            // const text_tx = document.createElement("textarea");
            // div.appendChild(text_tx);
            // text_tx.style.width = "1000px";
            // text_tx.style.height = "100px";
            // text_tx.textContent = "";
            // text_tx.readOnly = true;
            // div.appendChild(document.createElement("br"));
            const btn_sign = document.createElement("button");
            div.appendChild(btn_sign);
            btn_sign.textContent = "签名";
            div.appendChild(document.createElement("hr"));
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "！！！一定要签名数量足够后再点击后方的按钮，否则数据无效";
            const btn_export = document.createElement("button");
            div.appendChild(btn_export);
            btn_export.textContent = "生成上链数据";
            div.appendChild(document.createElement("br"));
            const text_rawdata = document.createElement("textarea");
            div.appendChild(text_rawdata);
            text_rawdata.style.width = "1000px";
            text_rawdata.style.height = "100px";
            text_rawdata.value = "";
            text_rawdata.readOnly = true;
            const input_cliAddr = document.createElement("input");
            div.appendChild(input_cliAddr);
            input_cliAddr.style.width = "500px";
            input_cliAddr.style.position = "absoulte";
            input_cliAddr.multiple = true;
            input_cliAddr.value = "http://seed5.ngd.network:10332";
            const btn_send = document.createElement("button");
            div.appendChild(btn_send);
            btn_send.textContent = "上链（如果隔几秒节点没反馈，把「5」换个数字继续发）";
            div.appendChild(document.createElement("hr"));
    
    
            let wallet: ThinNeo.nep6wallet;
            const reader = new FileReader();
            reader.onload = (e: Event) => {
                const walletstr = reader.result as string;
                wallet = new ThinNeo.nep6wallet();
                wallet.fromJsonStr(walletstr);
            };
            file.onchange = (ev: Event) => {
                if (file.files[0].name.includes(".json")) {
                    reader.readAsText(file.files[0]);
                }
            }
            btn_login.onclick = () => {
                try{
                    if (!input_pw.value) {
                        alert("请输入密码");
                        return;
                    }
                    const addPrikey = (num: number,wallet: ThinNeo.nep6wallet) => {
                        if (!wallet.accounts[num].nep2key) {
                            alert("nep2key wrong" + wallet.accounts[num].address);
                            return;
                        }
                        wallet.accounts[num].getPrivateKey(wallet.scrypt, input_pw.value, (info: string, result: Uint8Array) => {
                            try{
                                if (info == "finish") {
                                    alert("导入成功");
                                    const priKey = result as Uint8Array;
                                    const _key = new key();
                                    _key.MKey_NeedCount = 0;
                                    _key.MKey_Pubkeys = null;
                                    _key.multisignkey = false;
                                    _key.prikey = priKey;
                                    for (let i = 0; i < this.keys.length; i++) {
                                        if (this.keys[i].ToString() == _key.ToString())
                                            return;
                                    }
                                    this.keys.push(_key);
                                    console.log(priKey);
                                    updateUI();
                                    num = num + 1;
                                    if (wallet.accounts.length <= num)
                                        return;
                                    addPrikey(num, wallet);
                                }
                                else {
                                    alert("地址密钥不符");
                                    num = num + 1;
                                    if (wallet.accounts.length <= num)
                                        return;
                                    addPrikey(num, wallet);
                                }
                            } catch (e){
                                alert(e)
                            }
    
                        });
                    }
                    addPrikey(0, wallet);
                } catch(e){
                    alert(e);
                }
    
            }
    
            btn_addPubKey.onclick = () => {
                const pubKey: string = input_pubKey.value;
                const bytes_pubKey: Uint8Array = pubKey.hexToBytes();
                if (bytes_pubKey.length != 33)
                    return;
    
                this.key.AddPubkey(bytes_pubKey);
    
                //更新text_addrs
                text_addrs.textContent = "";
                for (let i = 0; i < this.key.MKey_Pubkeys.length; i++) {
                    const pubkey = this.key.MKey_Pubkeys[i];
                    const pubkeystr = pubkey.toHexString();
                    const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                    text_addrs.textContent = text_addrs.textContent + address + "[" + pubkeystr + "]"+ "\r\n";
                }
            }
            btn_ok.onclick = () => {
                this.key.MKey_NeedCount = Number.parseInt(input_count.value);
                this.keys.push(this.key);
                updateUI();
            }
            // btn_import.onclick = ()=>{
            //     this.tx.FromString(this.keys, text_data.value);
            //     updateUI();
            // };
            btn_sign.onclick = ()=>{
                sign();
            }
            const sign =  ()=> {
                if( text_data.value == ""){
                    alert("请先构造交易并导入");
                    return;
                }
                this.tx.FromString(this.keys, text_data.value);
                updateUI();
                let signcount = 0;
                const data = this.tx.txraw.GetMessage();
                console.log(this.keys.length);
                for (let i = 0; i < this.keys.length;i++) {
                    const key = this.keys[i]
                    console.log(key);
                    if (key.prikey == null) continue;
                    const addr = key.GetAddress();
                    for (const k in this.tx.keyinfos) {
                        const type = (this.tx.keyinfos[k] as KeyInfo).type;
                        if (type == KeyType.Simple) {
                            if (k == addr) {
                                (this.tx.keyinfos[k] as KeyInfo).signdata[0] = ThinNeo.Helper.Sign(data, key.prikey);
                                signcount++;
                            }
                        }
                        if (type == KeyType.MultiSign) {
                            for (let ii = 0; ii < (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys.length; ii++) {
                                const pub = (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys[ii];
                                const signaddr = ThinNeo.Helper.GetAddressFromPublicKey(pub);
                                if (addr == signaddr) {
                                    (this.tx.keyinfos[k] as KeyInfo).signdata[ii] = ThinNeo.Helper.Sign(data, key.prikey);
                                    signcount++;
                                }
                            }
                        }
                    }
                }
                if (signcount == 0) {
                    alert("没有找到可以签名的");
                } else {
                    updateDataUI();
                }
            }
    
            btn_export.onclick = ()=>{
                if(this.keys.length == 0 && text_data.value != ""){
                    this.tx.FromString(this.keys, text_data.value);
                    updateUI();
                    let signcount = 0;
                    const data = this.tx.txraw.GetMessage();
                    console.log(this.keys.length);
                    for (let i = 0; i < this.keys.length;i++) {
                        const key = this.keys[i]
                        console.log(key);
                        if (key.prikey == null) continue;
                        const addr = key.GetAddress();
                        for (const k in this.tx.keyinfos) {
                            const type = (this.tx.keyinfos[k] as KeyInfo).type;
                            if (type == KeyType.Simple) {
                                if (k == addr) {
                                    (this.tx.keyinfos[k] as KeyInfo).signdata[0] = ThinNeo.Helper.Sign(data, key.prikey);
                                    signcount++;
                                }
                            }
                            if (type == KeyType.MultiSign) {
                                for (let ii = 0; ii < (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys.length; ii++) {
                                    const pub = (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys[ii];
                                    const signaddr = ThinNeo.Helper.GetAddressFromPublicKey(pub);
                                    if (addr == signaddr) {
                                        (this.tx.keyinfos[k] as KeyInfo).signdata[ii] = ThinNeo.Helper.Sign(data, key.prikey);
                                        signcount++;
                                    }
                                }
                            }
                        }
                    }
                }
                updateDataUI(false);
            }
    
            btn_send.onclick = async ()=>{
                let raw = text_rawdata.value;
                if(raw == ""){
                    if(this.tx.HasAllKeyInfo) {
                        this.tx.FillRaw();
                        const str = this.tx.txraw.GetRawData().toHexString();
                        text_rawdata.value = `${str}`;
                    } else {
                        alert("签名信息不完整");
                        return
                    }
                }
                console.log(input_cliAddr.value);
                raw = text_rawdata.value;
                const result = await NeoRpc.send(input_cliAddr.value,raw);
                if (JSON.stringify(result) == "true"){
                    const txid = this.tx.txraw.GetHash().reverse().toHexString();
                    alert(`txid:${txid}`);
                }else {
                    alert(JSON.stringify(result));
                }

            }
    
            const updateUI = () => {
                //更新账户
                text_account.textContent = "";
                for (let i = 0; i < this.keys.length; i++) {
                    const _key = this.keys[i];
                    text_account.textContent = text_account.textContent + _key.ToString() + "\r\n";
                    if (_key.multisignkey) {
                        for (let ii = 0; ii < _key.MKey_Pubkeys.length; ii++) {
                            const pubkey = _key.MKey_Pubkeys[ii];
                            const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                            text_account.textContent = text_account.textContent + "\t" + address + "\r\n";
                        }
                    }
                }
                try {
                    if (this.tx != null) {
                        this.tx.ImportKeyInfo(this.keys,null);
                    }
                    // updateTxUI();
                }
                catch(e)
                {
                    console.log(e);
                }
            }
            // const updateTxUI = () => {
            //     text_tx.textContent = "";
            //     if (this.tx == null) {
            //         text_tx.textContent = "null";
            //     }
            //     else {
            //         text_tx.textContent += ThinNeo.TransactionType[this.tx.txraw.type] + ":" + this.tx.txraw.GetHash().toHexString() + "\r\n";
            //         for (const k in this.tx.keyinfos) {
            //             text_tx.textContent += "\t" + k + ":" + KeyType[(this.tx.keyinfos[k] as KeyInfo).type] + "\r\n";
    
            //             if ((this.tx.keyinfos[k] as KeyInfo).type == KeyType.Unknow) {
            //                 text_tx.textContent += "\t\t" + "<unknow count....>" + "\r\n";
            //             }
            //             if ((this.tx.keyinfos[k] as KeyInfo).type == KeyType.Simple) {
            //                 const signstr = (this.tx.keyinfos[k] as KeyInfo).signdata[0] == null ? "<null>" : (this.tx.keyinfos[k] as KeyInfo).signdata[0].toHexString();
            //                 text_tx.textContent += "\t\t" + "sign0" + signstr + "\r\n";
            //             }
    
            //             if ((this.tx.keyinfos[k] as KeyInfo).type == KeyType.MultiSign) {
            //                 for (let i = 0; i < (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys.length; i++) {
            //                     const pubkey = (this.tx.keyinfos[k] as KeyInfo).MultiSignKey.MKey_Pubkeys[i];
            //                     const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
            //                     const signstr = (this.tx.keyinfos[k] as KeyInfo).signdata[i] == null ? "<null>" : (this.tx.keyinfos[k] as KeyInfo).signdata[i].toHexString();
            //                     text_tx.textContent += "\t\t" + "sign" + i + ":" + address + "=" + signstr+ "\r\n";
            //                 }
            //             }
            //         }
            //     }
            // }
            const updateDataUI = (type = true) => {
                if (type) {
                    text_data.value = this.tx.ToString();
                } else {
                    if(this.tx.HasAllKeyInfo) {
                        this.tx.FillRaw();
                        const str = this.tx.txraw.GetRawData().toHexString();
                        // const txid = this.tx.txraw.GetHash().reverse().toHexString();
                        // text_rawdata.value = `可以发送上链的数据:${str};交易id:${txid}`;
                        text_rawdata.value = `${str}`;
                        // alert(`可以发送上链的数据:${str}     交易id:${txid}`);
                    } else {
                        alert("签名信息不完整");
                    }
                }
    
            }
        }
    }
}
