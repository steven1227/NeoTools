// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../dist/neo-sdk/neo-ts.d.ts"/>

namespace App{
    export enum KeyType {
        Unknow,
        Simple,
        MultiSign,
    }
    
    export class key
    {
        multisignkey: boolean;
        prikey: Uint8Array;
        MKey_NeedCount: number;
        MKey_Pubkeys: Array<Uint8Array>;
        constructor(){
            this.MKey_Pubkeys = new Array(0);
        }
        ToString(): string {
            if (this.multisignkey == false) {
                const pubkey: Uint8Array = ThinNeo.Helper.GetPublicKeyFromPrivateKey(this.prikey);
                const address: string = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);
                return address;
            }
            else
            {
                try {
                    return "M" + this.MKey_NeedCount + "/" + this.MKey_Pubkeys.length + ":" + this.GetAddress();
                }
                catch (e)
                {
                    return e;
                }
            }
        }
    
        GetMultiContract(): Uint8Array {
            if (!(1 <= this.MKey_NeedCount && this.MKey_NeedCount <= this.MKey_Pubkeys.length && this.MKey_Pubkeys.length <= 1024))
                throw new Error();
            const sb: ThinNeo.ScriptBuilder = new ThinNeo.ScriptBuilder();
            {
                sb.EmitPushNumber(Neo.BigInteger.parse(this.MKey_NeedCount.toString()));
                for (let i = 0; i < this.MKey_Pubkeys.length; i++)
                {
                    const pkey: Uint8Array = this.MKey_Pubkeys[i];
                    sb.EmitPushBytes(pkey);
                }
                sb.EmitPushNumber(Neo.BigInteger.parse(this.MKey_Pubkeys.length.toString()));
                sb.Emit(ThinNeo.OpCode.CHECKMULTISIG);
                return sb.ToArray();
            }
        }
    
        GetAddress(): string {
            if (this.multisignkey == false) {
                return this.ToString();
            }
            else {//计算多签地址
                const contract = this.GetMultiContract();
                const scripthash = ThinNeo.Helper.GetScriptHashFromScript(contract);
                const address = ThinNeo.Helper.GetAddressFromScriptHash(scripthash);
                return address;
            }
        }
    
