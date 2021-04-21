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
    let KeyType;
    (function (KeyType) {
        KeyType[KeyType["Unknow"] = 0] = "Unknow";
        KeyType[KeyType["Simple"] = 1] = "Simple";
        KeyType[KeyType["MultiSign"] = 2] = "MultiSign";
    })(KeyType = App.KeyType || (App.KeyType = {}));
    class key {
        constructor() {
            this.MKey_Pubkeys = new Array(0);
        }
        ToString() {
            if (this.multisignkey == false) {
                const pubkey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(this.prikey);
                const address = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                return address;
            }
            else {
                try {
                    return "M" + this.MKey_NeedCount + "/" + this.MKey_Pubkeys.length + ":" + this.GetAddress();
                }
                catch (e) {
                    return e;
                }
            }
        }
        GetMultiContract() {
            if (!(1 <= this.MKey_NeedCount && this.MKey_NeedCount <= this.MKey_Pubkeys.length && this.MKey_Pubkeys.length <= 1024))
                throw new Error();
            const sb = new ThinNeo.ScriptBuilder();
            {
                sb.EmitPushNumber(Neo.BigInteger.parse(this.MKey_NeedCount.toString()));
                for (let i = 0; i < this.MKey_Pubkeys.length; i++) {
                    const pkey = this.MKey_Pubkeys[i];
                    sb.EmitPushBytes(pkey);
                }
                sb.EmitPushNumber(Neo.BigInteger.parse(this.MKey_Pubkeys.length.toString()));
                sb.Emit(ThinNeo.OpCode.CHECKMULTISIG);
                return sb.ToArray();
            }
        }
        GetAddress() {
            if (this.multisignkey == false) {
                return this.ToString();
            }
            else { //计算多签地址
                const contract = this.GetMultiContract();
                const scripthash = ThinNeo.Helper.GetScriptHashFromScript(contract);
                const address = ThinNeo.Helper.GetAddressFromScriptHash(scripthash);
                return address;
            }
        }
        AddPubkey(pubkey) {
            for (let i = 0; i < this.MKey_Pubkeys.length; i++) {
                const k = this.MKey_Pubkeys[i];
                if (k == pubkey)
                    return;
                const s1 = k.toHexString();
                const s2 = pubkey.toHexString();
                if (s1 == s2)
                    return;
            }
            this.MKey_Pubkeys.push(pubkey);
            this.MKey_Pubkeys.sort((a, b) => {
                const pa = Neo.Cryptography.ECPoint.decodePoint(a, Neo.Cryptography.ECCurve.secp256r1);
                const pb = Neo.Cryptography.ECPoint.decodePoint(b, Neo.Cryptography.ECCurve.secp256r1);
                return pa.compareTo(pb);
            });
        }
    }
    App.key = key;
    class Tx {
        HasKeyInfo() {
            for (const k in this.keyinfos.keys) {
                const value = this.keyinfos[k];
                if (value.type != KeyType.Unknow)
                    return true;
            }
            return false;
        }
        HasAllKeyInfo() {
            for (const k in this.keyinfos.keys) {
                const value = this.keyinfos[k];
                if (value.type == KeyType.Unknow)
                    return false;
                if (value.type == KeyType.Simple)
                    if (value.signdata == null || value.signdata[0] == null || value.signdata[0].length == 0)
                        return false;
                if (value.type == KeyType.MultiSign) {
                    const m = value.MultiSignKey.MKey_NeedCount;
                    let c = 0;
                    for (let i = 0; i < value.MultiSignKey.MKey_Pubkeys.length; i++) {
                        const data = value.signdata[i];
                        if (data != null && data.length > 0)
                            c++;
                    }
                    if (c < m)
                        return false;
                }
            }
            return true;
        }
        FillRaw() {
            this.txraw.witnesses = new Array(this.keyinfos.keys.length);
            const keys = new Array();
            for (const k in this.keyinfos) {
                const value = this.keyinfos[k];
                keys.push(value);
            }
            //keys 需要排序
            for (let i = 0; i < keys.length; i++) {
                this.txraw.witnesses[i] = new ThinNeo.Witness();
                if (keys[i].type == KeyType.Simple) {
                    //算出vscript
                    this.txraw.witnesses[i].VerificationScript = ThinNeo.Helper.GetPublicKeyScriptHashFromPublicKey(keys[i].pubKey);
                    const sb = new ThinNeo.ScriptBuilder();
                    sb.EmitPushBytes(keys[i].signdata[0]);
                    this.txraw.witnesses[i].InvocationScript = sb.ToArray();
                }
                if (keys[i].type == KeyType.MultiSign) {
                    //算出vscript
                    this.txraw.witnesses[i].VerificationScript = keys[i].MultiSignKey.GetMultiContract();
                    const signs = new Array();
                    for (let ii = 0; ii < keys[i].signdata.length; ii++) {
                        const s = keys[i].signdata[ii];
                        if (s != null && s.length > 0) {
                            signs.push(s);
                        }
                    }
                    const sb = new ThinNeo.ScriptBuilder();
                    for (let iss = 0; iss < keys[i].MultiSignKey.MKey_NeedCount; iss++) {
                        sb.EmitPushBytes(signs[iss]);
                    }
                    this.txraw.witnesses[i].InvocationScript = sb.ToArray();
                }
            }
        }
        ToString() {
            const ms = new Neo.IO.MemoryStream();
            this.txraw.SerializeUnsigned(new Neo.IO.BinaryWriter(ms));
            const data = ms.toArray();
            let outstr = new Uint8Array(data, 0, data.byteLength).toHexString();
            if (this.HasKeyInfo) {
                const json = this.ExoprtKeyInfo();
                outstr += "|" + JSON.stringify(json);
            }
            return outstr;
        }
        ExoprtKeyInfo() {
            const json = new Map();
            for (const k in this.keyinfos) {
                const value = this.keyinfos[k];
                if (value.type == KeyType.Unknow) {
                    continue;
                }
                const keyitem = new Map();
                console.log(value["type"]);
                keyitem["type"] = KeyType[value["type"]];
                if (value["type"] == KeyType.Simple) {
                    const strsigndata = value["signdata"][0] == null ? "<null>" : value["signdata"][0].toHexString();
                    keyitem["sign0"] = strsigndata;
                    const strpubkey = value["pubKey"] == null ? "<null>" : value["pubKey"].toHexString();
                    keyitem["pkey0"] = strpubkey;
                }
                else if (value["type"] == KeyType.MultiSign) {
                    keyitem["m"] = value["MultiSignKey"]["MKey_NeedCount"];
                    keyitem["c"] = value["MultiSignKey"]["MKey_Pubkeys"].length;
                    for (let i = 0; i < value["MultiSignKey"]["MKey_Pubkeys"].length; i++) {
                        const strpubkey = value["MultiSignKey"]["MKey_Pubkeys"][i].toHexString();
                        keyitem["pkey" + i] = strpubkey;
                        const strsigndata = value["signdata"][i] == null ? "<null>" : value["signdata"][i].toHexString();
                        keyitem["sign" + i] = strsigndata;
                    }
                }
                json[value["keyaddress"]] = keyitem;
            }
            return json;
        }
        ImportKeyInfo(keys, json) {
            console.log(JSON.stringify(keys));
            if (this.keyinfos == null) {
                this.keyinfos = new Map();
            }
            if (!this.txraw) {
                console.log("没有交易体");
                return;
            }
            for (let i = 0; i < this.txraw.attributes.length; i++) {
                const att = this.txraw.attributes[i];
                if (att.usage == ThinNeo.TransactionAttributeUsage.Script) {
                    //附加鉴证，有这个，说明需要这个签名
                    const addr = ThinNeo.Helper.GetAddressFromScriptHash(att.data);
                    if (!this.keyinfos[addr]) {
                        this.keyinfos[addr] = new KeyInfo();
                        this.keyinfos[addr].type = KeyType.Unknow;
                        this.keyinfos[addr].keyaddress = addr;
                    }
                    for (let ii = 0; ii < keys.length; ii++) {
                        const k = keys[ii];
                        if (k.GetAddress() == addr) {
                            if (k.multisignkey == false) {
                                this.keyinfos[addr].type = KeyType.Simple;
                                this.keyinfos[addr].pubKey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(k.prikey);
                                if (this.keyinfos[addr].signdata == null) {
                                    this.keyinfos[addr].signdata = new Array();
                                    this.keyinfos[addr].signdata.push(null);
                                }
                            }
                            else {
                                this.keyinfos[addr].type = KeyType.MultiSign;
                                this.keyinfos[addr].MultiSignKey = k;
                                if (this.keyinfos[addr].signdata == null) {
                                    this.keyinfos[addr].signdata = new Array();
                                    for (let iii = 0; iii < k.MKey_Pubkeys.length; iii++) {
                                        this.keyinfos[addr].signdata.push(null);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //从json导入已经做了的签名
            if (json != null) {
                for (const k in json) {
                    if (this.keyinfos[k]) {
                        const type = json[k]["type"];
                        this.keyinfos[k].type = type;
                        if (this.keyinfos[k].type == KeyType[KeyType.Simple]) {
                            if (this.keyinfos[k].signdata == null) {
                                this.keyinfos[k].signdata = new Array();
                                this.keyinfos[k].signdata.push(null);
                            }
                            const data = json[k]["sign0"];
                            if (data != "<null>") {
                                this.keyinfos[k].signdata[0] = data.hexToBytes();
                            }
                            const pkey = json[k]["pkey0"];
                            this.keyinfos[k].pubkey = pkey.hexToBytes();
                        }
                        if (this.keyinfos[k].type == KeyType[KeyType.MultiSign]) {
                            const m = Number.parseInt(json[k]["m"]);
                            const c = Number.parseInt(json[k]["c"]);
                            const pubkeys = new Array();
                            if (this.keyinfos[k].signdata == null) {
                                this.keyinfos[k].signdata = new Array();
                                for (let i = 0; i < c; i++) {
                                    this.keyinfos[k].signdata.push(null);
                                }
                            }
                            for (let i = 0; i < c; i++) {
                                const data = json[k]["sign" + i];
                                if (data != "<null>") {
                                    this.keyinfos[k].signdata[i] = data.hexToBytes();
                                }
                                const pkey = json[k]["pkey" + i];
                                pubkeys.push(pkey.hexToBytes());
                            }
                            let _key = null;
                            for (let i = 0; i < keys.length; i++) {
                                const _k = keys[i].GetAddress();
                                if (_k == k) {
                                    _key = keys[i];
                                    break;
                                }
                            }
                            //没有这个key 直接导入
                            if (_key == null) {
                                _key = new key();
                                _key.MKey_NeedCount = m;
                                _key.MKey_Pubkeys = pubkeys;
                                _key.multisignkey = true;
                                _key.prikey = null;
                                keys.push(_key);
                            }
                            this.keyinfos[k].MultiSignKey = _key;
                        }
                    }
                }
            }
        }
        FromString(keys, info) {
            let txdata;
            //有附加信息
            let keyinfo = null;
            if (info.indexOf("|") > 0) {
                const ss = info.split("|");
                txdata = ss[0].hexToBytes();
                keyinfo = JSON.parse(ss[1]);
            }
            else {
                txdata = info.hexToBytes();
            }
            this.txraw = new ThinNeo.Transaction();
            const ms = new Neo.IO.MemoryStream(txdata.buffer, 0, txdata.byteLength);
            const br = new Neo.IO.BinaryReader(ms);
            this.txraw.Deserialize(br);
            this.ImportKeyInfo(keys, keyinfo);
        }
    }
    App.Tx = Tx;
    class KeyInfo {
    }
    App.KeyInfo = KeyInfo;
    class Utxo {
    }
    App.Utxo = Utxo;
    class TranHelper {
        static makeTranWithUnSign(map_utxos, targetAddr, assetid, extdata) {
            const sendcount = extdata.gas;
            if (!map_utxos.has(assetid))
                alert("没有utxo");
            const utxos = map_utxos[assetid];
            const tran = new ThinNeo.Transaction();
            tran.type = extdata.script == null ? ThinNeo.TransactionType.ContractTransaction : ThinNeo.TransactionType.InvocationTransaction;
            tran.version = sendcount > Neo.Fixed8.Zero ? 1 : 0;
            tran.extdata = extdata;
            utxos.sort((_a, _b) => {
                if (_a.Value > _b.Value) {
                    return 1;
                }
                else if (_a.Value < _b.Value) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
            let srcaddr = "";
            let count = 0;
            const inputs = new Array();
            for (let i = 0; i < utxos.length; i++) {
                const input = new ThinNeo.TransactionInput();
                input.hash = utxos[i].Txid.toArray();
                input.index = utxos[i].N;
                inputs.push(input);
                count += utxos[i].Value;
                srcaddr = utxos[i].Addr;
                if (Neo.Fixed8.parse(count.toString()) >= sendcount) {
                    break;
                }
            }
            tran.inputs = inputs;
            if (Neo.Fixed8.parse(count.toString()) >= sendcount) {
                const outputs = new Array();
                if (sendcount > Neo.Fixed8.Zero && targetAddr != null) {
                    const output = new ThinNeo.TransactionOutput();
                    output.assetId = Neo.Uint256.parse(assetid).toArray();
                    output.value = sendcount;
                    output.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(targetAddr);
                    outputs.push(output);
                }
                //找零
                const change = count - (+sendcount.toString());
                if (change > 0) {
                    const output = new ThinNeo.TransactionOutput();
                    output.assetId = Neo.Uint256.parse(assetid).toArray();
                    output.value = Neo.Fixed8.parse(change.toString());
                    output.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(srcaddr);
                    outputs.push(output);
                }
                tran.outputs = outputs;
            }
            else {
                alert("没钱");
            }
            return tran;
        }
    }
    App.TranHelper = TranHelper;
    class NeoRpc {
        static makeRpcUrl(url, method, ..._params) {
            if (url[url.length - 1] != '/')
                url = url + "/";
            let urlout = url + "?jsonrpc=2.0&id=1&method=" + method + "&params=[";
            for (let i = 0; i < _params.length; i++) {
                urlout += JSON.stringify(_params[i]);
                if (i != _params.length - 1)
                    urlout += ",";
            }
            urlout += "]";
            return urlout;
        }
        static makeRpcPostBody(method, ..._params) {
            const body = {};
            body["jsonrpc"] = "2.0";
            body["id"] = 1;
            body["method"] = method;
            const params = [];
            for (let i = 0; i < _params.length; i++) {
                params.push(_params[i]);
            }
            body["params"] = params;
            return body;
        }
        static getunspents(addr) {
            return __awaiter(this, void 0, void 0, function* () {
                const postdata = NeoRpc.makeRpcPostBody("getunspents", addr);
                const result = yield fetch(NeoRpc.url, { "method": "post", "body": JSON.stringify(postdata) });
                const json = yield result.json();
                const r = json["result"];
                return r ? r : [];
            });
        }
        static getUtxosByAddress(addr) {
            return __awaiter(this, void 0, void 0, function* () {
                const balance = (yield NeoRpc.getunspents(addr))["balance"];
                const m = new Map();
                balance.forEach((b) => {
                    const unspent = b["unspent"];
                    unspent.forEach((u) => {
                        const asset = b["asset_hash"];
                        const utxo = new Utxo();
                        utxo.Txid = Neo.Uint256.parse(u["txid"]);
                        utxo.Asset = asset;
                        utxo.Addr = addr;
                        utxo.Value = +u["value"];
                        utxo.N = +u["n"];
                        if (m.has(asset)) {
                            m[asset].push(utxo);
                        }
                        else {
                            const l = new Array();
                            l.push(utxo);
                            m[asset] = l;
                        }
                    });
                });
                return m;
            });
        }
    }
    NeoRpc.url = "http://seed2.ngd.network:10332";
    App.NeoRpc = NeoRpc;
})(App || (App = {}));
//# sourceMappingURL=lib.js.map