// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>
var App;
(function (App) {
    window.onload = () => {
        const casm = new CreateAndSignMulti();
        casm.start();
    };
    class CreateAndSignMulti {
        constructor() {
            this.tx = new App.Tx();
        }
        start() {
            const div = document.createElement("div");
            div.style.left = "50px";
            div.style.right = "50px";
            div.style.top = "50px";
            div.style.bottom = "50px";
            div.style.position = "absolute";
            div.style.overflow = "hidden";
            document.body.appendChild(div);
            this.keys = new Array();
            this.key = new App.key();
            this.key.prikey = null;
            this.key.multisignkey = true;
            this.key.MKey_NeedCount = 1;
            this.key.MKey_Pubkeys = new Array();
            this.tx = new App.Tx();
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
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "最小签名数";
            const input_count = document.createElement("input");
            div.appendChild(input_count);
            input_count.style.width = "500px";
            input_count.style.position = "absoulte";
            input_count.multiple = true;
            input_count.value = "";
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
            div.appendChild(document.createElement("hr"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "将未完成签名的数据填入下方的文本中，签名后的数据可以复制给其他密钥掌握者接着签名";
            div.appendChild(document.createElement("br"));
            const text_data = document.createElement("textarea");
            div.appendChild(text_data);
            text_data.style.width = "1000px";
            text_data.style.height = "100px";
            text_data.value = "";
            div.appendChild(document.createElement("br"));
            const btn_import = document.createElement("button");
            div.appendChild(btn_import);
            btn_import.textContent = "导入数据";
            div.appendChild(document.createElement("hr"));
            const text_tx = document.createElement("textarea");
            div.appendChild(text_tx);
            text_tx.style.width = "1000px";
            text_tx.style.height = "100px";
            text_tx.textContent = "";
            div.appendChild(document.createElement("br"));
            const btn_sign = document.createElement("button");
            div.appendChild(btn_sign);
            btn_sign.textContent = "签名(需要先点‘导入数据’让上面的文本框有值)";
            div.appendChild(document.createElement("hr"));
            div.appendChild(document.createElement("br"));
            label = document.createElement("label");
            div.appendChild(label);
            label.textContent = "！！！一定要签名数量足够后再点击后方的按钮，否则数据无效";
            const btn_export = document.createElement("button");
            div.appendChild(btn_export);
            btn_export.textContent = "导出上链数据";
            div.appendChild(document.createElement("br"));
            const text_rawdata = document.createElement("textarea");
            div.appendChild(text_rawdata);
            text_rawdata.style.width = "1000px";
            text_rawdata.style.height = "100px";
            text_rawdata.value = "";
            div.appendChild(document.createElement("hr"));
            let wallet;
            const reader = new FileReader();
            reader.onload = (e) => {
                const walletstr = reader.result;
                wallet = new ThinNeo.nep6wallet();
                wallet.fromJsonStr(walletstr);
            };
            file.onchange = (ev) => {
                if (file.files[0].name.includes(".json")) {
                    reader.readAsText(file.files[0]);
                }
            };
            btn_login.onclick = () => {
                try {
                    if (!input_pw.value) {
                        alert("请输入密码");
                        return;
                    }
                    const addPrikey = (num, wallet) => {
                        if (!wallet.accounts[num].nep2key) {
                            alert("nep2key wrong" + wallet.accounts[num].address);
                            return;
                        }
                        wallet.accounts[num].getPrivateKey(wallet.scrypt, input_pw.value, (info, result) => {
                            try {
                                alert(info);
                                if (info == "finish") {
                                    const priKey = result;
                                    const _key = new App.key();
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
                                    console.log(result);
                                }
                            }
                            catch (e) {
                                alert(e);
                            }
                        });
                    };
                    addPrikey(0, wallet);
                }
                catch (e) {
                    alert(e);
                }
            };
            btn_addPubKey.onclick = () => {
                const pubKey = input_pubKey.value;
                const bytes_pubKey = pubKey.hexToBytes();
                if (bytes_pubKey.length != 33)
                    return;
                this.key.AddPubkey(bytes_pubKey);
                //更新text_addrs
                text_addrs.textContent = "";
                for (let i = 0; i < this.key.MKey_Pubkeys.length; i++) {
                    const pubkey = this.key.MKey_Pubkeys[i];
                    const pubkeystr = pubkey.toHexString();
                    const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                    text_addrs.textContent = text_addrs.textContent + address + "[" + pubkeystr + "]" + "\r\n";
                }
            };
            btn_ok.onclick = () => {
                this.key.MKey_NeedCount = Number.parseInt(input_count.value);
                this.keys.push(this.key);
                updateUI();
            };
            btn_import.onclick = () => {
                this.tx.FromString(this.keys, text_data.value);
                updateUI();
            };
            btn_sign.onclick = () => {
                let signcount = 0;
                const data = this.tx.txraw.GetMessage();
                console.log(this.keys.length);
                for (let i = 0; i < this.keys.length; i++) {
                    const key = this.keys[i];
                    console.log(key);
                    if (key.prikey == null)
                        continue;
                    const addr = key.GetAddress();
                    for (const k in this.tx.keyinfos) {
                        const type = this.tx.keyinfos[k].type;
                        if (type == App.KeyType.Simple) {
                            if (k == addr) {
                                this.tx.keyinfos[k].signdata[0] = ThinNeo.Helper.Sign(data, key.prikey);
                                signcount++;
                            }
                        }
                        if (type == App.KeyType.MultiSign) {
                            for (let ii = 0; ii < this.tx.keyinfos[k].MultiSignKey.MKey_Pubkeys.length; ii++) {
                                const pub = this.tx.keyinfos[k].MultiSignKey.MKey_Pubkeys[ii];
                                const signaddr = ThinNeo.Helper.GetAddressFromPublicKey(pub);
                                if (addr == signaddr) {
                                    this.tx.keyinfos[k].signdata[ii] = ThinNeo.Helper.Sign(data, key.prikey);
                                    signcount++;
                                }
                            }
                        }
                    }
                }
                if (signcount == 0) {
                    alert("没有找到可以签名的");
                }
                else {
                    updateTxUI();
                    updateDataUI();
                }
            };
            btn_export.onclick = () => {
                updateDataUI(false);
            };
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
                        this.tx.ImportKeyInfo(this.keys, null);
                    }
                    updateTxUI();
                }
                catch (e) {
                    console.log(e);
                }
            };
            const updateTxUI = () => {
                text_tx.textContent = "";
                if (this.tx == null) {
                    text_tx.textContent = "null";
                }
                else {
                    text_tx.textContent += ThinNeo.TransactionType[this.tx.txraw.type] + ":" + this.tx.txraw.GetHash().toHexString() + "\r\n";
                    for (const k in this.tx.keyinfos) {
                        text_tx.textContent += "\t" + k + ":" + App.KeyType[this.tx.keyinfos[k].type] + "\r\n";
                        if (this.tx.keyinfos[k].type == App.KeyType.Unknow) {
                            text_tx.textContent += "\t\t" + "<unknow count....>" + "\r\n";
                        }
                        if (this.tx.keyinfos[k].type == App.KeyType.Simple) {
                            const signstr = this.tx.keyinfos[k].signdata[0] == null ? "<null>" : this.tx.keyinfos[k].signdata[0].toHexString();
                            text_tx.textContent += "\t\t" + "sign0" + signstr + "\r\n";
                        }
                        if (this.tx.keyinfos[k].type == App.KeyType.MultiSign) {
                            for (let i = 0; i < this.tx.keyinfos[k].MultiSignKey.MKey_Pubkeys.length; i++) {
                                const pubkey = this.tx.keyinfos[k].MultiSignKey.MKey_Pubkeys[i];
                                const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                                const signstr = this.tx.keyinfos[k].signdata[i] == null ? "<null>" : this.tx.keyinfos[k].signdata[i].toHexString();
                                text_tx.textContent += "\t\t" + "sign" + i + ":" + address + "=" + signstr + "\r\n";
                            }
                        }
                    }
                }
            };
            const updateDataUI = (type = true) => {
                if (type) {
                    text_data.value = this.tx.ToString();
                }
                else {
                    if (this.tx.HasAllKeyInfo) {
                        this.tx.FillRaw();
                        const str = this.tx.txraw.GetRawData().toHexString();
                        const txid = this.tx.txraw.GetHash().reverse().toHexString();
                        text_rawdata.value = `可以发送上链的数据:${str};交易id:${txid}`;
                        // alert(`可以发送上链的数据:${str}     交易id:${txid}`);
                    }
                    else {
                        alert("签名信息不完整");
                    }
                }
            };
        }
    }
    App.CreateAndSignMulti = CreateAndSignMulti;
})(App || (App = {}));
//# sourceMappingURL=createAndSignMulti.js.map