        AddPubkey(pubkey: Uint8Array): void {
            for (let i = 0; i < this.MKey_Pubkeys.length; i++) {
                const k: Uint8Array = this.MKey_Pubkeys[i];
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
    
    export class Tx {
        txraw: ThinNeo.Transaction;
        keyinfos: Map<string, KeyInfo>;
        HasKeyInfo(): boolean {
            for (const k in this.keyinfos.keys) {
                const value = this.keyinfos[k] as KeyInfo;
                if (value.type != KeyType.Unknow)
                    return true;
            }
            return false;
        }
        HasAllKeyInfo(): boolean {
            for (const k in this.keyinfos.keys) {
                const value = this.keyinfos[k] as KeyInfo;
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
            this.txraw.witnesses = new Array<ThinNeo.Witness>(this.keyinfos.keys.length);
            const keys: Array<KeyInfo> = new Array<KeyInfo>();
            for (const k in this.keyinfos) {
                const value = this.keyinfos[k] as KeyInfo;
                keys.push(value);
            }
            //keys 需要排序
            for (let i = 0; i < keys.length; i++) {
                this.txraw.witnesses[i] = new ThinNeo.Witness();
                if (keys[i].type == KeyType.Simple) {
                    //算出vscript
                    this.txraw.witnesses[i].VerificationScript = ThinNeo.Helper.GetPublicKeyScriptHashFromPublicKey(keys[i].pubKey);
                    const sb: ThinNeo.ScriptBuilder = new ThinNeo.ScriptBuilder();
                    sb.EmitPushBytes(keys[i].signdata[0]);
                    this.txraw.witnesses[i].InvocationScript = sb.ToArray();
                }
                if (keys[i].type == KeyType.MultiSign) {
                    //算出vscript
                    this.txraw.witnesses[i].VerificationScript = keys[i].MultiSignKey.GetMultiContract();
                    const signs: Array<Uint8Array> = new Array<Uint8Array>();
                    for (let ii = 0; ii < keys[i].signdata.length; ii++) {
                        const s = keys[i].signdata[ii];
                        if (s != null && s.length > 0) {
                            signs.push(s);
                        }
                    }
                    const sb: ThinNeo.ScriptBuilder = new ThinNeo.ScriptBuilder();
                    for (let iss = 0; iss < keys[i].MultiSignKey.MKey_NeedCount; iss++) {
                        sb.EmitPushBytes(signs[iss]);
                    }
                    this.txraw.witnesses[i].InvocationScript = sb.ToArray();
                }
    
            }
        }
    
        ToString(): string {
            const ms: Neo.IO.MemoryStream = new Neo.IO.MemoryStream();
            this.txraw.SerializeUnsigned(new Neo.IO.BinaryWriter(ms));
            const data = ms.toArray();
            let outstr = new Uint8Array(data, 0, data.byteLength).toHexString();
            if (this.HasKeyInfo) {
                const json = this.ExoprtKeyInfo();
                outstr += "|" + JSON.stringify(json);
            }
            return outstr; 
        }
    
        ExoprtKeyInfo(): any {
            const json: Map<string,any> = new Map<string,any>();
            for (const k in this.keyinfos) {
                const value = this.keyinfos[k] as KeyInfo;
                if (value.type == KeyType.Unknow) {
                    continue;
                }
                const keyitem : Map<string,any> = new Map<string,any>();
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
    
        ImportKeyInfo(keys: Array<key>, json:any) {
            console.log(JSON.stringify(keys));
            if (this.keyinfos == null) {
                this.keyinfos = new Map<string, KeyInfo>();
            }
    
            if (!this.txraw){
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
                                (this.keyinfos[addr] as KeyInfo).type = KeyType.Simple;
                                (this.keyinfos[addr] as KeyInfo).pubKey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(k.prikey);
                                if ((this.keyinfos[addr] as KeyInfo).signdata == null) {
                                    (this.keyinfos[addr] as KeyInfo).signdata = new Array<Uint8Array>();
                                    (this.keyinfos[addr] as KeyInfo).signdata.push(null);
                                }
                            }
                            else {
                                this.keyinfos[addr].type = KeyType.MultiSign;
                                this.keyinfos[addr].MultiSignKey = k;
                                if ((this.keyinfos[addr] as KeyInfo).signdata == null) {
                                    (this.keyinfos[addr] as KeyInfo).signdata = new Array<Uint8Array>();
                                    for (let iii = 0; iii < k.MKey_Pubkeys.length; iii++) {
                                        (this.keyinfos[addr] as KeyInfo).signdata.push(null);
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
                        (this.keyinfos[k] as KeyInfo).type = type;
                        if (this.keyinfos[k].type == KeyType[KeyType.Simple]) {
                            if (this.keyinfos[k].signdata == null) {
                                this.keyinfos[k].signdata = new Array<Uint8Array>();
                                this.keyinfos[k].signdata.push(null);
                            }
                            const data = json[k]["sign0"] as string;
                            if (data != "<null>") {
                                this.keyinfos[k].signdata[0] = data.hexToBytes();
                            }
                            const pkey = json[k]["pkey0"] as string;
                            this.keyinfos[k].pubkey = pkey.hexToBytes();
                        }
                        if (this.keyinfos[k].type == KeyType[KeyType.MultiSign]) {
                            const m = Number.parseInt(json[k]["m"]);
                            const c = Number.parseInt(json[k]["c"]);
                            const pubkeys = new Array<Uint8Array>();
                            if (this.keyinfos[k].signdata == null) {
                                this.keyinfos[k].signdata = new Array<Uint8Array>();
                                for (let i = 0; i < c; i++) {
                                    this.keyinfos[k].signdata.push(null);
                                }
                            }
                            for (let i = 0; i < c; i++) {
                                const data = json[k]["sign" + i] as string;
                                if (data != "<null>") {
                                    this.keyinfos[k].signdata[i] = data.hexToBytes();
                                }
                                const pkey = json[k]["pkey" + i] as string;
                                pubkeys.push(pkey.hexToBytes());
                            }
                            let _key: key = null;
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
                            (this.keyinfos[k] as KeyInfo).MultiSignKey = _key;
                        }
                    }
                }
            }
        }
    
        FromString(keys: Array<key>, info: string) {
            let txdata: Uint8Array;
            //有附加信息
            let keyinfo = null;
            if (info.indexOf("|")>0) {
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
    
    export class KeyInfo {
        keyaddress: string;
        type: KeyType;
        MultiSignKey: key;
        pubKey: Uint8Array;
        signdata: Array<Uint8Array>;
    }
    
    export class Utxo {
        Txid : Neo.Uint256;
        N : number;
        Addr : string;
        Asset : string;
        Value : number;
    }
    
    export class TranHelper {
        static makeTranWithUnSign(map_utxos:Map<string,Array<Utxo>>, targetAddr:string, assetid:string, extdata:ThinNeo.InvokeTransData){
            const sendcount = extdata.gas;
            if (!map_utxos.has(assetid))
                alert("没有utxo");
            const utxos:Array<Utxo> = map_utxos[assetid];
            const tran = new ThinNeo.Transaction();
            tran.type = extdata.script == null ? ThinNeo.TransactionType.ContractTransaction : ThinNeo.TransactionType.InvocationTransaction;
            tran.version = sendcount > Neo.Fixed8.Zero ? 1 : 0;
            tran.extdata = extdata;
            utxos.sort((_a,_b)=>{
                if(_a.Value > _b.Value){
                    return 1;
                } else if (_a.Value < _b.Value){
                    return -1;
                } else {
                    return 0;
                }
            });
            let srcaddr = "";
            let count = 0;
            const inputs:Array<ThinNeo.TransactionInput>  = new Array<ThinNeo.TransactionInput>();
            for(let i = 0;i < utxos.length;i++){
                const input:ThinNeo.TransactionInput = new ThinNeo.TransactionInput();
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
                const outputs:Array<ThinNeo.TransactionOutput> = new Array<ThinNeo.TransactionOutput>();
                if (sendcount > Neo.Fixed8.Zero && targetAddr != null) {
                    const output:ThinNeo.TransactionOutput = new ThinNeo.TransactionOutput();
                    output.assetId = Neo.Uint256.parse(assetid).toArray();
                    output.value = sendcount;
                    output.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(targetAddr);
                    outputs.push(output);
                }
                //找零
                const change = count - (+sendcount.toString());
                if (change > 0){
                    const output:ThinNeo.TransactionOutput = new ThinNeo.TransactionOutput();
                    output.assetId = Neo.Uint256.parse(assetid).toArray();
                    output.value = Neo.Fixed8.parse(change.toString());
                    output.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(srcaddr);
                    outputs.push(output);
                }
                tran.outputs = outputs;
            } else {
                alert("没钱");
            }
            return tran;
        }
    }
    
    export class NeoRpc {
        static url = "http://seed2.ngd.network:10332";
    
        static makeRpcUrl(url: string, method: string, ..._params: any[])
        {
            if (url[url.length - 1] != '/')
                url = url + "/";
            let urlout = url + "?jsonrpc=2.0&id=1&method=" + method + "&params=[";
            for (let i = 0; i < _params.length; i++)
            {
                urlout += JSON.stringify(_params[i]);
                if (i != _params.length - 1)
                    urlout += ",";
            }
            urlout += "]";
            return urlout;
        }
        static makeRpcPostBody(method: string, ..._params: any[]): any
        {
            const body = {};
            body["jsonrpc"] = "2.0";
            body["id"] = 1;
            body["method"] = method;
            const params = [];
            for (let i = 0; i < _params.length; i++)
            {
                params.push(_params[i]);
            }
            body["params"] = params;
            return body;
        }
    
        static async send(url:string,raw:string){
            const postdata =
                NeoRpc.makeRpcPostBody(
                    "sendrawtransaction",
                    raw
                );
            const result = await fetch(url, { "method": "post", "body": JSON.stringify(postdata) });
            const json = await result.json();
            const r = json["result"];
            return r ? r : json["error"];
        }
    
        static async getunspents(url:string, addr: string)
        {
            const postdata =
                NeoRpc.makeRpcPostBody(
                    "getunspents",
                    addr
                );
            const result = await fetch(url, { "method": "post", "body": JSON.stringify(postdata) });
            const json = await result.json();
            const r = json["result"];
            return r ? r : [];
        }
    
        static async getUtxosByAddress(url:string, addr:string) 
        {
            const balance = (await NeoRpc.getunspents(url,addr))["balance"];
            const m : Map<string,Array<Utxo>> = new Map<string,Array<Utxo>>();
            balance.forEach((b: { [x: string]: any; })  => {
                const unspent = b["unspent"];
                unspent.forEach((u: { [x: string]: string; }) => {
                    const asset = b["asset_hash"];
                    const utxo = new Utxo();
                    utxo.Txid = Neo.Uint256.parse(u["txid"]);
                    utxo.Asset = asset;
                    utxo.Addr = addr;
                    utxo.Value = +u["value"];
                    utxo.N = +u["n"];
                    if (m.has(asset)){
                        m[asset].push(utxo);
                    } else {
                        const l = new Array<Utxo>();
                        l.push(utxo);
                        m[asset] = l;
                    }
                });
            });
            return m;
        }
    
    }
}


