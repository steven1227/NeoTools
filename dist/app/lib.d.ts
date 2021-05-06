/// <reference path="../neo-sdk/neo-ts.d.ts" />
declare namespace App {
    enum KeyType {
        Unknow = 0,
        Simple = 1,
        MultiSign = 2
    }
    class key {
        multisignkey: boolean;
        prikey: Uint8Array;
        MKey_NeedCount: number;
        MKey_Pubkeys: Array<Uint8Array>;
        constructor();
        ToString(): string;
        GetMultiContract(): Uint8Array;
        GetAddress(): string;
        AddPubkey(pubkey: Uint8Array): void;
    }
    class Tx {
        txraw: ThinNeo.Transaction;
        keyinfos: Map<string, KeyInfo>;
        HasKeyInfo(): boolean;
        HasAllKeyInfo(): boolean;
        FillRaw(): void;
        ToString(): string;
        ExoprtKeyInfo(): any;
        ImportKeyInfo(keys: Array<key>, json: any): void;
        FromString(keys: Array<key>, info: string): void;
    }
    class KeyInfo {
        keyaddress: string;
        type: KeyType;
        MultiSignKey: key;
        pubKey: Uint8Array;
        signdata: Array<Uint8Array>;
    }
    class Utxo {
        Txid: Neo.Uint256;
        N: number;
        Addr: string;
        Asset: string;
        Value: number;
    }
    class TranHelper {
        static makeTranWithUnSign(map_utxos: Map<string, Array<Utxo>>, targetAddr: string, assetid: string, extdata: ThinNeo.InvokeTransData): ThinNeo.Transaction;
    }
    class NeoRpc {
        static url: string;
        static makeRpcUrl(url: string, method: string, ..._params: any[]): string;
        static makeRpcPostBody(method: string, ..._params: any[]): any;
        static send(url: string, raw: string): Promise<any>;
        static getunspents(url: string, addr: string): Promise<any>;
        static getUtxosByAddress(url: string, addr: string): Promise<Map<string, Utxo[]>>;
    }
}
